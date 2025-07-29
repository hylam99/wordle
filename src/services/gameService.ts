import { GameConfig } from '@/config/gameConfig';
import { GuessResult, GameState, LetterResult } from '@/types/game';

export class GameService {
  private state: GameState;
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
    this.state = this.initializeGame();
  }

  private initializeGame(): GameState {
    return {
      answer: this.selectRandomWord(),
      currentRound: 0,
      guesses: [],
      gameOver: false,
      won: false
    };
  }

  private selectRandomWord(): string {
    const index = Math.floor(Math.random() * this.config.wordList.length);
    return this.config.wordList[index].toLowerCase();
  }

  private validateGuess(guess: string): void {
    if (guess.length !== 5) {
      throw new Error('Guess must be exactly 5 letters');
    }
    
    if (!/^[a-zA-Z]+$/.test(guess)) {
      throw new Error('Guess must contain only English alphabet letters');
    }
  }

  public makeGuess(guess: string): GuessResult[] {
    if (this.state.gameOver) {
      throw new Error('Game is over');
    }

    const normalizedGuess = guess.toLowerCase().trim();
    this.validateGuess(normalizedGuess);

    this.state.guesses.push(normalizedGuess);
    this.state.currentRound++;

    const result = this.checkGuess(normalizedGuess);
    
    // Check win condition
    if (normalizedGuess === this.state.answer) {
      this.state.gameOver = true;
      this.state.won = true;
    } 
    // Check lose condition
    else if (this.state.currentRound >= this.config.maxRounds) {
      this.state.gameOver = true;
      this.state.won = false;
    }

    return result;
  }

  private checkGuess(guess: string): GuessResult[] {
    const result: GuessResult[] = [];
    const answerArray = [...this.state.answer];
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

  public getState(): GameState {
    return { ...this.state };
  }

  public resetGame(): void {
    this.state = this.initializeGame();
  }

  public getConfig(): GameConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: GameConfig): void {
    this.config = { ...newConfig };
    // Reset game when config changes to use new word list
    this.state = this.initializeGame();
  }
}