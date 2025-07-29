export interface GameConfig {
  maxRounds: number;
  wordList: string[];
}

export const defaultConfig: GameConfig = {
  maxRounds: 6,
  wordList: [
    "brain", "happy", "cloud", "sport", "music",
    "dance", "world", "plant", "movie", "space",
    "light", "beach", "dream", "phone", "table",
    "house", "river", "smile", "heart", "peace",
    "power", "trust", "magic", "sleep", "green",
    "basic", "party", "stone", "fresh", "voice"
  ]
};

export const MAX_ROUNDS_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10];