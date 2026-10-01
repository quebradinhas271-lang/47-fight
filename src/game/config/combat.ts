/**
 * Parâmetros globais de combate e física.
 * Tudo aqui é configurável para facilitar o balanceamento.
 */
export const COMBAT = {
  /** passo fixo de simulação (60 Hz) — independente do FPS do dispositivo */
  FIXED_DT: 1 / 60,
  MAX_STEPS_PER_FRAME: 5,

  GRAVITY: 2400,
  GROUND_Y: 610,
  ARENA_WIDTH: 1280,
  ARENA_HEIGHT: 720,
  WALL_MARGIN: 60,

  BODY_WIDTH: 62,
  BODY_HEIGHT: 150,

  ROUND_TIME: 99,
  MAX_ENERGY: 100,

  /** multiplicador de dano ao defender corretamente */
  BLOCK_DAMAGE_MULTIPLIER: 0.15,
  BLOCK_PUSHBACK: 170,
  BLOCK_STUN: 0.12,

  ENERGY_ON_HIT_DEALT: 9,
  ENERGY_ON_HIT_TAKEN: 7,
  ENERGY_ON_BLOCK: 4,

  /** janela em segundos para encadear combos */
  COMBO_WINDOW: 0.32,
  MAX_COMBO: 3,
  COMBO_DAMAGE_SCALING: 0.85,

  AIR_CONTROL: 0.55,
  GROUND_FRICTION: 12,
  HURT_FRICTION: 4,
} as const;

export type Difficulty = "facil" | "normal" | "dificil";
