/**
 * Atributos centralizados dos lutadores.
 * Nenhum outro módulo deve codificar dano, alcance ou velocidade diretamente.
 */
export type FighterId = "dictador" | "holofokiu";
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
  dictador: {
    id: "dictador",
    name: "EL DICTADOR",
    epithet: "Punho da Autoridade",
    color: 0xd71920,
    accent: 0xffb52e,
    cssColor: "#d71920",
    cssAccent: "#ffb52e",
    maxHp: 110,
    speed: 225,
    jumpForce: 950,
    attackSpeed: 1.05,
    maxEnergy: 100,
    description: "Pressão implacável, avanços explosivos e golpes cobertos por energia rubra.",
    specialName: "Decreto Final",
    specialDescription: "Uma investida de energia vermelha que rompe a distância.",
    attacks: {
      light: {
        name: "Soco de Comando",
        startup: 5,
        active: 3,
        recovery: 9,
        damage: 7,
        range: 68,
        height: 62,
        offsetY: -24,
        knockback: 135,
        launch: 0,
        hitstun: 0.2,
        energyCost: 0,
        lunge: 35,
        cooldown: 0,
        comboable: true,
      },
      heavy: {
        name: "Chute Soberano",
        startup: 11,
        active: 5,
        recovery: 22,
        damage: 16,
        range: 94,
        height: 86,
        offsetY: -14,
        knockback: 345,
        launch: -135,
        hitstun: 0.44,
        energyCost: 0,
        lunge: 82,
        cooldown: 0,
        comboable: false,
      },
      special: {
        name: "Decreto Final",
        startup: 10,
        active: 9,
        recovery: 26,
        damage: 25,
        range: 170,
        height: 98,
        offsetY: -18,
        knockback: 450,
        launch: -190,
        hitstun: 0.54,
        energyCost: 50,
        lunge: 310,
        cooldown: 2.8,
        comboable: false,
      },
    },
  },
  holofokiu: {
    id: "holofokiu",
    name: "HOLOFOKIU",
    epithet: "Guardião Celeste",
    color: 0xe3262e,
    accent: 0x3f8cff,
    cssColor: "#e3262e",
    cssAccent: "#66a8ff",
    maxHp: 120,
    speed: 195,
    jumpForce: 950,
    attackSpeed: 0.94,
    maxEnergy: 100,
    description: "Defesa sólida e artes marciais precisas, amplificadas por energia azul.",
    specialName: "Onda do Guardião",
    specialDescription: "Projeta um impacto concentrado de energia celeste.",
    attacks: {
      light: {
        name: "Punho de Bronze",
        startup: 5,
        active: 4,
        recovery: 10,
        damage: 8,
        range: 70,
        height: 64,
        offsetY: -22,
        knockback: 145,
        launch: 0,
        hitstun: 0.21,
        energyCost: 0,
        lunge: 30,
        cooldown: 0,
        comboable: true,
      },
      heavy: {
        name: "Chute Celeste",
        startup: 13,
        active: 5,
        recovery: 24,
        damage: 18,
        range: 100,
        height: 92,
        offsetY: -12,
        knockback: 365,
        launch: -150,
        hitstun: 0.47,
        energyCost: 0,
        lunge: 74,
        cooldown: 0,
        comboable: false,
      },
      special: {
        name: "Onda do Guardião",
        startup: 13,
        active: 10,
        recovery: 28,
        damage: 27,
        range: 215,
        height: 100,
        offsetY: -20,
        knockback: 430,
        launch: -170,
        hitstun: 0.56,
        energyCost: 55,
        lunge: 45,
        cooldown: 3,
        comboable: false,
      },
    },
  },
};

export const FIGHTER_LIST = Object.values(FIGHTERS);
