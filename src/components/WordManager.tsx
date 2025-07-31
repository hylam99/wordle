'use client';

import { useState } from 'react';
import { ConfigManager, AddWordsResult } from '@/services/configManager';
import { GameConfig, MAX_ROUNDS_OPTIONS } from '@/config/gameConfig';

interface WordManagerProps {
  configManager: ConfigManager;
  onConfigUpdate: (config: GameConfig) => void;
  disabled?: boolean; // Add disabled prop
}

export default function WordManager({ configManager, onConfigUpdate, disabled = false }: WordManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newWords, setNewWords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AddWordsResult | null>(null);

  const handleAddWords = async () => {
    if (!newWords.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const wordsArray = newWords
        .split(/[,\n\s]+/)
        .map(word => word.trim())
        .filter(word => word.length > 0);

      const addResult = await configManager.addWords(wordsArray);
      setResult(addResult);

      if (addResult.success) {
        onConfigUpdate(configManager.getConfig());
        setNewWords('');
      }
    } catch (error) {
      console.error('Error adding words:', error);
      setResult({
        added: [],
        duplicates: [],
        invalid: newWords.split(/[,\n\s]+/).filter(w => w.trim()),
        success: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxRoundsChange = (maxRounds: number) => {
    configManager.updateMaxRounds(maxRounds);
    onConfigUpdate(configManager.getConfig());
  };

  const currentConfig = configManager.getConfig();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg transition-colors ${
          disabled
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
        title={disabled ? 'Settings locked - game in progress' : 'Open game settings'}
      >
        ⚙️ Settings ({currentConfig.wordList.length} words, {currentConfig.maxRounds} attempts)
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Game Settings</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Attempts Setting */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Number of Attempts</h3>
          <div className="grid grid-cols-4 gap-2">
            {MAX_ROUNDS_OPTIONS.map((rounds) => (
              <button
                key={rounds}
                onClick={() => handleMaxRoundsChange(rounds)}
                className={`p-3 rounded-lg border-2 font-semibold transition-colors ${
                  currentConfig.maxRounds === rounds
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {rounds}
              </button>
            ))}
          </div>
        </div>

        <hr className="my-6" />

        {/* Word Management */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Word List Management</h3>
          <p className="text-gray-600 mb-2">
            Current word list contains <strong>{currentConfig.wordList.length} words</strong>
          </p>
          <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
            <div className="flex flex-wrap gap-1">
              {currentConfig.wordList.map((word, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Words (comma or line separated):
            </label>
            <textarea
              value={newWords}
              onChange={(e) => setNewWords(e.target.value)}
              placeholder="Enter 5-letter words, separated by commas or new lines&#10;Example: apple, house, brain"
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              rows={4}
            />
          </div>

          <button
            onClick={handleAddWords}
            disabled={!newWords.trim() || isLoading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Validating Words...' : 'Add Words'}
          </button>

          {result && (
            <div className="space-y-3">
              {result.added.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-semibold text-green-800 mb-2">
                    ✅ Successfully Added ({result.added.length}):
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {result.added.map((word, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.duplicates.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    ⚠️ Already Exists ({result.duplicates.length}):
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {result.duplicates.map((word, index) => (
                      <span key={index} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.invalid.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-semibold text-red-800 mb-2">
                    ❌ Invalid Words ({result.invalid.length}):
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {result.invalid.map((word, index) => (
                      <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                        {word}
                      </span>
                    ))}
                  </div>
                  <p className="text-red-600 text-sm mt-2">
                    These words were rejected because they are not valid English dictionary words or don't meet the 5-letter requirement.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              configManager.resetToDefault();
              onConfigUpdate(configManager.getConfig());
              setResult(null);
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Reset to Default Config
          </button>
        </div>
      </div>
    </div>
  );
}