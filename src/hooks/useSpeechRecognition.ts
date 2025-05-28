
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

    // Configure recognition with mobile-specific optimizations
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    // Mobile-specific configuration
    if (isMobile) {
      console.log('Configuring for mobile device');
      // Some mobile browsers work better with shorter continuous sessions
      recognition.continuous = true;
      recognition.interimResults = true;
    }

    recognition.onstart = () => {
      console.log('Speech recognition started successfully');
      setIsListening(true);
      setHasPermission(true);
    };

    recognition.onaudiostart = () => {
      console.log('Audio capture started');
    };

    recognition.onspeechstart = () => {
      console.log('Speech detected');
    };

    recognition.onspeechend = () => {
      console.log('Speech ended');
    };

    recognition.onaudioend = () => {
      console.log('Audio capture ended');
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
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
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('Speech recognition result received');
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
      console.error('Speech recognition error:', event.error, event.message);
      setIsListening(false);
      
      // Handle specific errors
      if (event.error === 'not-allowed') {
        setHasPermission(false);
        alert('Permisos de micrófono denegados. Por favor, permite el acceso al micrófono y recarga la página.');
      } else if (event.error === 'no-speech') {
        console.log('No speech detected, this is normal on mobile devices');
        // Don't auto-restart on mobile as it can cause issues
        if (!isMobile) {
          restartTimeoutRef.current = setTimeout(() => {
            if (isListening) {
              console.log('Restarting recognition after no speech');
              startListening();
            }
          }, 1000);
        }
      } else if (event.error === 'audio-capture') {
        console.error('Audio capture error - microphone may not be working properly');
        alert('Error de captura de audio. Verifica que el micrófono esté funcionando correctamente.');
      } else if (event.error === 'network') {
        console.error('Network error during speech recognition');
        alert('Error de red. Verifica tu conexión a internet.');
      } else {
        console.error('Unknown speech recognition error:', event.error);
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
  }, [language, isListening, isMobile]);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      console.log('Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true 
      });
      
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      console.log('Microphone permission granted');
      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  const startListening = useCallback(async () => {
    const recognition = recognitionRef.current;
    if (!recognition || isListening) return;

    try {
      console.log('Starting speech recognition...');
      
      // Request permission first if not already granted
      if (hasPermission === null) {
        const granted = await requestMicrophonePermission();
        if (!granted) return;
      }

      // If a specific device is selected, try to use it
      if (deviceId && deviceId !== '') {
        console.log('Attempting to use specific microphone device:', deviceId);
        try {
          const constraints: MediaStreamConstraints = {
            audio: {
              deviceId: { exact: deviceId },
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: isMobile ? 16000 : 44100, // Lower sample rate for mobile
            }
          };
          
          streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('Successfully connected to microphone:', deviceId);
          
          // Log audio track information
          const audioTracks = streamRef.current.getAudioTracks();
          audioTracks.forEach(track => {
            console.log('Audio track settings:', track.getSettings());
            console.log('Audio track capabilities:', track.getCapabilities());
          });
          
        } catch (error) {
          console.warn('Could not use specific device, falling back to default:', error);
          // Fall back to default microphone
          streamRef.current = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: isMobile ? 16000 : 44100,
            }
          });
        }
      } else {
        console.log('Using default microphone');
        streamRef.current = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: isMobile ? 16000 : 44100,
          }
        });
      }
      
      // Add a small delay for mobile devices
      if (isMobile) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsListening(false);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setHasPermission(false);
          alert('Permisos de micrófono denegados. Por favor, permite el acceso al micrófono.');
        } else if (error.name === 'NotFoundError') {
          alert('No se encontró ningún micrófono. Verifica que esté conectado correctamente.');
        } else {
          alert('Error al acceder al micrófono: ' + error.message);
        }
      }
    }
  }, [isListening, deviceId, hasPermission, requestMicrophonePermission, isMobile]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !isListening) return;

    console.log('Stopping speech recognition...');
    
    // Clear any pending restart timeout
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    recognition.stop();
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    console.log('Resetting transcript');
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
