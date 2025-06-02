
import { detectEnvironment } from './deviceDetection';
import { getAudioConstraints } from './speechRecognitionConfig';

export const checkMicrophonePermission = async (): Promise<boolean> => {
  try {
    // Simplemente intentar acceder al micrófono sin mostrar alertas
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: getAudioConstraints()
    });
    
    // Detener inmediatamente
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
    // Para aplicaciones móviles (Capacitor o navegador), usar MediaDevices directamente
    const audioConstraints = getAudioConstraints(deviceId);
    
    console.log('🎤 Requesting access with constraints:', audioConstraints);
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: audioConstraints
    });
    
    // Probar brevemente y luego detener
    setTimeout(() => {
      stream.getTracks().forEach(track => track.stop());
    }, 500);
    
    console.log('✅ Microphone permission granted');
    return true;
    
  } catch (error) {
    console.error('❌ Permission request failed:', error);
    
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        if (isCapacitor) {
          console.log('❌ Permission denied in Capacitor app');
        } else if (isMobile) {
          console.log('❌ Permission denied in mobile browser');
        } else {
          console.log('❌ Permission denied in desktop browser');
        }
      } else if (error.name === 'NotFoundError') {
        console.error('❌ No microphone found');
      }
    }
    
    return false;
  }
};
