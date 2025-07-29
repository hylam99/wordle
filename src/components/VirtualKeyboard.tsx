'use client';

import { useMemo } from 'react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  letterStates: Map<string, 'hit' | 'present' | 'miss'>;
  currentGuess: string;
}

export default function VirtualKeyboard({ 
  onKeyPress, 
  onEnter, 
  onBackspace, 
  letterStates,
  currentGuess 
}: VirtualKeyboardProps) {
  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  const getKeyClass = (key: string) => {
    const baseClass = "font-bold py-3 px-2 rounded transition-colors text-sm border-2";
    
    if (key === 'ENTER' || key === 'BACKSPACE') {
      return `${baseClass} bg-gray-600 hover:bg-gray-700 text-white border-gray-700 px-4`;
    }

    const state = letterStates.get(key.toLowerCase());
    
    switch (state) {
      case 'hit':
        return `${baseClass} bg-green-500 text-white border-green-600`;
      case 'present':
        return `${baseClass} bg-yellow-500 text-white border-yellow-600`;
      case 'miss':
        return `${baseClass} bg-gray-400 text-white border-gray-500`;
      default:
        return `${baseClass} bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300`;
    }
  };

  const handleKeyClick = (key: string) => {
    if (key === 'ENTER') {
      onEnter();
    } else if (key === 'BACKSPACE') {
      onBackspace();
    } else {
      onKeyPress(key);
    }
  };

  const isEnterDisabled = currentGuess.length !== 5;
  const isBackspaceDisabled = currentGuess.length === 0;

  return (
    <div className="w-full max-w-lg mx-auto space-y-2">
      {keyboardRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1">
          {row.map((key) => {
            const isDisabled = 
              (key === 'ENTER' && isEnterDisabled) || 
              (key === 'BACKSPACE' && isBackspaceDisabled);
            
            return (
              <button
                key={key}
                onClick={() => handleKeyClick(key)}
                disabled={isDisabled}
                className={`
                  ${getKeyClass(key)}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${key === 'ENTER' || key === 'BACKSPACE' ? 'min-w-[60px]' : 'min-w-[40px]'}
                `}
              >
                {key === 'BACKSPACE' ? '⌫' : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}