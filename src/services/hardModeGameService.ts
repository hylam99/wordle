import { GameConfig } from "@/config/gameConfig";
import { GuessResult } from "@/types/game";
import { shuffle } from "@/utils/shuffle";

// Hard mode server-side game state
export interface HardModeServerState {
  gameId: string;
  candidates: string[];
  selectedAnswer?: string; // Only set when answer is finalized
  currentRound: number;
  guesses: string[];
  guessResults: GuessResult[][]; // Store actual results for each guess
  gameOver: boolean;
  won: boolean;
  config: GameConfig;
  createdAt: Date;
}

// Hard mode client-safe game state
export interface HardModeClientState {
  gameId: string;
  currentRound: number;
  guesses: string[];
  gameOver: boolean;
  won: boolean;
  answer?: string; // Only revealed when game is over
  maxRounds: number;
  candidatesCount: number; // Show how many candidates remain
  answerSelected: boolean; // Whether the answer has been finalized
}

interface WordScore {
  word: string;
  hitCount: number;
  presentCount: number;
}

export class HardModeGameService {
  private static games: Map<string, HardModeServerState> = new Map();

  private static generateGameId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  public static createGame(config: GameConfig): string {
    // candidates are selected 9 randomly from config.wordList
    const candidates = shuffle(config.wordList).slice(0, 9).map(word => word.toLowerCase());
   

    const gameId = this.generateGameId();
    const gameState: HardModeServerState = {
      gameId,
      candidates: candidates,
      selectedAnswer: undefined,
      currentRound: 0,
      guesses: [],
      guessResults: [],
      gameOver: false,
      won: false,
      config,
      createdAt: new Date(),
    };

    this.games.set(gameId, gameState);
    this.cleanupOldGames();

    return gameId;
  }

  public static validateGuess(guess: string): void {
    if (!guess || typeof guess !== "string") {
      throw new Error("Guess must be a string");
    }

    const normalizedGuess = guess.toLowerCase().trim();

    if (normalizedGuess.length !== 5) {
      throw new Error("Guess must be exactly 5 letters");
    }

    if (!/^[a-zA-Z]+$/.test(normalizedGuess)) {
      throw new Error("Guess must contain only English alphabet letters");
    }
  }

  public static makeGuess(
    gameId: string,
    guess: string
  ): { result: GuessResult[]; gameState: HardModeClientState } {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.gameOver) {
      throw new Error("Game is over");
    }

    this.validateGuess(guess);
    const normalizedGuess = guess.toLowerCase().trim();

    // Update game state
    game.guesses.push(normalizedGuess);
    game.currentRound++;

    let result: GuessResult[];

    if (game.selectedAnswer) {
      // Answer is already selected, behave like normal Wordle
      result = this.checkGuess(normalizedGuess, game.selectedAnswer);

      // Check win condition
      if (normalizedGuess === game.selectedAnswer) {
        game.gameOver = true;
        game.won = true;
      }
    } else {
      // Answer not selected yet, apply hard mode logic
      const { newCandidates, selectedAnswer, guessResult } =
        this.selectBestCandidate(
          game.candidates,
          normalizedGuess,
        );

      game.candidates = newCandidates;
      game.selectedAnswer = selectedAnswer;
      result = guessResult;

      // Check win condition
      if (selectedAnswer && normalizedGuess === selectedAnswer) {
        game.gameOver = true;
        game.won = true;
      }
    }

    // Store the result for this guess
    game.guessResults.push(result);

    // Check lose condition
    if (!game.gameOver && game.currentRound >= game.config.maxRounds) {
      game.gameOver = true;
      game.won = false;
    }

    // Save updated game state
    this.games.set(gameId, game);

    return {
      result,
      gameState: this.getClientSafeState(game),
    };
  }

  private static selectBestCandidate(
    candidates: string[],
    guess: string
  ): {
    newCandidates: string[];
    selectedAnswer?: string;
    guessResult: GuessResult[];
  } {
    // Score all candidates against current guess
    const scoredCandidates = candidates.map((candidate) => {
      const result = this.checkGuess(guess, candidate);
      const hitCount = result.filter((r) => r.result === "hit").length;
      const presentCount = result.filter((r) => r.result === "present").length;

      return {
        word: candidate,
        hitCount,
        presentCount,
        result,
      };
    });

    // Find candidates with no score
    const candidatesWithNoScore = scoredCandidates.filter(
      (s) => s.hitCount === 0 && s.presentCount === 0
    );
    const candidatesWithScore = scoredCandidates.filter(
      (s) => s.hitCount > 0 || s.presentCount > 0
    );
    if (candidatesWithScore.length === 0) {
      return {
        newCandidates: scoredCandidates.map((s) => s.word),
        selectedAnswer: undefined,
        guessResult: scoredCandidates[0].result, 
      };
    } else if (candidatesWithNoScore.length > 0) {
      return {
        newCandidates: candidatesWithNoScore.map((s) => s.word),
        selectedAnswer: undefined,
        guessResult: candidatesWithNoScore[0].result, 
      };
    }

    // If all candidates have at least 1 score, find the one with minimum hits, otherwise minimum presents
    const lessHits = Math.min(...scoredCandidates.map((s) => s.hitCount));
    const lessHitsCandidates = scoredCandidates.filter(
      (s) => s.hitCount === lessHits
    );
    const lessPresents = Math.min(
      ...scoredCandidates.map((s) => s.presentCount)
    );
    const lessPresentsCandidates = scoredCandidates.filter(
      (s) => s.presentCount === lessPresents
    );

    // Find candidates with minimum presents
    if (lessPresents > 0) {
      const selected = lessPresentsCandidates[0];
      return {
        newCandidates: [selected.word],
        selectedAnswer: selected.word,
        guessResult: selected.result,
      };
    }

    // Find candidates with minimum hits
    const selected = lessHitsCandidates[0];
    return {
      newCandidates: [selected.word],
      selectedAnswer: selected.word,
      guessResult: selected.result,
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
        result[i] = { letter: guessArray[i], result: "hit" };
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
            result[i] = { letter: guessArray[i], result: "present" };
            used[j] = true;
            found = true;
            break;
          }
        }
        if (!found) {
          result[i] = { letter: guessArray[i], result: "miss" };
        }
      }
    }

    return result;
  }

  public static getGameState(gameId: string): HardModeClientState {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    return this.getClientSafeState(game);
  }

  private static getClientSafeState(
    game: HardModeServerState
  ): HardModeClientState {
    return {
      gameId: game.gameId,
      currentRound: game.currentRound,
      guesses: [...game.guesses],
      gameOver: game.gameOver,
      won: game.won,
      answer: game.gameOver ? game.selectedAnswer : undefined,
      maxRounds: game.config.maxRounds,
      candidatesCount: game.candidates.length,
      answerSelected: !!game.selectedAnswer,
    };
  }

  public static resetGame(
    gameId: string,
    config: GameConfig
  ): HardModeClientState {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Reset game state
    game.candidates = shuffle(config.wordList).slice(0, 9).map((word) => word.toLowerCase());
    game.selectedAnswer = undefined;
    game.currentRound = 0;
    game.guesses = [];
    game.guessResults = [];
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
