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

  console.log('Device detection:', { isMobile, isIOS, isAndroid });

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      console.log('Speech recognition initialized successfully');
    } else {
      setIsSupported(false);
      console.log('Speech recognition not supported in this browser');
    }
  }, []);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    // Mobile-specific configuration
    if (isMobile) {
      console.log('Configuring for mobile device');
      // For mobile, use shorter sessions to avoid timeout issues
      recognition.continuous = false; // Start with false for better mobile compatibility
      recognition.interimResults = true;
    } else {
      recognition.continuous = true;
      recognition.interimResults = true;
    }
    
    recognition.lang = language;

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started successfully');
      setIsListening(true);
      setHasPermission(true);
    };

    recognition.onaudiostart = () => {
      console.log('🔊 Audio capture started');
    };

    recognition.onspeechstart = () => {
      console.log('🗣️ Speech detected');
    };

    recognition.onspeechend = () => {
      console.log('🔇 Speech ended');
    };

    recognition.onaudioend = () => {
      console.log('🔇 Audio capture ended');
    };

    recognition.onend = () => {
      console.log('❌ Speech recognition ended');
      setIsListening(false);
      
      // Clean up media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping audio track:', track.label);
          track.stop();
        });
        streamRef.current = null;
      }

      // Clear any pending restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }

      // Auto-restart for mobile devices (they often stop after short periods)
      if (isMobile && recognition && isListening) {
        console.log('🔄 Auto-restarting recognition for mobile');
        setTimeout(() => {
          if (recognitionRef.current && !isListening) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error('Error restarting recognition:', error);
            }
          }
        }, 100);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('📝 Speech recognition result received');
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        console.log('Transcript part:', transcriptPart, 'Final:', event.results[i].isFinal);
        
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
      
      // Show final transcript + current interim (in gray or different style)
      const displayTranscript = finalTranscript + 
        (interimTranscript ? (finalTranscript ? ' ' : '') + interimTranscript : '');
      
      setTranscript(displayTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ Speech recognition error:', event.error, event.message);
      setIsListening(false);
      
      // Handle specific errors
      if (event.error === 'not-allowed') {
        setHasPermission(false);
        alert('⚠️ Permisos de micrófono denegados. Por favor, permite el acceso al micrófono y recarga la página.');
      } else if (event.error === 'no-speech') {
        console.log('🔇 No speech detected');
        // For mobile, this is more common and we should handle it gracefully
        if (isMobile) {
          console.log('📱 Mobile device - this is normal, trying to restart...');
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
        console.error('🎤 Audio capture error - microphone may not be working properly');
        alert('❌ Error de captura de audio. Verifica que el micrófono esté funcionando correctamente.');
      } else if (event.error === 'network') {
        console.error('🌐 Network error during speech recognition');
        alert('❌ Error de red. Verifica tu conexión a internet.');
      } else if (event.error === 'aborted') {
        console.log('⏹️ Speech recognition was aborted');
      } else {
        console.error('❓ Unknown speech recognition error:', event.error);
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
      console.log('🎤 Requesting microphone permission...');
      
      // For mobile devices, be more specific about audio constraints
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

      console.log('🔧 Audio constraints:', audioConstraints);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints
      });
      
      console.log('✅ Microphone permission granted');
      console.log('📊 Stream details:', {
        active: stream.active,
        tracks: stream.getTracks().length,
        audioTracks: stream.getAudioTracks().map(track => ({
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings()
        }))
      });
      
      // Keep stream for a moment to test, then stop
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        console.log('🛑 Permission test stream stopped');
      }, 1000);
      
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('❌ Error requesting microphone permission:', error);
      setHasPermission(false);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          alert('❌ Permisos de micrófono denegados. Por favor, permite el acceso al micrófono en la configuración del navegador.');
        } else if (error.name === 'NotFoundError') {
          alert('❌ No se encontró ningún micrófono. Verifica que esté conectado correctamente.');
        } else if (error.name === 'OverconstrainedError') {
          alert('❌ El dispositivo de audio seleccionado no cumple con los requisitos. Prueba con otro micrófono.');
        } else {
          alert(`❌ Error de micrófono: ${error.message}`);
        }
      }
      return false;
    }
  }, [deviceId, isMobile]);

  const startListening = useCallback(async () => {
    const recognition = recognitionRef.current;
    if (!recognition || isListening) {
      console.log('⚠️ Cannot start: recognition not available or already listening');
      return;
    }

    try {
      console.log('🚀 Starting speech recognition...');
      
      // For mobile devices, always request permission first
      if (isMobile || hasPermission === null) {
        console.log('📱 Mobile device detected or no permission - requesting access...');
        const granted = await requestMicrophonePermission();
        if (!granted) {
          console.error('❌ Permission denied, cannot start');
          return;
        }
      }

      // Small delay before starting recognition on mobile
      if (isMobile) {
        console.log('⏳ Adding delay for mobile compatibility...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Try to get media stream with specified device
      if (deviceId && deviceId !== '') {
        console.log('🎯 Attempting to use specific microphone device:', deviceId);
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
          console.log('✅ Successfully connected to specific microphone');
          
        } catch (error) {
          console.warn('⚠️ Could not use specific device, falling back to default:', error);
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
      
      console.log('🎤 Attempting to start speech recognition...');
      recognition.start();
      
    } catch (error) {
      console.error('❌ Error starting recognition:', error);
      setIsListening(false);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setHasPermission(false);
          alert('❌ Permisos de micrófono denegados. Ve a la configuración del navegador y permite el acceso al micrófono para este sitio.');
        } else if (error.name === 'NotFoundError') {
          alert('❌ No se encontró ningún micrófono. Verifica que esté conectado correctamente.');
        } else if (error.name === 'InvalidStateError') {
          console.log('⚠️ Recognition already started or in invalid state');
        } else {
          alert(`❌ Error al acceder al micrófono: ${error.message}`);
        }
      }
    }
  }, [isListening, deviceId, hasPermission, requestMicrophonePermission, isMobile]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !isListening) {
      console.log('⚠️ Cannot stop: not currently listening');
      return;
    }

    console.log('🛑 Stopping speech recognition...');
    
    // Clear any pending restart timeout
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    recognition.stop();
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    console.log('🔄 Resetting transcript');
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
