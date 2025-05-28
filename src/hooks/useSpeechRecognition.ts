
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
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
    } else {
      setIsSupported(false);
      console.log('Speech recognition not supported in this browser');
    }
  }, []);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      
      // Clean up media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
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
      
      // Show final transcript + current interim (in gray or different style)
      const displayTranscript = finalTranscript + 
        (interimTranscript ? (finalTranscript ? ' ' : '') + interimTranscript : '');
      
      setTranscript(displayTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      // Handle specific errors
      if (event.error === 'not-allowed') {
        alert('Permisos de micrófono denegados. Por favor, permite el acceso al micrófono.');
      } else if (event.error === 'no-speech') {
        console.log('No speech detected, restarting...');
        // Auto-restart on no speech
        setTimeout(() => {
          if (isListening) {
            startListening();
          }
        }, 1000);
      }
    };

    return () => {
      if (recognition) {
        recognition.onstart = null;
        recognition.onend = null;
        recognition.onresult = null;
        recognition.onerror = null;
      }
    };
  }, [language, isListening]);

  const startListening = useCallback(async () => {
    const recognition = recognitionRef.current;
    if (!recognition || isListening) return;

    try {
      // If a specific device is selected, request access to it
      if (deviceId) {
        const constraints = {
          audio: {
            deviceId: { exact: deviceId }
          }
        };
        
        streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Using microphone:', deviceId);
      }
      
      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  }, [isListening, deviceId]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !isListening) return;

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
    startListening,
    stopListening,
    resetTranscript
  };
};
