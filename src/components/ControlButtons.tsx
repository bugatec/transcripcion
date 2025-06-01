
import React from 'react';
import { MicOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ControlButtonsProps {
  isListening: boolean;
  hasPermission: boolean | null;
  isMobile: boolean;
  transcript: string;
  onMicrophoneClick: () => void;
  onReset: () => void;
}

const ControlButtons = ({ 
  isListening, 
  hasPermission, 
  isMobile, 
  transcript, 
  onMicrophoneClick, 
  onReset 
}: ControlButtonsProps) => {
  return (
    <div className="flex justify-center gap-4">
      <Button
        onClick={onMicrophoneClick}
        size="lg"
        className={`px-8 py-6 text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
            : 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
        } shadow-lg`}
        disabled={hasPermission === false && !isMobile}
      >
        {isListening ? (
          <>
            <MicOff className="w-6 h-6 mr-2" />
            Detener
          </>
        ) : (
          <>
            <div className="w-6 h-6 mr-2 bg-white rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-current rounded-full"></div>
            </div>
            {isMobile && hasPermission === false ? 'Permitir Micrófono' : 'Iniciar'}
          </>
        )}
      </Button>

      <Button
        onClick={onReset}
        variant="outline"
        size="lg"
        className="px-6 py-6 text-lg font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
        disabled={!transcript}
      >
        <RotateCcw className="w-5 h-5 mr-2" />
        Limpiar
      </Button>
    </div>
  );
};

export default ControlButtons;
