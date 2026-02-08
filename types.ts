
export interface HorseType {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export interface FateWord {
  id: string;
  word: string;
  type: 'status' | 'action' | 'emotion';
  old_meaning: string;   // Fake traditional interpretation (古籍云)
  modern_meaning: string; // Modern cow-horse translation (人话)
  roast: string;         // System sarcastic comment (系统评)
}

export interface FakeMessage {
  content: string;
  author: string;
}

export type MessagePool = Record<string, string[]>;

export enum GameStep {
  LANDING = 0,
  USERNAME_INPUT = 1,
  SELECT_HORSE = 2,
  DRAW_FATE = 3,
  RELAY = 4,
  RESULT = 5,
}
