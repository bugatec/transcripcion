
import { useState, useCallback, useEffect } from 'react';

interface SpeechRecognitionPlugin {
  available(): Promise<{ available: boolean }>;
  start(options: {
    language?: string;
    maxResults?: number;
    prompt?: string;
    partialResults?: boolean;
    popup?: boolean;
  }): Promise<{ matches: string[] }>;
  stop(): Promise<void>;
  getSupportedLanguages(): Promise<{ languages: string[] }>;
  hasPermission(): Promise<{ permission: boolean }>;
  requestPermission(): Promise<{ permission: boolean }>;
}

export const useNativeSpeechRecognition = (language: string = 'es-ES') => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Detectar entorno Capacitor de manera más robusta
  const getCapacitor = () => (window as any).Capacitor;
  const isCapacitor = !!getCapacitor()?.isNativePlatform?.();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  console.log('🔍 Entorno detectado:', { isCapacitor, isMobile, hasCapacitor: !!getCapacitor() });

  // Verificar disponibilidad al cargar
  useEffect(() => {
    const checkAvailability = async () => {
      console.log('🔍 Verificando disponibilidad de reconocimiento nativo...');
      
      if (isCapacitor && getCapacitor()?.Plugins?.SpeechRecognition) {
        try {
          const result = await getCapacitor().Plugins.SpeechRecognition.available();
          console.log('📱 Plugin nativo disponible:', result.available);
          setIsSupported(result.available);
          
          if (result.available) {
            // Verificar permisos nativos
            const permissionResult = await getCapacitor().Plugins.SpeechRecognition.hasPermission();
            console.log('🔐 Permisos nativos:', permissionResult.permission);
            setHasPermission(permissionResult.permission);
          }
        } catch (error) {
          console.error('❌ Error verificando plugin nativo:', error);
          setIsSupported(false);
        }
      } else {
        console.log('📱 Plugin nativo no disponible, usando Web Speech API');
        const webSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        setIsSupported(webSupported);
        
        // Para web, verificar permisos de micrófono inmediatamente
        if (webSupported) {
          checkWebPermissions();
        }
      }
    };

    const checkWebPermissions = async () => {
      try {
        // Verificar permisos existentes sin solicitar
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        console.log('🔐 Estado de permisos web:', permissionStatus.state);
        
        if (permissionStatus.state === 'granted') {
          setHasPermission(true);
        } else if (permissionStatus.state === 'denied') {
          setHasPermission(false);
        } else {
          setHasPermission(null); // Necesita solicitar
        }
        
        // Escuchar cambios en permisos
        permissionStatus.onchange = () => {
          console.log('🔄 Cambio en permisos:', permissionStatus.state);
          setHasPermission(permissionStatus.state === 'granted');
        };
      } catch (error) {
        console.log('⚠️ No se puede verificar permisos automáticamente:', error);
        setHasPermission(null);
      }
    };

    checkAvailability();
  }, [isCapacitor]);

  const requestPermission = useCallback(async () => {
    console.log('🔐 Solicitando permisos de micrófono...');
    
    if (isCapacitor && getCapacitor()?.Plugins?.SpeechRecognition) {
      try {
        const result = await getCapacitor().Plugins.SpeechRecognition.requestPermission();
        console.log('✅ Permisos nativos:', result.permission);
        setHasPermission(result.permission);
        return result.permission;
      } catch (error) {
        console.error('❌ Error solicitando permisos nativos:', error);
        setHasPermission(false);
        return false;
      }
    } else {
      // Solicitar permisos web
      try {
        console.log('🌐 Solicitando permisos web de micrófono...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        console.log('✅ Permisos web concedidos');
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        setError(null);
        return true;
      } catch (error: any) {
        console.error('❌ Error solicitando permisos web:', error);
        
        let errorMessage = 'Error al solicitar permisos de micrófono';
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permisos de micrófono denegados. Por favor, permite el acceso en tu navegador.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No se encontró ningún micrófono. Verifica que tengas uno conectado.';
        } else if (error.name === 'SecurityError') {
          errorMessage = 'Error de seguridad. Esta página necesita HTTPS para acceder al micrófono.';
        }
        
        setError(errorMessage);
        setHasPermission(false);
        return false;
      }
    }
  }, [isCapacitor]);

  const startListening = useCallback(async () => {
    if (isListening) return;
    
    console.log('🚀 Iniciando reconocimiento de voz nativo...');
    setError(null);
    setTranscript('');
    
    // Verificar y solicitar permisos si es necesario
    if (hasPermission !== true) {
      console.log('🔐 Solicitando permisos antes de iniciar...');
      const granted = await requestPermission();
      if (!granted) {
        setError('Permisos de micrófono requeridos');
        return;
      }
    }

    setIsListening(true);

    if (isCapacitor && getCapacitor()?.Plugins?.SpeechRecognition) {
      try {
        console.log('📱 Usando plugin nativo de Capacitor...');
        const result = await getCapacitor().Plugins.SpeechRecognition.start({
          language: language,
          maxResults: 1,
          partialResults: true,
          popup: false
        });
        
        console.log('🎯 Resultado del reconocimiento nativo:', result);
        if (result.matches && result.matches.length > 0) {
          setTranscript(result.matches[0]);
        }
      } catch (error) {
        console.error('❌ Error en reconocimiento nativo:', error);
        setError('Error en el reconocimiento de voz nativo');
      } finally {
        setIsListening(false);
      }
    } else {
      // Fallback a Web Speech API
      console.log('🌐 Usando Web Speech API...');
      try {
        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
          throw new Error('Web Speech API no disponible');
        }
        
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onstart = () => {
          console.log('🚀 Web Speech Recognition iniciado');
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Mostrar tanto resultado final como intermedio
          setTranscript(finalTranscript || interimTranscript);
          console.log('🎯 Transcripción:', { finalTranscript, interimTranscript });
        };

        recognition.onend = () => {
          console.log('🛑 Web Speech Recognition terminado');
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error('❌ Error en Web Speech API:', event.error);
          let errorMessage = `Error en reconocimiento: ${event.error}`;
          
          if (event.error === 'not-allowed') {
            errorMessage = 'Permisos de micrófono denegados';
          } else if (event.error === 'no-speech') {
            errorMessage = 'No se detectó voz';
          } else if (event.error === 'audio-capture') {
            errorMessage = 'Error capturando audio del micrófono';
          }
          
          setError(errorMessage);
          setIsListening(false);
        };

        recognition.start();
      } catch (error) {
        console.error('❌ Error iniciando Web Speech API:', error);
        setError('Error iniciando reconocimiento web');
        setIsListening(false);
      }
    }
  }, [isListening, hasPermission, language, requestPermission, isCapacitor]);

  const stopListening = useCallback(async () => {
    if (!isListening) return;
    
    console.log('🛑 Deteniendo reconocimiento...');
    
    if (isCapacitor && getCapacitor()?.Plugins?.SpeechRecognition) {
      try {
        await getCapacitor().Plugins.SpeechRecognition.stop();
      } catch (error) {
        console.error('❌ Error deteniendo reconocimiento nativo:', error);
      }
    }
    
    setIsListening(false);
  }, [isListening, isCapacitor]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    hasPermission,
    error,
    isMobile: isMobile || isCapacitor,
    isCapacitor,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission
  };
};
