
import { useState, useEffect, useRef, useCallback } from 'react';
import { detectEnvironment } from '../utils/deviceDetection';
import { createSpeechRecognitionConfig, getAudioConstraints } from '../utils/speechRecognitionConfig';
import { checkMicrophonePermission, requestMicrophonePermission } from '../utils/microphonePermissions';
import { createSpeechHandlers } from '../utils/speechRecognitionHandlers';

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

  const { isMobile, isCapacitor, isIOS, isAndroid } = detectEnvironment();

  console.log('Environment detected:', { isMobile, isCapacitor, isIOS, isAndroid });

  // Verificar permisos al cargar
  useEffect(() => {
    const checkInitialPermissions = async () => {
      const hasAccess = await checkMicrophonePermission();
      setHasPermission(hasAccess);
      console.log(hasAccess ? '✅ Initial microphone permission check: granted' : '🔐 Initial microphone permission check: not granted yet');
    };

    checkInitialPermissions();
  }, []);

  useEffect(() => {
    const recognition = createSpeechRecognitionConfig(language);
    
    if (recognition) {
      setIsSupported(true);
      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }
  }, [language]);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    const handlers = createSpeechHandlers(
      setIsListening,
      setHasPermission,
      finalTranscriptRef,
      setTranscript,
      streamRef,
      restartTimeoutRef,
      recognitionRef,
      isListening,
      isMobile,
      isCapacitor
    );

    recognition.onstart = handlers.onStart;
    recognition.onend = handlers.onEnd;
    recognition.onresult = handlers.onResult;
    recognition.onerror = handlers.onError;

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
  }, [language, isMobile, isCapacitor, isListening]);

  const requestPermission = useCallback(async () => {
    return await requestMicrophonePermission(deviceId === 'default' ? '' : deviceId);
  }, [deviceId]);

  const startListening = useCallback(async () => {
    const recognition = recognitionRef.current;
    if (!recognition || isListening) return;

    console.log('🚀 Starting speech recognition...');
    console.log('Current permission state:', hasPermission);

    try {
      // Solo solicitar permisos si realmente no los tenemos
      if (hasPermission === false || hasPermission === null) {
        console.log('📋 Requesting permissions...');
        const granted = await requestPermission();
        if (!granted) {
          console.error('❌ Permission denied, cannot start listening');
          return;
        }
        setHasPermission(true);
      }

      // Delay para dispositivos móviles y Capacitor
      if (isMobile || isCapacitor) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Configurar dispositivo específico si se especifica
      if (deviceId && deviceId !== '') {
        try {
          const constraints = {
            audio: getAudioConstraints(deviceId)
          };
          
          streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
          console.warn('⚠️ Falling back to default microphone');
          streamRef.current = await navigator.mediaDevices.getUserMedia({ 
            audio: getAudioConstraints()
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
          console.log('❌ Permission denied during start');
        } else if (error.name === 'NotFoundError') {
          console.error('❌ No microphone found');
        }
      }
    }
  }, [isListening, deviceId, hasPermission, requestPermission, isMobile, isCapacitor]);

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
    requestMicrophonePermission: requestPermission
  };
};
