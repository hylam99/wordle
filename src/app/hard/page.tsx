'use client';

import HardModeGame from '@/components/HardModeGame';
import { useRouter } from 'next/navigation';

export default function HardModePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex flex-col items-center pt-8">
        <div className="w-full max-w-md mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Lobby
          </button>
        </div>
        
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-red-600 mb-2">Hard Mode</h1>
          <p className="text-gray-600">Hard Wordle Game</p>
        </div>
        
        <HardModeGame />
      </div>
    </main>
  );
}