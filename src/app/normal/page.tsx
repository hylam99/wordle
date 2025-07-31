'use client';

import WordleGame from "@/components/WordleGame";
import { useRouter } from 'next/navigation';

export default function NormalModePage() {
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
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Normal Mode</h1>
          <p className="text-gray-600">Classic Wordle experience</p>
        </div>
        
        <WordleGame />
      </div>
    </main>
  );
}