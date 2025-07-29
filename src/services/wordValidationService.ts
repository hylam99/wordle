export class WordValidationService {
  private static readonly DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
  
  /**
   * Validates if a word is a real English word using dictionary API
   */
  static async isRealWord(word: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.DICTIONARY_API_URL}${word.toLowerCase()}`);
      return response.ok;
    } catch (error) {
      console.error('Error validating word:', error);
      // Fallback: basic validation if API fails
      return this.basicWordValidation(word);
    }
  }

  /**
   * Fallback validation using basic rules
   */
  private static basicWordValidation(word: string): boolean {
    // Basic validation: check if it's 5 letters and contains only alphabets
    return /^[a-zA-Z]{5}$/.test(word);
  }

  /**
   * Validates multiple words at once
   */
  static async validateWords(words: string[]): Promise<{ valid: string[], invalid: string[] }> {
    const results = await Promise.allSettled(
      words.map(async (word) => ({
        word,
        isValid: await this.isRealWord(word)
      }))
    );

    const valid: string[] = [];
    const invalid: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.isValid) {
          valid.push(words[index]);
        } else {
          invalid.push(words[index]);
        }
      } else {
        invalid.push(words[index]);
      }
    });

    return { valid, invalid };
  }
}