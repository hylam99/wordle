import { GameConfig } from '@/config/gameConfig';
import { GuessResult } from '@/types/game';
import { ClientGameState } from '@/services/serverGameService';

export class ClientGameService {
  private gameId: string | null = null;
  private gameState: ClientGameState | null = null;

  async createGame(config: GameConfig): Promise<ClientGameState> {
    try {
      const response = await fetch('/api/game/create', {
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
      this.gameState = data.gameState;
      
      if (!this.gameState) {
        throw new Error('Invalid game state received from server');
      }
      
      return this.gameState;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }

  async makeGuess(guess: string): Promise<{ result: GuessResult[], gameState: ClientGameState }> {
    if (!this.gameId) {
      throw new Error('No active game. Please start a new game.');
    }

    try {
      const response = await fetch('/api/game/guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          gameId: this.gameId, 
          guess 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to make guess');
      }

      const data = await response.json();
      this.gameState = data.gameState;
      
      return data;
    } catch (error) {
      console.error('Error making guess:', error);
      throw error;
    }
  }

  async getGameState(): Promise<ClientGameState> {
    if (!this.gameId) {
      throw new Error('No active game. Please start a new game.');
    }

    try {
      const response = await fetch(`/api/game?gameId=${this.gameId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get game state');
      }

      const data = await response.json();
      this.gameState = data.gameState;
      
      if (!this.gameState) {
        throw new Error('Invalid game state received from server');
      }
      
      return this.gameState;
    } catch (error) {
      console.error('Error getting game state:', error);
      throw error;
    }
  }

  async resetGame(config: GameConfig): Promise<ClientGameState> {
    if (!this.gameId) {
      throw new Error('No active game. Please start a new game.');
    }

    try {
      const response = await fetch('/api/game', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          gameId: this.gameId, 
          config 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset game');
      }

      const data = await response.json();
      this.gameState = data.gameState;
      
      if (!this.gameState) {
        throw new Error('Invalid game state received from server');
      }
      
      return this.gameState;
    } catch (error) {
      console.error('Error resetting game:', error);
      throw error;
    }
  }

  getCurrentGameState(): ClientGameState | null {
    return this.gameState;
  }

  getGameId(): string | null {
    return this.gameId;
  }

  hasActiveGame(): boolean {
    return this.gameId !== null && this.gameState !== null;
  }
}