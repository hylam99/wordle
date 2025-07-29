import { GameConfig, defaultConfig } from '@/config/gameConfig';
import { WordValidationService } from './wordValidationService';

export interface AddWordsResult {
  added: string[];
  duplicates: string[];
  invalid: string[];
  success: boolean;
}

export class ConfigManager {
  private config: GameConfig;

  constructor(initialConfig: GameConfig = defaultConfig) {
    this.config = { ...initialConfig, wordList: [...initialConfig.wordList] };
  }

  /**
   * Add new words to the configuration with validation
   */
  async addWords(newWords: string[]): Promise<AddWordsResult> {
    // Normalize input words
    const normalizedWords = newWords
      .map(word => word.toLowerCase().trim())
      .filter(word => word.length === 5 && /^[a-zA-Z]+$/.test(word));

    // Check for duplicates
    const duplicates: string[] = [];
    const uniqueWords: string[] = [];

    normalizedWords.forEach(word => {
      if (this.config.wordList.includes(word)) {
        duplicates.push(word);
      } else if (!uniqueWords.includes(word)) {
        uniqueWords.push(word);
      }
    });

    // Validate that words are real English words
    const { valid, invalid } = await WordValidationService.validateWords(uniqueWords);

    // Add valid words to configuration
    this.config.wordList.push(...valid);

    return {
      added: valid,
      duplicates,
      invalid,
      success: valid.length > 0
    };
  }

  /**
   * Update the maximum number of rounds
   */
  updateMaxRounds(maxRounds: number): void {
    this.config.maxRounds = maxRounds;
  }

  /**
   * Get current configuration
   */
  getConfig(): GameConfig {
    return { ...this.config, wordList: [...this.config.wordList] };
  }

  /**
   * Reset configuration to default
   */
  resetToDefault(): void {
    this.config = { ...defaultConfig, wordList: [...defaultConfig.wordList] };
  }

  /**
   * Get word count
   */
  getWordCount(): number {
    return this.config.wordList.length;
  }

  /**
   * Remove words from configuration
   */
  removeWords(wordsToRemove: string[]): string[] {
    const normalizedWords = wordsToRemove.map(word => word.toLowerCase().trim());
    const removed: string[] = [];

    normalizedWords.forEach(word => {
      const index = this.config.wordList.indexOf(word);
      if (index > -1) {
        this.config.wordList.splice(index, 1);
        removed.push(word);
      }
    });

    return removed;
  }
}