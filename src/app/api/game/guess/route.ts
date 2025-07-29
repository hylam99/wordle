import { NextRequest, NextResponse } from 'next/server';
import { ServerGameService } from '@/services/serverGameService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, guess } = body;
    
    // Validate request
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

    const result = ServerGameService.makeGuess(gameId, guess);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error making guess:', error);
    
    if (error instanceof Error) {
      // Return validation errors to client
      if (error.message.includes('Game not found') || 
          error.message.includes('Game is over') ||
          error.message.includes('must be exactly 5 letters') ||
          error.message.includes('must contain only English alphabet letters')) {
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