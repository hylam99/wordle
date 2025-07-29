export type LetterResult = 'hit' | 'present' | 'miss';

export interface GuessResult {
  letter: string;
  result: LetterResult;
}

export interface GameState {
  answer: string;
  currentRound: number;
  guesses: string[];
  gameOver: boolean;
  won: boolean;
}