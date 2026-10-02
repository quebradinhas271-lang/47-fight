import type { FighterId } from "./fighters";

export interface FighterShadowConfig {
  shadowWidth: number;
  shadowHeight: number;
  shadowOffsetY: number;
  shadowAlpha: number;
}

/** Parâmetros visuais da sombra projetada no chão para cada lutador. */
export const FIGHTER_SHADOWS: Record<FighterId, FighterShadowConfig> = {
  dictador: {
    shadowWidth: 82,
    shadowHeight: 12,
    shadowOffsetY: 0,
    shadowAlpha: 0.34,
  },
  holofokiu: {
    shadowWidth: 112,
    shadowHeight: 14,
    shadowOffsetY: 0,
    shadowAlpha: 0.36,
  },
};
