import { NextRequest, NextResponse } from 'next/server';
import { HardModeGameService } from '@/services/hardModeGameService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;
    
    if (!config) {
      return NextResponse.json(
        { error: 'Game configuration is required' },
        { status: 400 }
      );
    }

    const gameId = HardModeGameService.createGame(config);
    const gameState = HardModeGameService.getGameState(gameId);
    
    return NextResponse.json({ gameId, gameState });
    
  } catch (error) {
    console.error('Error creating hard mode game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}