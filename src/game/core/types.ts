import type { FighterId } from "../config/fighters";
import type { Difficulty } from "../config/combat";

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  block: boolean;
  light: boolean;
  heavy: boolean;
  special: boolean;
}

export const EMPTY_INPUT: InputState = {
  left: false,
  right: false,
  up: false,
  block: false,
  light: false,
  heavy: false,
  special: false,
};

export type FighterState =
  | "idle"
  | "walk"
  | "jump"
  | "fall"
  | "attack"
  | "block"
  | "hurt"
  | "ko"
  | "win";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FighterSnapshot {
  id: FighterId;
  name: string;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  state: FighterState;
  combo: number;
  cssColor: string;
}

export interface MatchSnapshot {
  p1: FighterSnapshot;
  p2: FighterSnapshot;
  timeLeft: number;
  over: boolean;
  winner: "p1" | "p2" | "draw" | null;
  paused: boolean;
}

export interface MatchConfig {
  p1: FighterId;
  p2: FighterId;
  mode: "ai" | "online";
  difficulty: Difficulty;
}
