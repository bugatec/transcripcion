
import React from 'react';
import { Languages } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import ArrowRight from './ArrowRight';

interface LanguageSelectorProps {
  translationDirection: string;
  onDirectionChange: (value: string) => void;
  isHidden?: boolean;
}

const LanguageSelector = ({ translationDirection, onDirectionChange, isHidden = false }: LanguageSelectorProps) => {
  if (isHidden) return null;

  return (
    <div className="flex justify-center mb-6">
      <Card className="p-4 shadow-md dark:bg-gray-800">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">Traducción:</span>
          </div>
          
          <ToggleGroup 
            type="single" 
            value={translationDirection} 
            onValueChange={onDirectionChange}
            className="border rounded-md"
          >
            <ToggleGroupItem value="es-en" className="px-3 flex items-center gap-1">
              <span>🇪🇸</span>
              <ArrowRight />
              <span>🇺🇸</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="en-es" className="px-3 flex items-center gap-1">
              <span>🇺🇸</span>
              <ArrowRight />
              <span>🇪🇸</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </Card>
    </div>
  );
};

export default LanguageSelector;
