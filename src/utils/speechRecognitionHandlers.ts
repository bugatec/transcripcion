
export const createSpeechHandlers = (
  setIsListening: (value: boolean) => void,
  setHasPermission: (value: boolean | null) => void,
  finalTranscriptRef: React.MutableRefObject<string>,
  setTranscript: (value: string) => void,
  streamRef: React.MutableRefObject<MediaStream | null>,
  restartTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  recognitionRef: React.MutableRefObject<SpeechRecognition | null>,
  isListening: boolean,
  isMobile: boolean,
  isCapacitor: boolean
) => {
  const onStart = () => {
    console.log('🎤 Speech recognition started');
    setIsListening(true);
    setHasPermission(true);
  };

  const onEnd = () => {
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

  const onResult = (event: any) => {
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

  const onError = (event: any) => {
    console.error('🚨 Speech recognition error:', event.error);
    setIsListening(false);
    
    if (event.error === 'not-allowed') {
      setHasPermission(false);
      console.log('❌ Permission denied during speech recognition');
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
      console.error('❌ Audio capture error');
      setHasPermission(false);
    } else if (event.error === 'network') {
      console.error('❌ Network error during speech recognition');
    }
  };

  return { onStart, onEnd, onResult, onError };
};
