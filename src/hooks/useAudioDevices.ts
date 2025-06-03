
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

  const getAudioDevices = useCallback(async (requestPermission = false) => {
    setIsLoading(true);
    try {
      console.log('🔍 Getting audio devices... requestPermission:', requestPermission);
      
      // First, try to enumerate devices without requesting permission
      if (!requestPermission) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('📱 Devices found (without permission):', devices.length);
        
        const audioInputDevices = devices
          .filter(device => device.kind === 'audioinput')
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Micrófono ${index + 1}`,
            kind: device.kind
          }));

        setAudioDevices(audioInputDevices);
        
        // If we have device labels, we likely have permission
        const hasLabels = audioInputDevices.some(device => device.label && !device.label.startsWith('Micrófono'));
        setHasPermission(hasLabels);
        
        console.log('🎤 Audio devices (no permission):', audioInputDevices);
        return;
      }

      // Request permission and get full device info
      console.log('🔐 Requesting microphone permission for device enumeration...');
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true } 
        });
        
        console.log('✅ Got microphone stream, stopping and enumerating devices...');
        stream.getTracks().forEach(track => track.stop());
        
        // Small delay to ensure device list is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('📱 All devices after permission:', devices);
        
        const audioInputDevices = devices
          .filter(device => device.kind === 'audioinput')
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Micrófono ${index + 1}`,
            kind: device.kind
          }));

        console.log('🎤 Audio input devices with permission:', audioInputDevices);
        setAudioDevices(audioInputDevices);
        setHasPermission(true);
        
      } catch (permissionError) {
        console.error('❌ Failed to get permission for device enumeration:', permissionError);
        setHasPermission(false);
        
        // Still try to enumerate what we can
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices
          .filter(device => device.kind === 'audioinput')
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: `Micrófono ${index + 1}`,
            kind: device.kind
          }));
        
        setAudioDevices(audioInputDevices);
      }
      
    } catch (error) {
      console.error('❌ Error getting audio devices:', error);
      setAudioDevices([]);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshDevices = useCallback((requestPermission = true) => {
    console.log('🔄 Refreshing audio devices with permission request:', requestPermission);
    getAudioDevices(requestPermission);
  }, [getAudioDevices]);

  const testDevice = useCallback(async (deviceId: string) => {
    try {
      console.log('🧪 Testing device:', deviceId);
      const constraints = deviceId === 'default' || !deviceId 
        ? { audio: { echoCancellation: true } }
        : { audio: { deviceId: { exact: deviceId }, echoCancellation: true } };
        
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
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
    // Start by checking what devices we can see without permission
    getAudioDevices(false);

    // Listen for device changes
    const handleDeviceChange = () => {
      console.log('🔄 Audio devices changed, refreshing...');
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
