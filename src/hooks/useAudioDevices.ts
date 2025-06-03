
import { useState, useEffect, useCallback } from 'react';

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

  const requestPermissionAndEnumerate = useCallback(async () => {
    setIsLoading(true);
    console.log('🎤 Solicitando permisos y enumerando dispositivos...');
    
    try {
      // Solicitar permisos de micrófono primero
      console.log('📋 Solicitando permisos de micrófono...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Para móviles, usar configuración optimizada
          ...(isMobile || isCapacitor ? {
            sampleRate: 16000,
            channelCount: 1
          } : {})
        }
      });
      
      console.log('✅ Permisos concedidos, cerrando stream temporal...');
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      
      // Esperar un momento para que los dispositivos se registren
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Enumerar todos los dispositivos disponibles
      console.log('🔍 Enumerando dispositivos de audio...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('📱 Todos los dispositivos encontrados:', devices.length);
      
      // Filtrar solo dispositivos de entrada de audio
      const audioInputDevices = devices
        .filter(device => device.kind === 'audioinput')
        .map((device, index) => {
          let label = device.label;
          
          // Si no hay etiqueta, crear una descriptiva
          if (!label || label === '') {
            if (device.deviceId === 'default') {
              label = 'Micrófono Predeterminado';
            } else if (device.deviceId.includes('usb') || device.deviceId.includes('USB')) {
              label = `Micrófono USB ${index + 1}`;
            } else if (device.deviceId.includes('bluetooth') || device.deviceId.includes('Bluetooth')) {
              label = `Micrófono Bluetooth ${index + 1}`;
            } else {
              label = `Micrófono ${index + 1}`;
            }
          }
          
          return {
            deviceId: device.deviceId,
            label: label,
            kind: device.kind
          };
        });

      console.log('🎯 Dispositivos de audio encontrados:', audioInputDevices);
      setAudioDevices(audioInputDevices);
      
      // Log específico para dispositivos USB-C o externos
      const externalDevices = audioInputDevices.filter(device => 
        device.label.toLowerCase().includes('usb') || 
        device.label.toLowerCase().includes('external') ||
        device.label.toLowerCase().includes('bluetooth') ||
        device.deviceId.includes('usb')
      );
      
      if (externalDevices.length > 0) {
        console.log('🔌 Dispositivos externos detectados:', externalDevices);
      } else {
        console.log('ℹ️ No se detectaron dispositivos externos. Verifica que estén conectados correctamente.');
      }
      
    } catch (error) {
      console.error('❌ Error al obtener dispositivos de audio:', error);
      setAudioDevices([]);
      setPermissionGranted(false);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          console.error('🚫 Permisos de micrófono denegados');
          alert('⚠️ Necesitas permitir el acceso al micrófono para detectar dispositivos disponibles.');
        } else if (error.name === 'NotFoundError') {
          console.error('🔍 No se encontraron micrófonos');
          alert('⚠️ No se detectaron micrófonos. Verifica que estén conectados.');
        } else if (error.name === 'SecurityError') {
          console.error('🔒 Error de seguridad al acceder al micrófono');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isMobile, isCapacitor]);

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
          ...(isMobile || isCapacitor ? {
            sampleRate: 16000,
            channelCount: 1
          } : {})
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
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
    console.log('🚀 Inicializando detección de dispositivos de audio...');
    requestPermissionAndEnumerate();

    // Escuchar cambios en dispositivos (conectar/desconectar)
    const handleDeviceChange = () => {
      console.log('🔄 Dispositivos cambiaron, actualizando lista...');
      if (permissionGranted) {
        requestPermissionAndEnumerate();
      }
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [requestPermissionAndEnumerate, permissionGranted]);

  return { 
    audioDevices, 
    isLoading,
    permissionGranted,
    refreshDevices, 
    testDevice,
    isMobile: isMobile || isCapacitor
  };
};
