import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button 
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      className="border border-pixelYellow bg-black text-pixelYellow shadow-lg hover:bg-pixelYellow hover:text-black"
    >
      {theme === 'light' ? (
        <Moon className="size-5 text-pixelYellow" />
      ) : (
        <Sun className="size-5 text-pixelYellow" />
      )}
    </Button>
  );
};

export default ThemeToggle; 