
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

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      Plugins: {
        SpeechRecognition: SpeechRecognitionPlugin;
      };
    };
  }
}

export const useNativeSpeechRecognition = (language: string = 'es-ES') => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCapacitor = window.Capacitor?.isNativePlatform() || false;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Verificar disponibilidad al cargar
  useEffect(() => {
    const checkAvailability = async () => {
      console.log('🔍 Verificando disponibilidad de reconocimiento de voz...');
      console.log('Entorno:', { isCapacitor, isMobile });

      if (isCapacitor && window.Capacitor?.Plugins?.SpeechRecognition) {
        try {
          const result = await window.Capacitor.Plugins.SpeechRecognition.available();
          console.log('📱 Plugin nativo disponible:', result.available);
          setIsSupported(result.available);
          
          if (result.available) {
            // Verificar permisos
            const permissionResult = await window.Capacitor.Plugins.SpeechRecognition.hasPermission();
            console.log('🔐 Permisos nativos:', permissionResult.permission);
            setHasPermission(permissionResult.permission);
          }
        } catch (error) {
          console.error('❌ Error verificando plugin nativo:', error);
          setIsSupported(false);
        }
      } else {
        // Fallback a Web Speech API
        const webSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        console.log('🌐 Web Speech API disponible:', webSupported);
        setIsSupported(webSupported);
      }
    };

    checkAvailability();
  }, [isCapacitor, isMobile]);

  const requestPermission = useCallback(async () => {
    console.log('🔐 Solicitando permisos...');
    
    if (isCapacitor && window.Capacitor?.Plugins?.SpeechRecognition) {
      try {
        const result = await window.Capacitor.Plugins.SpeechRecognition.requestPermission();
        console.log('✅ Permisos nativos concedidos:', result.permission);
        setHasPermission(result.permission);
        return result.permission;
      } catch (error) {
        console.error('❌ Error solicitando permisos nativos:', error);
        setHasPermission(false);
        return false;
      }
    } else {
      // Fallback a permisos web
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        return true;
      } catch (error) {
        console.error('❌ Error solicitando permisos web:', error);
        setHasPermission(false);
        return false;
      }
    }
  }, [isCapacitor]);

  const startListening = useCallback(async () => {
    if (isListening) return;
    
    console.log('🚀 Iniciando reconocimiento de voz...');
    setError(null);
    
    // Verificar y solicitar permisos si es necesario
    if (hasPermission === false || hasPermission === null) {
      const granted = await requestPermission();
      if (!granted) {
        setError('Permisos de micrófono denegados');
        return;
      }
    }

    setIsListening(true);

    if (isCapacitor && window.Capacitor?.Plugins?.SpeechRecognition) {
      try {
        console.log('📱 Usando plugin nativo de Capacitor...');
        const result = await window.Capacitor.Plugins.SpeechRecognition.start({
          language: language,
          maxResults: 1,
          partialResults: true,
          popup: false
        });
        
        console.log('🎯 Resultado del reconocimiento:', result);
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
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setTranscript(finalTranscript);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error('❌ Error en Web Speech API:', event.error);
          setError(`Error: ${event.error}`);
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
    
    if (isCapacitor && window.Capacitor?.Plugins?.SpeechRecognition) {
      try {
        await window.Capacitor.Plugins.SpeechRecognition.stop();
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
