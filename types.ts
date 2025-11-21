export enum GameState {
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Character {
  id: string;
  name: string;
  imgUrl: string;
  description: string;
  color: string;
}

export interface MathQuestion {
  num1: number;
  num2: number;
  answer: number;
  hasCarry: boolean; // Eldeli mi?
}

export interface GameStats {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
}