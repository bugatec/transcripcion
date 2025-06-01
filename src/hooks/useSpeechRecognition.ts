
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

  // Detectar si es dispositivo móvil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

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

    // Mobile-specific configuration - optimized for Capacitor
    if (isMobile) {
      recognition.continuous = false; // Better for mobile compatibility
      recognition.interimResults = true;
    } else {
      recognition.continuous = true;
      recognition.interimResults = true;
    }
    
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setHasPermission(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Clean up media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Clear any pending restart timeout
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
          // Add punctuation and proper sentence formatting
          const formattedTranscript = transcriptPart.trim();
          if (formattedTranscript) {
            finalTranscript += (finalTranscript ? ' ' : '') + 
              formattedTranscript.charAt(0).toUpperCase() + 
              formattedTranscript.slice(1);
            
            // Add period if it doesn't end with punctuation
            if (!/[.!?]$/.test(finalTranscript)) {
              finalTranscript += '.';
            }
          }
        } else {
          interimTranscript += transcriptPart;
        }
      }

      finalTranscriptRef.current = finalTranscript;
      
      // Show final transcript + current interim
      const displayTranscript = finalTranscript + 
        (interimTranscript ? (finalTranscript ? ' ' : '') + interimTranscript : '');
      
      setTranscript(displayTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      
      // Handle specific errors for mobile apps
      if (event.error === 'not-allowed') {
        setHasPermission(false);
        // For Capacitor apps, show more specific permission message
        if (isMobile) {
          alert('⚠️ Permisos de micrófono denegados. Ve a Configuración > Aplicaciones > Transcripción > Permisos y activa el micrófono.');
        } else {
          alert('⚠️ Permisos de micrófono denegados. Permite el acceso al micrófono en la configuración del navegador.');
        }
      } else if (event.error === 'no-speech') {
        // Handle gracefully on mobile
        if (isMobile) {
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
  }, [language, isMobile, isIOS, isAndroid, isListening]);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      // Enhanced mobile permission handling for Capacitor
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(deviceId && deviceId !== '' ? { deviceId: { exact: deviceId } } : {}),
        ...(isMobile ? { 
          sampleRate: 16000,
          channelCount: 1 
        } : {
          sampleRate: 44100
        })
      };
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints
      });
      
      // Test stream briefly then stop
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
      }, 1000);
      
      setHasPermission(true);
      return true;
    } catch (error) {
      setHasPermission(false);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          if (isMobile) {
            alert('❌ Permisos de micrófono denegados. Ve a Configuración de la app y activa el micrófono.');
          } else {
            alert('❌ Permisos de micrófono denegados. Permite el acceso en la configuración del navegador.');
          }
        } else if (error.name === 'NotFoundError') {
          alert('❌ No se encontró micrófono. Verifica que esté conectado.');
        } else if (error.name === 'OverconstrainedError') {
          alert('❌ El micrófono seleccionado no es compatible. Prueba con otro.');
        }
      }
      return false;
    }
  }, [deviceId, isMobile]);

  const startListening = useCallback(async () => {
    const recognition = recognitionRef.current;
    if (!recognition || isListening) return;

    try {
      // For mobile devices, always request permission first
      if (isMobile || hasPermission === null) {
        const granted = await requestMicrophonePermission();
        if (!granted) return;
      }

      // Mobile-specific delay for better compatibility
      if (isMobile) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Configure device if specified
      if (deviceId && deviceId !== '') {
        try {
          const constraints: MediaStreamConstraints = {
            audio: {
              deviceId: { exact: deviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              ...(isMobile ? { 
                sampleRate: 16000,
                channelCount: 1 
              } : {
                sampleRate: 44100
              })
            }
          };
          
          streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
          // Fall back to default microphone
          streamRef.current = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              ...(isMobile ? { 
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
      
    } catch (error) {
      setIsListening(false);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setHasPermission(false);
          if (isMobile) {
            alert('❌ Ve a Configuración > Aplicaciones > Transcripción > Permisos y activa el micrófono.');
          } else {
            alert('❌ Ve a configuración del navegador y permite el acceso al micrófono.');
          }
        } else if (error.name === 'NotFoundError') {
          alert('❌ No se encontró micrófono. Verifica la conexión.');
        }
      }
    }
  }, [isListening, deviceId, hasPermission, requestMicrophonePermission, isMobile]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !isListening) return;

    // Clear any pending restart timeout
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
    isMobile,
    startListening,
    stopListening,
    resetTranscript,
    requestMicrophonePermission
  };
};
