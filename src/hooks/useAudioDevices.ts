
import { useState, useEffect, useCallback } from 'react';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

export const useAudioDevices = () => {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);

  const getAudioDevices = useCallback(async () => {
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputDevices = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label,
          kind: device.kind
        }));

      setAudioDevices(audioInputDevices);
    } catch (error) {
      console.error('Error getting audio devices:', error);
      setAudioDevices([]);
    }
  }, []);

  const refreshDevices = useCallback(() => {
    getAudioDevices();
  }, [getAudioDevices]);

  useEffect(() => {
    getAudioDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      getAudioDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [getAudioDevices]);

  return { audioDevices, refreshDevices };
};
