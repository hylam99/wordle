'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientGameService } from '@/services/clientGameService';
import { ConfigManager } from '@/services/configManager';
import { defaultConfig, GameConfig } from '@/config/gameConfig';
import { GuessResult } from '@/types/game';
import { ClientGameState } from '@/services/serverGameService';
import WordManager from './WordManager';
import VirtualKeyboard from './VirtualKeyboard';

export default function WordleGame() {
  const router = useRouter();
  const [configManager] = useState(() => new ConfigManager(defaultConfig));
  const [clientGameService] = useState(() => new ClientGameService());
  const [guess, setGuess] = useState('');
  const [results, setResults] = useState<GuessResult[][]>([]);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize game on component mount
  useEffect(() => {
    const initializeGame = async () => {
      setLoading(true);
      try {
        const initialGameState = await clientGameService.createGame(configManager.getConfig());
        setGameState(initialGameState);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to initialize game');
      } finally {
        setLoading(false);
      }
    };

    initializeGame();
  }, [clientGameService, configManager]);

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

  const handleConfigUpdate = useCallback(async (newConfig: GameConfig) => {
    setLoading(true);
    setError('');
    
    try {
      configManager.updateMaxRounds(newConfig.maxRounds);
      // Reset game with new configuration
      const newGameState = await clientGameService.resetGame(newConfig);
      setGameState(newGameState);
      setResults([]);
      setGuess('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update configuration');
    } finally {
      setLoading(false);
    }
  }, [clientGameService, configManager]);

  const handleKeyPress = useCallback((key: string) => {
    if (!gameState || gameState.gameOver || guess.length >= 5 || loading) return;
    setGuess(prev => prev + key.toLowerCase());
    setError('');
  }, [guess.length, gameState, loading]);

  const handleBackspace = useCallback(() => {
    if (loading) return;
    setGuess(prev => prev.slice(0, -1));
    setError('');
  }, [loading]);

  const handleEnter = useCallback(async () => {
    if (!gameState || gameState.gameOver || guess.length !== 5 || loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await clientGameService.makeGuess(guess);
      setResults(prev => [...prev, response.result]);
      setGuess('');
      setGameState(response.gameState);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [guess, clientGameService, gameState, loading]);

  const handleReset = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const newGameState = await clientGameService.resetGame(configManager.getConfig());
      setGameState(newGameState);
      setResults([]);
      setGuess('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset game');
    } finally {
      setLoading(false);
    }
  }, [clientGameService, configManager]);

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameState || gameState.gameOver || loading) return;

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
  }, [handleKeyPress, handleBackspace, handleEnter, gameState, loading]);

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

  // Show loading state while initializing
  if (loading && !gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-2xl font-bold text-gray-800 mb-4">Starting New Game...</div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-2xl font-bold text-red-600 mb-4">Failed to Start Game</div>
        <p className="text-gray-600 mb-4">{error || 'Unable to connect to game server'}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

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
          Guess the 5-letter word in {gameState.maxRounds} attempts or less!
        </p>
        {clientGameService.getGameId() && (
          <p className="text-xs text-gray-400 mt-1">
            Game ID: {clientGameService.getGameId()}
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">
            Round {gameState.currentRound} of {gameState.maxRounds}
          </p>
        </div>

        {/* Game Board */}
        <div className="grid gap-2 mb-6">
          {Array.from({ length: gameState.maxRounds }, (_, roundIndex) => (
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

        {/* Loading indicator */}
        {loading && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Processing...</span>
            </div>
          </div>
        )}

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
            {gameState.answer && (
              <div className="text-lg font-semibold">
                The word was: <span className="text-blue-600">{gameState.answer.toUpperCase()}</span>
              </div>
            )}
            <button 
              onClick={handleReset}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Starting...' : 'Play Again'}
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