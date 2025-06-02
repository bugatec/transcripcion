
import { detectEnvironment } from './deviceDetection';

export const createSpeechRecognitionConfig = (language: string) => {
  const { isMobile, isCapacitor } = detectEnvironment();
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  
  // Configuración optimizada para móviles y Capacitor
  if (isMobile || isCapacitor) {
    recognition.continuous = false;
    recognition.interimResults = true;
  } else {
    recognition.continuous = true;
    recognition.interimResults = true;
  }
  
  recognition.lang = language;
  
  return recognition;
};

export const getAudioConstraints = (deviceId?: string) => {
  const { isMobile, isCapacitor } = detectEnvironment();
  
  return {
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
};
