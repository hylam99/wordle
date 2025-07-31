'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const gameOptions = [
    {
      id: 'normal',
      title: 'Normal Mode',
      icon: '🎯',
      path: '/normal',
      color: 'blue'
    },
    {
      id: 'hard',
      title: 'Hard Mode',
      icon: '⚔️',
      path: '/hard',
      color: 'red'
    }
  ];

  const handleGameSelect = (path: string) => {
    router.push(path);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex flex-col items-center pt-12">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">WORDLE</h1>
          <p className="text-xl text-gray-600">Choose your challenge</p>
        </div>

        <div className="grid gap-6 w-full max-w-4xl px-6">
          {gameOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => handleGameSelect(option.path)}
              className={`bg-white rounded-xl shadow-lg p-8 cursor-pointer transition-all hover:shadow-xl hover:scale-105 border-2 hover:border-${option.color}-500`}
            >
              <div className="flex items-center gap-6">
                <div className="text-6xl">{option.icon}</div>
                <div className="flex-1">
                  <h2 className={`text-3xl font-bold text-${option.color}-600`}>
                    {option.title}
                  </h2>
                </div>
                <div className={`text-${option.color}-500 text-2xl`}>
                  &rarr;
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
