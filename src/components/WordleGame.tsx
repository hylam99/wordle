'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { GameService } from '@/services/gameService';
import { ConfigManager } from '@/services/configManager';
import { defaultConfig, GameConfig } from '@/config/gameConfig';
import { GuessResult } from '@/types/game';
import WordManager from './WordManager';
import VirtualKeyboard from './VirtualKeyboard';

export default function WordleGame() {
  const [configManager] = useState(() => new ConfigManager(defaultConfig));
  const [gameService, setGameService] = useState(() => new GameService(configManager.getConfig()));
  const [guess, setGuess] = useState('');
  const [results, setResults] = useState<GuessResult[][]>([]);
  const [gameState, setGameState] = useState(gameService.getState());
  const [error, setError] = useState<string>('');

  // Track letter states for keyboard coloring
  const letterStates = useMemo(() => {
    const states = new Map<string, 'hit' | 'present' | 'miss'>();
    
    results.forEach(roundResults => {
      roundResults.forEach(({ letter, result }) => {
        const currentState = states.get(letter);
        // Prioritize hit > present > miss
        if (!currentState || 
            (result === 'hit') ||
            (result === 'present' && currentState === 'miss')) {
          states.set(letter, result);
        }
      });
    });
    
    return states;
  }, [results]);

  const handleConfigUpdate = useCallback((newConfig: GameConfig) => {
    gameService.updateConfig(newConfig);
    // Reset current game state when config changes
    setResults([]);
    setGuess('');
    setGameState(gameService.getState());
    setError('');
  }, [gameService]);

  const handleKeyPress = useCallback((key: string) => {
    if (gameState.gameOver || guess.length >= 5) return;
    setGuess(prev => prev + key.toLowerCase());
    setError('');
  }, [guess.length, gameState.gameOver]);

  const handleBackspace = useCallback(() => {
    setGuess(prev => prev.slice(0, -1));
    setError('');
  }, []);

  const handleEnter = useCallback(() => {
    if (gameState.gameOver || guess.length !== 5) return;
    
    setError('');
    
    try {
      const result = gameService.makeGuess(guess);
      setResults(prev => [...prev, result]);
      setGuess('');
      setGameState(gameService.getState());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  }, [guess, gameService, gameState.gameOver]);

  const handleReset = useCallback(() => {
    gameService.resetGame();
    setResults([]);
    setGuess('');
    setGameState(gameService.getState());
    setError('');
  }, [gameService]);

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState.gameOver) return;

      const key = event.key.toLowerCase();
      
      if (key === 'enter') {
        event.preventDefault();
        handleEnter();
      } else if (key === 'backspace') {
        event.preventDefault();
        handleBackspace();
      } else if (/^[a-z]$/.test(key)) {
        event.preventDefault();
        handleKeyPress(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleBackspace, handleEnter, gameState.gameOver]);

  const getLetterClass = (result: string) => {
    switch (result) {
      case 'hit':
        return 'bg-green-500 text-white border-green-600';
      case 'present':
        return 'bg-yellow-500 text-white border-yellow-600';
      case 'miss':
        return 'bg-gray-400 text-white border-gray-500';
      default:
        return 'bg-white border-gray-300';
    }
  };

  const config = gameService.getConfig();

  return (
    <div className="flex flex-col items-center gap-6 p-8 min-h-screen bg-gray-50">
      {/* Word Manager Component */}
      <WordManager 
        configManager={configManager}
        onConfigUpdate={handleConfigUpdate}
      />

      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Wordle Game</h1>
        <p className="text-gray-600">
          Guess the 5-letter word in {config.maxRounds} attempts or less!
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">
            Round {gameState.currentRound} of {config.maxRounds}
          </p>
        </div>

        {/* Game Board */}
        <div className="grid gap-2 mb-6">
          {Array.from({ length: config.maxRounds }, (_, roundIndex) => (
            <div key={roundIndex} className="flex gap-1 justify-center">
              {Array.from({ length: 5 }, (_, letterIndex) => {
                const roundResult = results[roundIndex];
                const letter = roundResult ? roundResult[letterIndex] : null;
                
                // Show current guess in progress
                const isCurrentRound = roundIndex === gameState.currentRound && !gameState.gameOver;
                const currentGuessLetter = isCurrentRound ? guess[letterIndex] : null;
                
                return (
                  <div
                    key={letterIndex}
                    className={`w-12 h-12 flex items-center justify-center border-2 font-bold text-lg
                      ${letter 
                        ? getLetterClass(letter.result) 
                        : currentGuessLetter 
                          ? 'bg-gray-100 border-gray-400' 
                          : 'bg-white border-gray-300'
                      }`}
                  >
                    {letter ? letter.letter.toUpperCase() : currentGuessLetter?.toUpperCase() || ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded mb-4">
            {error}
          </div>
        )}

        {/* Game Result */}
        {gameState.gameOver && (
          <div className="text-center space-y-4 mb-6">
            <div className={`text-2xl font-bold ${gameState.won ? 'text-green-600' : 'text-red-600'}`}>
              {gameState.won ? '🎉 Congratulations!' : '😔 Game Over!'}
            </div>
            <div className="text-lg">
              {gameState.won 
                ? `You won in ${gameState.currentRound} ${gameState.currentRound === 1 ? 'guess' : 'guesses'}!`
                : `Better luck next time!`
              }
            </div>
            <div className="text-lg font-semibold">
              The word was: <span className="text-blue-600">{gameState.answer.toUpperCase()}</span>
            </div>
            <button 
              onClick={handleReset}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Virtual Keyboard */}
      <VirtualKeyboard
        onKeyPress={handleKeyPress}
        onEnter={handleEnter}
        onBackspace={handleBackspace}
        letterStates={letterStates}
        currentGuess={guess}
      />

      {/* Game Rules */}
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="font-bold text-lg mb-3">How to Play:</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 text-white text-xs font-bold flex items-center justify-center">G</div>
            <span><strong>Hit:</strong> Letter is in the correct spot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-500 text-white text-xs font-bold flex items-center justify-center">Y</div>
            <span><strong>Present:</strong> Letter is in the word but wrong spot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-400 text-white text-xs font-bold flex items-center justify-center">G</div>
            <span><strong>Miss:</strong> Letter is not in the word</span>
          </div>
        </div>
      </div>
    </div>
  );
}