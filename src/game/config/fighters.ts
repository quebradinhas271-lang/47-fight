/**
 * Atributos centralizados dos lutadores.
 * Nenhum outro módulo deve codificar dano, alcance ou velocidade diretamente.
 */
export type FighterId = "vex" | "titan" | "nyra";
export type AttackKind = "light" | "heavy" | "special";

export interface AttackDef {
  name: string;
  /** quadros (a 60 fps) de preparação / janela ativa / recuperação */
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  /** alcance horizontal do hitbox a partir da frente do corpo */
  range: number;
  /** altura do hitbox */
  height: number;
  /** deslocamento vertical do hitbox em relação ao centro do corpo */
  offsetY: number;
  knockback: number;
  launch: number;
  hitstun: number;
  energyCost: number;
  /** avanço do próprio lutador ao iniciar o golpe */
  lunge: number;
  cooldown: number;
  /** pode ser cancelado em outro golpe leve (combo) */
  comboable: boolean;
}

export interface FighterStats {
  id: FighterId;
  name: string;
  epithet: string;
  color: number;
  accent: number;
  cssColor: string;
  cssAccent: string;
  maxHp: number;
  speed: number;
  jumpForce: number;
  /** multiplicador de velocidade das animações de ataque */
  attackSpeed: number;
  maxEnergy: number;
  description: string;
  specialName: string;
  specialDescription: string;
  attacks: Record<AttackKind, AttackDef>;
}

export const FIGHTERS: Record<FighterId, FighterStats> = {
  vex: {
    id: "vex",
    name: "VEX",
    epithet: "Lâmina Veloz",
    color: 0x2f82ff,
    accent: 0x9ad8ff,
    cssColor: "#2f82ff",
    cssAccent: "#9ad8ff",
    maxHp: 100,
    speed: 265,
    jumpForce: 900,
    attackSpeed: 1.25,
    maxEnergy: 100,
    description:
      "Ágil e imprevisível. Troca potência por velocidade e pressão constante.",
    specialName: "Corte Fantasma",
    specialDescription: "Investida rápida que atravessa a guarda curta.",
    attacks: {
      light: { name: "Jab Rápido", startup: 4, active: 3, recovery: 7, damage: 6, range: 62, height: 60, offsetY: -22, knockback: 110, launch: 0, hitstun: 0.18, energyCost: 0, lunge: 40, cooldown: 0, comboable: true },
      heavy: { name: "Giro Cortante", startup: 10, active: 4, recovery: 20, damage: 13, range: 74, height: 90, offsetY: -10, knockback: 300, launch: -120, hitstun: 0.38, energyCost: 0, lunge: 110, cooldown: 0, comboable: false },
      special: { name: "Corte Fantasma", startup: 8, active: 8, recovery: 22, damage: 22, range: 120, height: 100, offsetY: -16, knockback: 430, launch: -200, hitstun: 0.5, energyCost: 50, lunge: 420, cooldown: 2.5, comboable: false },
    },
  },
  titan: {
    id: "titan",
    name: "TITAN",
    epithet: "Muralha de Aço",
    color: 0xff3b30,
    accent: 0xffb199,
    cssColor: "#ff3b30",
    cssAccent: "#ffb199",
    maxHp: 130,
    speed: 160,
    jumpForce: 790,
    attackSpeed: 0.82,
    maxEnergy: 100,
    description:
      "Pesado e resistente. Poucos acertos dele já mudam o rumo da luta.",
    specialName: "Impacto Sísmico",
    specialDescription: "Golpe no solo que arremessa o oponente para longe.",
    attacks: {
      light: { name: "Soco Pesado", startup: 6, active: 4, recovery: 12, damage: 9, range: 66, height: 70, offsetY: -24, knockback: 160, launch: 0, hitstun: 0.22, energyCost: 0, lunge: 26, cooldown: 0, comboable: true },
      heavy: { name: "Martelo", startup: 16, active: 5, recovery: 28, damage: 20, range: 82, height: 110, offsetY: -6, knockback: 380, launch: -140, hitstun: 0.5, energyCost: 0, lunge: 80, cooldown: 0, comboable: false },
      special: { name: "Impacto Sísmico", startup: 14, active: 9, recovery: 30, damage: 30, range: 150, height: 120, offsetY: 10, knockback: 520, launch: -260, hitstun: 0.6, energyCost: 60, lunge: 120, cooldown: 3.2, comboable: false },
    },
  },
  nyra: {
    id: "nyra",
    name: "NYRA",
    epithet: "Dança de Plasma",
    color: 0xb14bff,
    accent: 0x5ef2d6,
    cssColor: "#b14bff",
    cssAccent: "#5ef2d6",
    maxHp: 110,
    speed: 215,
    jumpForce: 860,
    attackSpeed: 1.0,
    maxEnergy: 100,
    description:
      "Equilibrada, com alcance médio e boa capacidade de controlar o espaço.",
    specialName: "Onda de Plasma",
    specialDescription: "Descarga de energia de longo alcance à frente.",
    attacks: {
      light: { name: "Estocada", startup: 5, active: 3, recovery: 9, damage: 7, range: 76, height: 60, offsetY: -22, knockback: 130, launch: 0, hitstun: 0.2, energyCost: 0, lunge: 34, cooldown: 0, comboable: true },
      heavy: { name: "Arco Duplo", startup: 12, active: 5, recovery: 22, damage: 16, range: 92, height: 100, offsetY: -12, knockback: 330, launch: -130, hitstun: 0.42, energyCost: 0, lunge: 70, cooldown: 0, comboable: false },
      special: { name: "Onda de Plasma", startup: 12, active: 10, recovery: 26, damage: 24, range: 230, height: 90, offsetY: -20, knockback: 400, launch: -150, hitstun: 0.5, energyCost: 50, lunge: 0, cooldown: 2.8, comboable: false },
    },
  },
};

export const FIGHTER_LIST = Object.values(FIGHTERS);
