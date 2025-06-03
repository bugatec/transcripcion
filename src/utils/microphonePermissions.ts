
import { detectEnvironment } from './deviceDetection';
import { getAudioConstraints } from './speechRecognitionConfig';

export const checkMicrophonePermission = async (): Promise<boolean> => {
  try {
    // First check if we already have permission using the Permissions API
    if ('permissions' in navigator) {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (result.state === 'granted') {
        return true;
      } else if (result.state === 'denied') {
        return false;
      }
      // If state is 'prompt', we need to actually request permission
    }

    // Try to get access with minimal constraints first
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.log('🔍 Permission check failed:', error);
    return false;
  }
};

export const requestMicrophonePermission = async (deviceId?: string): Promise<boolean> => {
  const { isCapacitor, isMobile } = detectEnvironment();
  
  console.log('🔐 Requesting microphone permission...');
  
  try {
    // For Capacitor apps, we might need to handle permissions differently
    if (isCapacitor) {
      console.log('📱 Capacitor app detected, requesting native permissions...');
    }

    // Start with basic audio constraints, then try specific device if provided
    let audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...(isMobile || isCapacitor ? { 
        sampleRate: 16000,
        channelCount: 1 
      } : {
        sampleRate: 44100
      })
    };

    console.log('🎤 Requesting access with basic constraints first...');
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: audioConstraints
    });
    
    // If we got permission, test the specific device if requested
    if (deviceId && deviceId !== '' && deviceId !== 'default') {
      try {
        console.log('🎤 Testing specific device:', deviceId);
        const deviceStream = await navigator.mediaDevices.getUserMedia({
          audio: { ...audioConstraints, deviceId: { exact: deviceId } }
        });
        deviceStream.getTracks().forEach(track => track.stop());
      } catch (deviceError) {
        console.warn('⚠️ Specific device failed, will use default:', deviceError);
      }
    }
    
    setTimeout(() => {
      stream.getTracks().forEach(track => track.stop());
    }, 500);
    
    console.log('✅ Microphone permission granted');
    return true;
    
  } catch (error) {
    console.error('❌ Permission request failed:', error);
    
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        console.log('❌ Permission denied by user');
      } else if (error.name === 'NotFoundError') {
        console.error('❌ No microphone found');
      } else if (error.name === 'NotReadableError') {
        console.error('❌ Microphone is being used by another application');
      } else if (error.name === 'OverconstrainedError') {
        console.error('❌ Microphone constraints not supported');
      }
    }
    
    return false;
  }
};
