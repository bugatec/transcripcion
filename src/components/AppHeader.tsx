
import React from 'react';
import { Moon, Sun, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  theme: 'light' | 'dark';
  isMobile: boolean;
  isExpanded: boolean;
  onToggleTheme: () => void;
  onToggleExpanded: () => void;
}

const AppHeader = ({ theme, isMobile, isExpanded, onToggleTheme, onToggleExpanded }: AppHeaderProps) => {
  return (
    <div className="flex justify-end items-center mb-6">
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <Button
          onClick={onToggleTheme}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4" />
              Claro
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              Oscuro
            </>
          )}
        </Button>
        
        {/* Expand button - always visible */}
        <Button
          onClick={onToggleExpanded}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Expand className="w-4 h-4" />
          {isExpanded ? 'Contraer' : 'Expandir'}
        </Button>
      </div>
    </div>
  );
};

export default AppHeader;
