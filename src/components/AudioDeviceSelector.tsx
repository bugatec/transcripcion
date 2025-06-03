
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

  const getDeviceIcon = (label: string, deviceId: string) => {
    const lowerLabel = label.toLowerCase();
    const lowerDeviceId = deviceId.toLowerCase();
    
    if (lowerLabel.includes('usb') || lowerLabel.includes('external') || lowerDeviceId.includes('usb')) {
      return <Usb className="w-4 h-4 text-green-500" />;
    }
    if (lowerLabel.includes('bluetooth') || lowerLabel.includes('bt') || lowerDeviceId.includes('bt')) {
      return <Bluetooth className="w-4 h-4 text-blue-500" />;
    }
    if (lowerLabel.includes('headset') || lowerLabel.includes('headphone')) {
      return <Headphones className="w-4 h-4 text-purple-500" />;
    }
    return <Headphones className="w-4 h-4 text-gray-500" />;
  };

  // Detectar si hay dispositivos externos
  const externalDevices = audioDevices.filter(device => {
    const label = device.label.toLowerCase();
    const deviceId = device.deviceId.toLowerCase();
    return label.includes('usb') || 
           label.includes('external') ||
           label.includes('bluetooth') ||
           deviceId.includes('usb') ||
           deviceId.includes('external') ||
           deviceId.includes('bt') ||
           label.includes('headset');
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Headphones className="w-5 h-5 text-blue-500" />
        <span className="text-sm font-medium">
          Dispositivos de Audio ({audioDevices.length} encontrados)
        </span>
        {externalDevices.length > 0 && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            {externalDevices.length} externos
          </span>
        )}
        {!permissionGranted && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            Permisos requeridos
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Select value={selectedDeviceId} onValueChange={onDeviceChange} disabled={!permissionGranted}>
          <SelectTrigger className="w-[280px]">
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
                  {getDeviceIcon(device.label, device.deviceId)}
                  <span className="truncate max-w-[200px]" title={device.label}>
                    {device.label}
                  </span>
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
      
      {audioDevices.length === 0 && permissionGranted && !devicesLoading && (
        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-gray-300">
          <p className="font-medium mb-1">No se detectaron dispositivos:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Conecta tu micrófono USB-C y presiona actualizar</li>
            <li>Verifica que el dispositivo esté bien conectado</li>
            <li>Algunos dispositivos necesitan reiniciar la app</li>
          </ul>
        </div>
      )}
      
      {externalDevices.length > 0 && (
        <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
          <p className="flex items-center gap-1">
            ✅ <span className="font-medium">Dispositivos externos detectados:</span>
          </p>
          <ul className="mt-1 space-y-1">
            {externalDevices.map((device, index) => (
              <li key={device.deviceId} className="flex items-center gap-2">
                {getDeviceIcon(device.label, device.deviceId)}
                <span className="truncate">{device.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {devicesLoading && (
        <p className="text-xs text-blue-600 flex items-center gap-2">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Buscando dispositivos...
        </p>
      )}
    </div>
  );
};

export default AudioDeviceSelector;
