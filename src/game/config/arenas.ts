export const ARENAS = {
  military_base: {
    id: "military_base",
    name: "Base Militar",
    image: "/assets/arenas/base-militar.png",
    fallbackImage: "/assets/arenas/base-militar.svg",
    description: "Um complexo fortificado sob refletores de alta potência.",
  },
  coliseum: {
    id: "coliseum",
    name: "Coliseu",
    image: "/assets/arenas/coliseu.png",
    fallbackImage: "/assets/arenas/coliseu.svg",
    description: "Pedra, areia e uma multidão pronta para o espetáculo.",
  },
  barra_lighthouse: {
    id: "barra_lighthouse",
    name: "Farol da Barra",
    image: "/assets/arenas/farol-da-barra.png",
    fallbackImage: "/assets/arenas/farol-da-barra.svg",
    description: "O combate encontra o mar sob a luz do histórico farol.",
  },
} as const;

export type ArenaId = keyof typeof ARENAS;
export type ArenaConfig = (typeof ARENAS)[ArenaId];
export const ARENA_LIST: readonly ArenaConfig[] = Object.values(ARENAS);
