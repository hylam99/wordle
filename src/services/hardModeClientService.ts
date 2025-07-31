import { GameConfig } from '@/config/gameConfig';
import { GuessResult } from '@/types/game';
import { HardModeClientState } from './hardModeGameService';

export interface HardModeGuessResponse {
  result: GuessResult[];
  gameState: HardModeClientState;
}

export class HardModeClientService {
  private gameId: string | null = null;

  async createGame(config: GameConfig): Promise<HardModeClientState> {
    const response = await fetch('/api/hard-game/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create game');
    }

    const data = await response.json();
    this.gameId = data.gameId;
    return data.gameState;
  }

  async makeGuess(guess: string): Promise<HardModeGuessResponse> {
    if (!this.gameId) {
      throw new Error('No active game');
    }

    const response = await fetch('/api/hard-game/guess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId: this.gameId, guess }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to make guess');
    }

    return await response.json();
  }

  async getGameState(): Promise<HardModeClientState> {
    if (!this.gameId) {
      throw new Error('No active game');
    }

    const response = await fetch(`/api/hard-game?gameId=${this.gameId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get game state');
    }

    const data = await response.json();
    return data.gameState;
  }

  async resetGame(config: GameConfig): Promise<HardModeClientState> {
    if (!this.gameId) {
      throw new Error('No active game');
    }

    const response = await fetch('/api/hard-game', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId: this.gameId, config }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset game');
    }

    const data = await response.json();
    return data.gameState;
  }

  getGameId(): string | null {
    return this.gameId;
  }
}