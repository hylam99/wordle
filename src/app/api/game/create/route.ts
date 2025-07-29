import { NextRequest, NextResponse } from 'next/server';
import { ServerGameService } from '@/services/serverGameService';
import { defaultConfig } from '@/config/gameConfig';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config = defaultConfig } = body;
    
    // Validate config
    if (!config.wordList || !Array.isArray(config.wordList) || config.wordList.length === 0) {
      return NextResponse.json(
        { error: 'Invalid word list provided' },
        { status: 400 }
      );
    }
    
    if (!config.maxRounds || config.maxRounds < 1 || config.maxRounds > 20) {
      return NextResponse.json(
        { error: 'Max rounds must be between 1 and 20' },
        { status: 400 }
      );
    }

    const gameId = ServerGameService.createGame(config);
    const gameState = ServerGameService.getGameState(gameId);
    
    return NextResponse.json({
      gameId,
      gameState
    });
    
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}