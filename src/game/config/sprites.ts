import type { FighterId } from "./fighters";

/** Estados visuais disponíveis para cada lutador oficial. */
export type FighterAnimation =
  | "idle"
  | "walk"
  | "jump"
  | "fall"
  | "block"
  | "hurt"
  | "ko"
  | "win"
  | "light"
  | "heavy"
  | "special";

export interface SpriteAnimationDef {
  start: number;
  end: number;
  frameRate: number;
  repeat: number;
}

export interface FighterSpriteDef {
  /** Retrato opcional; null mantém o monograma seguro da seleção. */
  portrait: string | null;
  /** Spritesheet opcional; null impede que o Phaser solicite um arquivo ausente. */
  sheet: string | null;
  frameWidth: number;
  frameHeight: number;
  displayScale: number;
  animations: Record<FighterAnimation, SpriteAnimationDef>;
}

const animationLayout: Record<FighterAnimation, SpriteAnimationDef> = {
  idle: { start: 0, end: 5, frameRate: 8, repeat: -1 },
  walk: { start: 6, end: 13, frameRate: 12, repeat: -1 },
  jump: { start: 14, end: 16, frameRate: 10, repeat: 0 },
  fall: { start: 17, end: 19, frameRate: 10, repeat: 0 },
  block: { start: 20, end: 22, frameRate: 8, repeat: -1 },
  hurt: { start: 23, end: 25, frameRate: 12, repeat: 0 },
  ko: { start: 26, end: 31, frameRate: 10, repeat: 0 },
  win: { start: 32, end: 39, frameRate: 10, repeat: -1 },
  light: { start: 40, end: 44, frameRate: 14, repeat: 0 },
  heavy: { start: 45, end: 51, frameRate: 12, repeat: 0 },
  special: { start: 52, end: 60, frameRate: 14, repeat: 0 },
};

const pendingSprite = (): FighterSpriteDef => ({
  portrait: null,
  sheet: null,
  frameWidth: 256,
  frameHeight: 256,
  displayScale: 0.75,
  animations: animationLayout,
});

/**
 * Contrato dos assets oficiais. Os caminhos permanecem desativados até que os
 * arquivos sejam publicados; assim seleção e arena continuam usando fallback.
 */
export const FIGHTER_SPRITES: Record<FighterId, FighterSpriteDef> = {
  dictador: pendingSprite(),
  holofokiu: pendingSprite(),
};

export const spriteTextureKey = (fighter: FighterId) => `fighter-${fighter}`;
export const spriteAnimationKey = (fighter: FighterId, animation: FighterAnimation) =>
  `${spriteTextureKey(fighter)}-${animation}`;
