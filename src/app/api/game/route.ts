import { NextRequest, NextResponse } from 'next/server';
import { ServerGameService } from '@/services/serverGameService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    
    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    const gameState = ServerGameService.getGameState(gameId);
    
    return NextResponse.json({ gameState });
    
  } catch (error) {
    console.error('Error getting game state:', error);
    
    if (error instanceof Error && error.message.includes('Game not found')) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get game state' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, config } = body;
    
    if (!gameId || typeof gameId !== 'string') {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }
    
    if (!config) {
      return NextResponse.json(
        { error: 'Game configuration is required' },
        { status: 400 }
      );
    }

    const gameState = ServerGameService.resetGame(gameId, config);
    
    return NextResponse.json({ gameState });
    
  } catch (error) {
    console.error('Error resetting game:', error);
    
    if (error instanceof Error && error.message.includes('Game not found')) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to reset game' },
      { status: 500 }
    );
  }
}