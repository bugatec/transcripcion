
import { useState, useEffect, useCallback } from 'react';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

export const useAudioDevices = () => {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getAudioDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Getting audio devices...');
      
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted, enumerating devices...');
      
      // Stop the permission stream
      stream.getTracks().forEach(track => track.stop());
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('All devices found:', devices);
      
      const audioInputDevices = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Micrófono ${device.deviceId.slice(0, 8)}`,
          kind: device.kind
        }));

      console.log('Audio input devices:', audioInputDevices);
      setAudioDevices(audioInputDevices);
    } catch (error) {
      console.error('Error getting audio devices:', error);
      setAudioDevices([]);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          console.error('Microphone permission denied');
        } else if (error.name === 'NotFoundError') {
          console.error('No microphones found');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshDevices = useCallback(() => {
    console.log('Refreshing audio devices...');
    getAudioDevices();
  }, [getAudioDevices]);

  const testDevice = useCallback(async (deviceId: string) => {
    try {
      console.log('Testing device:', deviceId);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });
      
      // Test for a short period
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        console.log('Device test completed successfully');
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Device test failed:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    getAudioDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      console.log('Audio devices changed, refreshing list...');
      getAudioDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [getAudioDevices]);

  return { 
    audioDevices, 
    isLoading,
    refreshDevices, 
    testDevice 
  };
};
