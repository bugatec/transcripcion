
import React from 'react';
import { Headphones, RefreshCw, Usb, Bluetooth } from 'lucide-react';
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
  permissionGranted?: boolean;
  onDeviceChange: (deviceId: string) => void;
  onRefreshDevices: () => void;
  isHidden?: boolean;
}

const AudioDeviceSelector = ({ 
  selectedDeviceId, 
  audioDevices, 
  devicesLoading,
  permissionGranted = false,
  onDeviceChange, 
  onRefreshDevices,
  isHidden = false
}: AudioDeviceSelectorProps) => {
  if (isHidden) return null;

  const getDeviceIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('usb') || lowerLabel.includes('external')) {
      return <Usb className="w-4 h-4 text-green-500" />;
    }
    if (lowerLabel.includes('bluetooth')) {
      return <Bluetooth className="w-4 h-4 text-blue-500" />;
    }
    return <Headphones className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Headphones className="w-5 h-5 text-blue-500" />
        <span className="text-sm font-medium">
          Dispositivos de Audio ({audioDevices.length} encontrados)
        </span>
        {!permissionGranted && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            Permisos requeridos
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Select value={selectedDeviceId} onValueChange={onDeviceChange} disabled={!permissionGranted}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Seleccionar micrófono" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-gray-500" />
                Predeterminado
              </div>
            </SelectItem>
            {audioDevices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                <div className="flex items-center gap-2">
                  {getDeviceIcon(device.label)}
                  {device.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshDevices}
          disabled={devicesLoading}
          className="px-3"
          title="Actualizar lista de dispositivos"
        >
          <RefreshCw className={`w-4 h-4 ${devicesLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {audioDevices.length === 0 && permissionGranted && (
        <p className="text-xs text-gray-500">
          No se detectaron dispositivos externos. Conecta tu micrófono USB-C y actualiza.
        </p>
      )}
      
      {audioDevices.some(device => 
        device.label.toLowerCase().includes('usb') || 
        device.label.toLowerCase().includes('bluetooth')
      ) && (
        <p className="text-xs text-green-600">
          ✅ Dispositivos externos detectados
        </p>
      )}
    </div>
  );
};

export default AudioDeviceSelector;
