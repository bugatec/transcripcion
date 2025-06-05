
import { useState, useCallback, useRef, useEffect } from 'react';

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

let recognition: any = null;

export const useSpeechRecognition = (language: string = 'es-ES', deviceId?: string) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const checkAvailability = () => {
      const webSpeechAvailable = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setIsSupported(webSpeechAvailable);
      console.log('🌐 Web Speech API disponible:', webSpeechAvailable);
    };

    checkAvailability();
  }, []);

  useEffect(() => {
    const getMicrophonePermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (stream) {
          mediaStreamRef.current = stream;
          setHasPermission(true);
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        setHasPermission(false);
        console.error("Microphone permission denied:", err);
      }
    };

    getMicrophonePermission();
  }, []);

  const requestPermission = useCallback(async () => {
    console.log('🔐 Requesting microphone permission...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('❌ Permission denied:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('La API de Speech Recognition no es compatible con este navegador.');
      return;
    }

    setIsListening(true);
    setTranscript('');
    setError(null);

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        console.log('🚀 Speech recognition started');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            setTranscript(event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(interimTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('🛑 Speech recognition ended');
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        setError(`Error: ${event.error}`);
        setIsListening(false);
      };

      if (deviceId && deviceId !== 'default') {
        (recognition as any).audioinput = deviceId;
      }

      recognition.start();
    } catch (error: any) {
      console.error('❌ Could not start speech recognition:', error);
      setError(`Could not start speech recognition: ${error.message}`);
      setIsListening(false);
    }
  }, [isSupported, language, deviceId]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      console.log('🛑 Speech recognition stopped');
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    hasPermission,
    error,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isCapacitor: false,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission
  };
};
