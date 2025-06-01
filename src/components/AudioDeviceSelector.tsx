
import React from 'react';
import { Headphones, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AudioDevice {
  deviceId: string;
  label: string;
}

interface AudioDeviceSelectorProps {
  selectedDeviceId: string;
  audioDevices: AudioDevice[];
  devicesLoading: boolean;
  onDeviceChange: (deviceId: string) => void;
  onRefreshDevices: () => void;
  isHidden?: boolean;
}

const AudioDeviceSelector = ({ 
  selectedDeviceId, 
  audioDevices, 
  devicesLoading, 
  onDeviceChange, 
  onRefreshDevices,
  isHidden = false
}: AudioDeviceSelectorProps) => {
  if (isHidden) return null;

  return (
    <div className="flex items-center gap-2">
      <Headphones className="w-5 h-5 text-blue-500" />
      <Select value={selectedDeviceId} onValueChange={onDeviceChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Seleccionar micrófono" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Predeterminado</SelectItem>
          {audioDevices.map((device) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefreshDevices}
        disabled={devicesLoading}
        className="px-2"
      >
        <RefreshCw className={`w-4 h-4 ${devicesLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};

export default AudioDeviceSelector;
