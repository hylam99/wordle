import { NextRequest, NextResponse } from 'next/server';
import { HardModeGameService } from '@/services/hardModeGameService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, guess } = body;
    
    if (!gameId || typeof gameId !== 'string') {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }
    
    if (!guess || typeof guess !== 'string') {
      return NextResponse.json(
        { error: 'Guess is required' },
        { status: 400 }
      );
    }

    const response = HardModeGameService.makeGuess(gameId, guess);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error making hard mode guess:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Game not found')) {
        return NextResponse.json(
          { error: 'Game not found' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Game is over')) {
        return NextResponse.json(
          { error: 'Game is already over' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('must be') || error.message.includes('contain only')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to process guess' },
      { status: 500 }
    );
  }
}