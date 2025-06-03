
import { detectEnvironment } from './deviceDetection';
import { getAudioConstraints } from './speechRecognitionConfig';

export const checkMicrophonePermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: getAudioConstraints()
    });
    
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    return false;
  }
};

export const requestMicrophonePermission = async (deviceId?: string): Promise<boolean> => {
  const { isCapacitor, isMobile } = detectEnvironment();
  
  console.log('🔐 Requesting microphone permission...');
  
  try {
    const audioConstraints = getAudioConstraints(deviceId);
    
    console.log('🎤 Requesting access with constraints:', audioConstraints);
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: audioConstraints
    });
    
    setTimeout(() => {
      stream.getTracks().forEach(track => track.stop());
    }, 500);
    
    console.log('✅ Microphone permission granted');
    return true;
    
  } catch (error) {
    console.error('❌ Permission request failed:', error);
    
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        console.log('❌ Permission denied');
      } else if (error.name === 'NotFoundError') {
        console.error('❌ No microphone found');
      }
    }
    
    return false;
  }
};
