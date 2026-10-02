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

interface SpriteAnimationBase {
  /** Arquivo exclusivo desta animação. */
  asset: string;
  frameWidth: number;
  frameHeight: number;
  frameRate: number;
  repeat: number;
  /** Ajustes exclusivamente visuais em relação ao anchor corporal. */
  offsetX?: number;
  offsetY?: number;
  /** Override opcional da escala visual do lutador. */
  scale?: number;
}

/** Uma animação pode declarar a quantidade de frames ou um intervalo inclusivo. */
export type SpriteAnimationDef = SpriteAnimationBase &
  (
    | { frameCount: number; start?: number; end?: never }
    | { start: number; end: number; frameCount?: never }
  );

export interface FighterSpriteDef {
  /** Retrato opcional; null mantém o monograma seguro da seleção. */
  portrait: string | null;
  /** Frame único usado na arena enquanto as animações oficiais não chegam. */
  idleImage: string | null;
  /** Altura visual do PNG estático legado; não interfere na hitbox. */
  idleDisplayHeight: number;
  /** Escala padrão das spritesheets deste lutador. */
  displayScale: number;
  /** Cada estado é independente e pode ser adicionado gradualmente. */
  animations: Partial<Record<FighterAnimation, SpriteAnimationDef>>;
}

const pendingSprite = (): FighterSpriteDef => ({
  portrait: null,
  idleImage: null,
  idleDisplayHeight: 230,
  displayScale: 0.75,
  animations: {},
});

/**
 * Contrato dos assets oficiais. Até uma animação ser configurada, a imagem
 * estática (e, por último, o desenho vetorial) continua sendo o fallback.
 */
export const FIGHTER_SPRITES: Record<FighterId, FighterSpriteDef> = {
  dictador: {
    ...pendingSprite(),
    portrait: "/assets/fighters/el-dictador-portrait.png",
    idleImage: "/assets/fighters/el-dictador-idle.png",
    animations: {
      idle: {
        asset: "/assets/fighters/el-dictador-idle-sheet.png",
        frameWidth: 256,
        frameHeight: 256,
        frameCount: 6,
        frameRate: 8,
        repeat: -1,
        offsetY: 4,
        scale: 1.22,
      },
      walk: {
        asset: "/assets/fighters/el-dictador-walk-sheet.png",
        frameWidth: 256,
        frameHeight: 256,
        frameCount: 8,
        frameRate: 12,
        repeat: -1,
        offsetY: 4,
        scale: 1.22,
      },
    },
  },
  holofokiu: {
    ...pendingSprite(),
    portrait: "/assets/fighters/holofokiu-portrait.png",
    idleImage: "/assets/fighters/holofokiu-idle.png",
    animations: {
      idle: {
        asset: "/assets/fighters/holofokiu-idle-sheet.png",
        frameWidth: 256,
        frameHeight: 256,
        frameCount: 6,
        frameRate: 8,
        repeat: -1,
        offsetX: -6,
        offsetY: 2,
        scale: 1.21,
      },
    },
  },
};

export const idleTextureKey = (fighter: FighterId) => `fighter-${fighter}-idle`;

/** A chave por asset permite compartilhar uma carga sem duplicá-la. */
export const spriteTextureKey = (asset: string) => `fighter-sheet:${asset}`;

export const spriteAnimationKey = (fighter: FighterId, animation: FighterAnimation) =>
  `fighter-${fighter}-${animation}`;
