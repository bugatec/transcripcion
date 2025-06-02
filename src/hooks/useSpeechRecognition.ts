import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
    };
  }
}

export const useSpeechRecognition = (language: string = 'es-ES', deviceId?: string) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const streamRef = useRef<MediaStream | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar si es dispositivo móvil y si está ejecutándose en Capacitor
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isCapacitor = window.Capacitor?.isNativePlatform() || false;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  console.log('Environment detected:', { isMobile, isCapacitor, isIOS, isAndroid });

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
    } else {
      setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    // Configuración optimizada para móviles y Capacitor
    if (isMobile || isCapacitor) {
      recognition.continuous = false;
      recognition.interimResults = true;
    } else {
      recognition.continuous = true;
      recognition.interimResults = true;
    }
    
    recognition.lang = language;

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      setIsListening(true);
      setHasPermission(true);
    };

    recognition.onend = () => {
      console.log('🛑 Speech recognition ended');
      setIsListening(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          const formattedTranscript = transcriptPart.trim();
          if (formattedTranscript) {
            finalTranscript += (finalTranscript ? ' ' : '') + 
              formattedTranscript.charAt(0).toUpperCase() + 
              formattedTranscript.slice(1);
            
            if (!/[.!?]$/.test(finalTranscript)) {
              finalTranscript += '.';
            }
          }
        } else {
          interimTranscript += transcriptPart;
        }
      }

      finalTranscriptRef.current = finalTranscript;
      
      const displayTranscript = finalTranscript + 
        (interimTranscript ? (finalTranscript ? ' ' : '') + interimTranscript : '');
      
      setTranscript(displayTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('🚨 Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        setHasPermission(false);
        if (isCapacitor) {
          alert('⚠️ Permisos de micrófono denegados. Ve a Configuración > Aplicaciones > Transcripción > Permisos y activa el micrófono.');
        } else if (isMobile) {
          alert('⚠️ Permisos de micrófono denegados. Ve a Configuración del navegador > Sitios web > Permisos > Micrófono y actívalo.');
        } else {
          alert('⚠️ Permisos de micrófono denegados. Permite el acceso al micrófono en la configuración del navegador.');
        }
      } else if (event.error === 'no-speech') {
        if (isMobile || isCapacitor) {
          setTimeout(() => {
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.start();
              } catch (error) {
                console.error('Error restarting after no-speech:', error);
              }
            }
          }, 500);
        }
      } else if (event.error === 'audio-capture') {
        alert('❌ Error de captura de audio. Verifica que el micrófono esté funcionando correctamente.');
      } else if (event.error === 'network') {
        alert('❌ Error de red. Verifica tu conexión a internet.');
      }
    };

    return () => {
      if (recognition) {
        recognition.onstart = null;
        recognition.onend = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onaudiostart = null;
        recognition.onaudioend = null;
        recognition.onspeechstart = null;
        recognition.onspeechend = null;
      }
    };
  }, [language, isMobile, isCapacitor, isIOS, isAndroid, isListening]);

  const requestMicrophonePermission = useCallback(async () => {
    console.log('🔐 Requesting microphone permission...');
    
    try {
      // Para aplicaciones Capacitor, usar permisos nativos
      if (isCapacitor) {
        console.log('📱 Capacitor detected - requesting native permissions');
        
        // Intentar usar Capacitor Microphone plugin si está disponible
        if (window.Capacitor) {
          try {
            // Solicitar permisos nativos a través de Capacitor
            const stream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000,
                channelCount: 1
              }
            });
            
            // Detener inmediatamente para liberar el recurso
            stream.getTracks().forEach(track => track.stop());
            
            setHasPermission(true);
            console.log('✅ Native microphone permission granted');
            return true;
          } catch (error) {
            console.error('❌ Native permission request failed:', error);
            setHasPermission(false);
            return false;
          }
        }
      }
      
      // Configuración de audio mejorada para diferentes dispositivos
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(deviceId && deviceId !== '' ? { deviceId: { exact: deviceId } } : {}),
        ...(isMobile || isCapacitor ? { 
          sampleRate: 16000,
          channelCount: 1 
        } : {
          sampleRate: 44100
        })
      };
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints
      });
      
      // Probar brevemente y luego detener
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
      }, 1000);
      
      setHasPermission(true);
      console.log('✅ Microphone permission granted');
      return true;
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      setHasPermission(false);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          if (isCapacitor) {
            alert('❌ Ve a Configuración > Aplicaciones > Transcripción > Permisos y activa el micrófono.');
          } else if (isMobile) {
            alert('❌ Ve a Configuración del navegador > Sitios web > Permisos > Micrófono y actívalo.');
          } else {
            alert('❌ Permite el acceso al micrófono en la configuración del navegador.');
          }
        } else if (error.name === 'NotFoundError') {
          alert('❌ No se encontró micrófono. Verifica que esté conectado.');
        } else if (error.name === 'OverconstrainedError') {
          alert('❌ El micrófono seleccionado no es compatible. Prueba con otro.');
        }
      }
      return false;
    }
  }, [deviceId, isMobile, isCapacitor]);

  const startListening = useCallback(async () => {
    const recognition = recognitionRef.current;
    if (!recognition || isListening) return;

    console.log('🚀 Starting speech recognition...');

    try {
      // Para Capacitor y móviles, siempre solicitar permisos primero
      if (isCapacitor || isMobile || hasPermission === null) {
        console.log('📋 Requesting permissions first...');
        const granted = await requestMicrophonePermission();
        if (!granted) {
          console.error('❌ Permission denied, cannot start listening');
          return;
        }
      }

      // Delay para dispositivos móviles y Capacitor
      if (isMobile || isCapacitor) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Configurar dispositivo específico si se especifica
      if (deviceId && deviceId !== '') {
        try {
          const constraints: MediaStreamConstraints = {
            audio: {
              deviceId: { exact: deviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              ...(isMobile || isCapacitor ? { 
                sampleRate: 16000,
                channelCount: 1 
              } : {
                sampleRate: 44100
              })
            }
          };
          
          streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
          console.warn('⚠️ Falling back to default microphone');
          streamRef.current = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              ...(isMobile || isCapacitor ? { 
                sampleRate: 16000,
                channelCount: 1 
              } : {
                sampleRate: 44100
              })
            }
          });
        }
      }
      
      recognition.start();
      console.log('✅ Speech recognition started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error);
      setIsListening(false);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setHasPermission(false);
          if (isCapacitor) {
            alert('❌ Ve a Configuración > Aplicaciones > Transcripción > Permisos y activa el micrófono.');
          } else if (isMobile) {
            alert('❌ Ve a configuración del navegador y permite el acceso al micrófono.');
          } else {
            alert('❌ Ve a configuración del navegador y permite el acceso al micrófono.');
          }
        } else if (error.name === 'NotFoundError') {
          alert('❌ No se encontró micrófono. Verifica la conexión.');
        }
      }
    }
  }, [isListening, deviceId, hasPermission, requestMicrophonePermission, isMobile, isCapacitor]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !isListening) return;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    recognition.stop();
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    hasPermission,
    isMobile: isMobile || isCapacitor,
    isCapacitor,
    startListening,
    stopListening,
    resetTranscript,
    requestMicrophonePermission
  };
};
