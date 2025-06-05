
import { useState, useEffect, useCallback } from 'react';

// TypeScript declarations for Capacitor
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
      Plugins?: {
        Microphone?: any;
      };
    };
  }
}

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

export const useAudioDevices = () => {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Detectar si es entorno móvil o Capacitor
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isCapacitor = window.Capacitor?.isNativePlatform() || false;

  const requestMicrophonePermission = useCallback(async () => {
    console.log('🔐 Solicitando permisos de micrófono...');
    
    try {
      // Para Capacitor, usar permisos nativos primero
      if (isCapacitor && (window as any).Capacitor?.Plugins?.Microphone) {
        console.log('📱 Usando permisos nativos de Capacitor...');
        try {
          const permission = await (window as any).Capacitor.Plugins.Microphone.requestPermission();
          console.log('Permiso nativo:', permission);
          
          if (permission.microphone !== 'granted') {
            throw new Error('Permiso nativo denegado');
          }
        } catch (error) {
          console.log('⚠️ Permisos nativos fallaron, usando web API...');
        }
      }

      // Solicitar permisos web
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Configuración optimizada para móvil
          ...(isMobile || isCapacitor ? {
            sampleRate: { ideal: 48000, min: 16000 },
            channelCount: { ideal: 1 },
            latency: { ideal: 0.01 }
          } : {})
        }
      });
      
      console.log('✅ Permisos web concedidos');
      console.log('Stream tracks:', stream.getTracks().map(track => ({
        kind: track.kind,
        label: track.label,
        deviceId: track.getSettings().deviceId
      })));
      
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      return true;
      
    } catch (error) {
      console.error('❌ Error al solicitar permisos:', error);
      setPermissionGranted(false);
      return false;
    }
  }, [isMobile, isCapacitor]);

  const enumerateDevicesWithRetry = useCallback(async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🔍 Intento ${i + 1} de enumerar dispositivos...`);
        
        // Esperar más tiempo en móvil para que se registren los dispositivos
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, (i * 1000) + 500));
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log(`📱 Dispositivos encontrados (intento ${i + 1}):`, devices.length);
        
        // Log detallado de todos los dispositivos
        devices.forEach((device, index) => {
          console.log(`Dispositivo ${index}:`, {
            deviceId: device.deviceId,
            kind: device.kind,
            label: device.label,
            groupId: device.groupId
          });
        });
        
        const audioInputDevices = devices
          .filter(device => device.kind === 'audioinput')
          .map((device, index) => {
            let label = device.label;
            
            // Mejorar detección de etiquetas para dispositivos móviles
            if (!label || label === '' || label === 'Default') {
              if (device.deviceId === 'default') {
                label = 'Micrófono Predeterminado';
              } else {
                // Intentar detectar tipo de dispositivo por deviceId
                const deviceIdLower = device.deviceId.toLowerCase();
                if (deviceIdLower.includes('usb') || deviceIdLower.includes('external')) {
                  label = `Micrófono USB Externo ${index}`;
                } else if (deviceIdLower.includes('bluetooth') || deviceIdLower.includes('bt')) {
                  label = `Micrófono Bluetooth ${index}`;
                } else if (deviceIdLower.includes('headset') || deviceIdLower.includes('headphone')) {
                  label = `Auriculares con Micrófono ${index}`;
                } else {
                  label = `Micrófono ${index + 1}`;
                }
              }
            }
            
            return {
              deviceId: device.deviceId,
              label: label,
              kind: device.kind
            };
          });

        console.log('🎯 Dispositivos de audio procesados:', audioInputDevices);
        
        // Si encontramos dispositivos o es el último intento, retornar
        if (audioInputDevices.length > 0 || i === retries - 1) {
          return audioInputDevices;
        }
        
      } catch (error) {
        console.error(`❌ Error en intento ${i + 1}:`, error);
        if (i === retries - 1) {
          throw error;
        }
      }
    }
    
    return [];
  }, []);

  const requestPermissionAndEnumerate = useCallback(async () => {
    setIsLoading(true);
    console.log('🎤 Iniciando detección de dispositivos...');
    console.log('Entorno:', { isMobile, isCapacitor, userAgent: navigator.userAgent });
    
    try {
      // Solicitar permisos primero
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        console.error('🚫 No se pudieron obtener permisos');
        setAudioDevices([]);
        return;
      }
      
      // Esperar un momento para que los dispositivos se registren
      console.log('⏳ Esperando registro de dispositivos...');
      await new Promise(resolve => setTimeout(resolve, isCapacitor ? 1500 : 800));
      
      // Enumerar dispositivos con reintentos
      const audioInputDevices = await enumerateDevicesWithRetry();
      setAudioDevices(audioInputDevices);
      
      // Log específico para dispositivos externos
      const externalDevices = audioInputDevices.filter(device => {
        const label = device.label.toLowerCase();
        const deviceId = device.deviceId.toLowerCase();
        return label.includes('usb') || 
               label.includes('external') ||
               label.includes('bluetooth') ||
               deviceId.includes('usb') ||
               deviceId.includes('external') ||
               deviceId.includes('bt');
      });
      
      if (externalDevices.length > 0) {
        console.log('🔌 Dispositivos externos detectados:', externalDevices);
      } else {
        console.log('ℹ️ No se detectaron dispositivos externos');
        console.log('💡 Sugerencias para móvil:');
        console.log('- Verifica que el dispositivo USB-C esté bien conectado');
        console.log('- Algunos dispositivos necesitan ser conectados antes de abrir la app');
        console.log('- Intenta desconectar y reconectar el dispositivo');
        console.log('- Usa el botón de actualizar después de conectar');
      }
      
    } catch (error) {
      console.error('❌ Error general:', error);
      setAudioDevices([]);
      setPermissionGranted(false);
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            console.error('🚫 Permisos denegados por el usuario');
            if (isCapacitor) {
              alert('⚠️ Necesitas permitir el acceso al micrófono en la configuración de la aplicación. Ve a Configuración > Apps > Transcripción > Permisos > Micrófono.');
            } else {
              alert('⚠️ Necesitas permitir el acceso al micrófono para detectar dispositivos disponibles.');
            }
            break;
          case 'NotFoundError':
            console.error('🔍 No se encontraron dispositivos de audio');
            alert('⚠️ No se detectaron micrófonos. Si tienes un micrófono USB-C conectado, intenta desconectarlo y volverlo a conectar.');
            break;
          case 'SecurityError':
            console.error('🔒 Error de seguridad');
            if (isCapacitor) {
              alert('⚠️ Error de seguridad. Verifica los permisos de la aplicación en la configuración del sistema.');
            }
            break;
          default:
            console.error('❓ Error desconocido:', error.message);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isMobile, isCapacitor, requestMicrophonePermission, enumerateDevicesWithRetry]);

  const refreshDevices = useCallback(() => {
    console.log('🔄 Actualizando lista de dispositivos...');
    requestPermissionAndEnumerate();
  }, [requestPermissionAndEnumerate]);

  const testDevice = useCallback(async (deviceId: string) => {
    console.log('🧪 Probando dispositivo:', deviceId);
    try {
      const constraints = {
        audio: {
          deviceId: deviceId === 'default' ? undefined : { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Configuración específica para móvil/Capacitor
          ...(isMobile || isCapacitor ? {
            sampleRate: { ideal: 48000, min: 16000 },
            channelCount: { ideal: 1 },
            latency: { ideal: 0.01 }
          } : {})
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Dispositivo funciona correctamente');
      console.log('Configuración del track:', stream.getTracks()[0]?.getSettings());
      
      // Probar por 2 segundos
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ Prueba de dispositivo completada exitosamente');
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('❌ Prueba de dispositivo falló:', error);
      return false;
    }
  }, [isMobile, isCapacitor]);

  // Inicializar al cargar el componente
  useEffect(() => {
    console.log('🚀 Inicializando hook de dispositivos de audio...');
    console.log('Configuración:', { isMobile, isCapacitor });
    
    // Pequeño delay para que se cargue completamente el entorno
    const initTimer = setTimeout(() => {
      requestPermissionAndEnumerate();
    }, isCapacitor ? 1000 : 300);

    // Escuchar cambios en dispositivos
    const handleDeviceChange = () => {
      console.log('🔄 Cambio de dispositivos detectado');
      if (permissionGranted) {
        // Delay más largo para móvil
        setTimeout(() => {
          requestPermissionAndEnumerate();
        }, isCapacitor ? 1000 : 500);
      }
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      clearTimeout(initTimer);
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [requestPermissionAndEnumerate, permissionGranted, isCapacitor]);

  return { 
    audioDevices, 
    isLoading,
    permissionGranted,
    refreshDevices, 
    testDevice,
    isMobile: isMobile || isCapacitor
  };
};
