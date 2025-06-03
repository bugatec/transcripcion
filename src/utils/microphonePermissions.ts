
import { detectEnvironment } from './deviceDetection';

export const checkMicrophonePermission = async (): Promise<boolean> => {
  try {
    // For Capacitor apps, try getUserMedia directly as Permissions API might not work
    const { isCapacitor } = detectEnvironment();
    
    if (isCapacitor) {
      console.log('📱 Capacitor detected, checking permissions via getUserMedia...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true } 
      });
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Capacitor microphone permission: granted');
      return true;
    }

    // For web browsers, check Permissions API first
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        console.log('🔐 Permission API state:', result.state);
        if (result.state === 'granted') {
          return true;
        } else if (result.state === 'denied') {
          return false;
        }
        // If state is 'prompt', continue to getUserMedia
      } catch (permError) {
        console.log('⚠️ Permissions API failed, falling back to getUserMedia');
      }
    }

    // Try getUserMedia as fallback or for 'prompt' state
    console.log('🎤 Testing microphone access...');
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: { echoCancellation: true } 
    });
    stream.getTracks().forEach(track => track.stop());
    console.log('✅ Microphone permission: granted');
    return true;
    
  } catch (error) {
    console.log('❌ Permission check failed:', error);
    return false;
  }
};

export const requestMicrophonePermission = async (deviceId?: string): Promise<boolean> => {
  const { isCapacitor, isMobile } = detectEnvironment();
  
  console.log('🔐 Requesting microphone permission...');
  
  try {
    // Basic audio constraints
    const audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...(isMobile || isCapacitor ? { 
        sampleRate: 16000,
        channelCount: 1 
      } : {})
    };

    console.log('🎤 Requesting basic microphone access...');
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: audioConstraints
    });
    
    // Clean up the stream
    setTimeout(() => {
      stream.getTracks().forEach(track => track.stop());
    }, 100);
    
    console.log('✅ Microphone permission granted');
    return true;
    
  } catch (error) {
    console.error('❌ Permission request failed:', error);
    
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          console.log('❌ Permission denied by user');
          break;
        case 'NotFoundError':
          console.error('❌ No microphone found');
          break;
        case 'NotReadableError':
          console.error('❌ Microphone is being used by another application');
          break;
        case 'OverconstrainedError':
          console.error('❌ Microphone constraints not supported');
          break;
      }
    }
    
    return false;
  }
};
