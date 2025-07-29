import { GameConfig } from '@/config/gameConfig';
import { GuessResult, LetterResult } from '@/types/game';

// Server-side game state (keeps answer secret)
export interface ServerGameState {
  gameId: string;
  answer: string;
  currentRound: number;
  guesses: string[];
  gameOver: boolean;
  won: boolean;
  config: GameConfig;
  createdAt: Date;
}

// Client-safe game state (no answer exposed)
export interface ClientGameState {
  gameId: string;
  currentRound: number;
  guesses: string[];
  gameOver: boolean;
  won: boolean;
  answer?: string; // Only revealed when game is over
  maxRounds: number;
}

export class ServerGameService {
  private static games: Map<string, ServerGameState> = new Map();
  
  private static generateGameId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private static selectRandomWord(wordList: string[]): string {
    const index = Math.floor(Math.random() * wordList.length);
    return wordList[index].toLowerCase();
  }

  public static createGame(config: GameConfig): string {
    const gameId = this.generateGameId();
    const gameState: ServerGameState = {
      gameId,
      answer: this.selectRandomWord(config.wordList),
      currentRound: 0,
      guesses: [],
      gameOver: false,
      won: false,
      config,
      createdAt: new Date()
    };
    
    this.games.set(gameId, gameState);
    
    // Clean up old games (older than 1 hour)
    this.cleanupOldGames();
    
    return gameId;
  }

  public static validateGuess(guess: string): void {
    if (!guess || typeof guess !== 'string') {
      throw new Error('Guess must be a string');
    }
    
    const normalizedGuess = guess.toLowerCase().trim();
    
    if (normalizedGuess.length !== 5) {
      throw new Error('Guess must be exactly 5 letters');
    }
    
    if (!/^[a-zA-Z]+$/.test(normalizedGuess)) {
      throw new Error('Guess must contain only English alphabet letters');
    }
  }

  public static makeGuess(gameId: string, guess: string): { result: GuessResult[], gameState: ClientGameState } {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.gameOver) {
      throw new Error('Game is over');
    }

    this.validateGuess(guess);
    const normalizedGuess = guess.toLowerCase().trim();

    // Update game state
    game.guesses.push(normalizedGuess);
    game.currentRound++;

    // Check guess and get results
    const result = this.checkGuess(normalizedGuess, game.answer);
    
    // Check win condition
    if (normalizedGuess === game.answer) {
      game.gameOver = true;
      game.won = true;
    } 
    // Check lose condition
    else if (game.currentRound >= game.config.maxRounds) {
      game.gameOver = true;
      game.won = false;
    }

    // Save updated game state
    this.games.set(gameId, game);

    return {
      result,
      gameState: this.getClientSafeState(game)
    };
  }

  private static checkGuess(guess: string, answer: string): GuessResult[] {
    const result: GuessResult[] = [];
    const answerArray = [...answer];
    const guessArray = [...guess];
    
    // First pass: mark exact matches (hits)
    const used = new Array(5).fill(false);
    const guessUsed = new Array(5).fill(false);
    
    for (let i = 0; i < 5; i++) {
      if (guessArray[i] === answerArray[i]) {
        result[i] = { letter: guessArray[i], result: 'hit' };
        used[i] = true;
        guessUsed[i] = true;
      }
    }
    
    // Second pass: mark present letters (wrong position)
    for (let i = 0; i < 5; i++) {
      if (!guessUsed[i]) {
        let found = false;
        for (let j = 0; j < 5; j++) {
          if (!used[j] && guessArray[i] === answerArray[j]) {
            result[i] = { letter: guessArray[i], result: 'present' };
            used[j] = true;
            found = true;
            break;
          }
        }
        if (!found) {
          result[i] = { letter: guessArray[i], result: 'miss' };
        }
      }
    }
    
    return result;
  }

  public static getGameState(gameId: string): ClientGameState {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    return this.getClientSafeState(game);
  }

  private static getClientSafeState(game: ServerGameState): ClientGameState {
    return {
      gameId: game.gameId,
      currentRound: game.currentRound,
      guesses: [...game.guesses],
      gameOver: game.gameOver,
      won: game.won,
      answer: game.gameOver ? game.answer : undefined, // Only reveal answer when game is over
      maxRounds: game.config.maxRounds
    };
  }

  public static resetGame(gameId: string, config: GameConfig): ClientGameState {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Reset game state
    game.answer = this.selectRandomWord(config.wordList);
    game.currentRound = 0;
    game.guesses = [];
    game.gameOver = false;
    game.won = false;
    game.config = config;
    game.createdAt = new Date();

    this.games.set(gameId, game);
    return this.getClientSafeState(game);
  }

  private static cleanupOldGames(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [gameId, game] of this.games.entries()) {
      if (game.createdAt < oneHourAgo) {
        this.games.delete(gameId);
      }
    }
  }
}