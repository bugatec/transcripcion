
import { useState, useEffect, useCallback } from 'react';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

export const useAudioDevices = () => {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const getAudioDevices = useCallback(async (forcePermission = false) => {
    setIsLoading(true);
    try {
      console.log('🔍 Getting audio devices...');
      
      // First check if we already have permission
      let permissionGranted = false;
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          permissionGranted = result.state === 'granted';
          console.log('🔐 Permission state:', result.state);
        } catch (err) {
          console.log('⚠️ Permissions API not available');
        }
      }

      // If we don't have permission and we're not forcing it, just enumerate what we can
      if (!permissionGranted && !forcePermission) {
        console.log('📝 Enumerating devices without permission...');
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices
          .filter(device => device.kind === 'audioinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Micrófono ${device.deviceId.slice(0, 8)}`,
            kind: device.kind
          }));

        console.log('🎤 Found audio devices (limited info):', audioInputDevices);
        setAudioDevices(audioInputDevices);
        setHasPermission(false);
        return;
      }

      // Request permission if we don't have it
      if (!permissionGranted || forcePermission) {
        console.log('🔐 Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('✅ Microphone permission granted');
        
        // Stop the permission stream
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
      }
      
      // Now enumerate devices with full labels
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('📱 All devices found:', devices);
      
      const audioInputDevices = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Micrófono ${device.deviceId.slice(0, 8)}`,
          kind: device.kind
        }));

      console.log('🎤 Audio input devices with labels:', audioInputDevices);
      setAudioDevices(audioInputDevices);
      setHasPermission(true);
      
    } catch (error) {
      console.error('❌ Error getting audio devices:', error);
      setAudioDevices([]);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          console.error('❌ Microphone permission denied');
          setHasPermission(false);
        } else if (error.name === 'NotFoundError') {
          console.error('❌ No microphones found');
          setHasPermission(null);
        } else if (error.name === 'NotReadableError') {
          console.error('❌ Microphone is being used by another application');
          setHasPermission(false);
        }
      } else {
        setHasPermission(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshDevices = useCallback((requestPermission = true) => {
    console.log('🔄 Refreshing audio devices...');
    getAudioDevices(requestPermission);
  }, [getAudioDevices]);

  const testDevice = useCallback(async (deviceId: string) => {
    try {
      console.log('🧪 Testing device:', deviceId);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Test for a short period
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ Device test completed successfully');
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('❌ Device test failed:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    // Start by enumerating devices without forcing permission
    getAudioDevices(false);

    // Listen for device changes
    const handleDeviceChange = () => {
      console.log('🔄 Audio devices changed, refreshing list...');
      getAudioDevices(hasPermission === true);
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [getAudioDevices, hasPermission]);

  return { 
    audioDevices, 
    isLoading,
    hasPermission,
    refreshDevices, 
    testDevice 
  };
};
