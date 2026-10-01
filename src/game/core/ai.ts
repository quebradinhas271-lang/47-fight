import type { Difficulty } from "../config/combat";
import type { Fighter } from "./Fighter";
import { EMPTY_INPUT, type InputState } from "./types";

type AiState =
  | "approach"
  | "spacing"
  | "attack"
  | "defend"
  | "jump"
  | "retreat"
  | "special"
  | "recover";

interface Profile {
  reaction: number;
  blockChance: number;
  aggression: number;
  spacingBias: number;
  jumpChance: number;
  specialChance: number;
}

const PROFILES: Record<Difficulty, Profile> = {
  facil: { reaction: 0.55, blockChance: 0.12, aggression: 0.35, spacingBias: 0.2, jumpChance: 0.08, specialChance: 0.15 },
  normal: { reaction: 0.3, blockChance: 0.38, aggression: 0.6, spacingBias: 0.45, jumpChance: 0.14, specialChance: 0.4 },
  dificil: { reaction: 0.14, blockChance: 0.62, aggression: 0.82, spacingBias: 0.7, jumpChance: 0.18, specialChance: 0.75 },
};

/**
 * IA por máquina de estados. Usa apenas informações observáveis do estado atual
 * (distância, vida, energia, estado do oponente) — nunca ações futuras.
 */
export class FighterAI {
  private profile: Profile;
  private state: AiState = "approach";
  private timer = 0;
  private attackCooldown = 0;
  private input: InputState = { ...EMPTY_INPUT };

  constructor(difficulty: Difficulty) {
    this.profile = PROFILES[difficulty];
  }

  setDifficulty(d: Difficulty) {
    this.profile = PROFILES[d];
    this.state = "approach";
  }

  reset() {
    this.state = "approach";
    this.timer = 0;
    this.attackCooldown = 0;
    this.input = { ...EMPTY_INPUT };
  }

  update(dt: number, me: Fighter, foe: Fighter, frozen: boolean): InputState {
    if (frozen || !me.alive || !foe.alive) return { ...EMPTY_INPUT };
    this.timer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    if (this.timer <= 0) {
      this.decide(me, foe);
      this.timer = this.profile.reaction * (0.7 + Math.random() * 0.6);
    }
    return this.act(me, foe);
  }

  private decide(me: Fighter, foe: Fighter) {
    const dist = Math.abs(me.x - foe.x);
    const p = this.profile;
    const lightRange = me.stats.attacks.light.range + 50;
    const heavyRange = me.stats.attacks.heavy.range + 55;
    const specialRange = me.stats.attacks.special.range + 60;

    if (me.state === "hurt") {
      this.state = "recover";
      return;
    }

    const foeAttacking = foe.state === "attack";
    if (foeAttacking && dist < heavyRange + 40 && Math.random() < p.blockChance) {
      this.state = "defend";
      return;
    }

    const canSpecial =
      me.energy >= me.stats.attacks.special.energyCost && me.specialCooldown <= 0;
    if (canSpecial && dist < specialRange && Math.random() < p.specialChance) {
      this.state = "special";
      return;
    }

    if (dist <= heavyRange && this.attackCooldown <= 0 && Math.random() < p.aggression) {
      this.state = "attack";
      return;
    }

    const lowHp = me.hp < me.stats.maxHp * 0.3;
    if (lowHp && dist < lightRange && Math.random() < p.spacingBias) {
      this.state = "retreat";
      return;
    }

    if (dist > 260 && Math.random() < p.jumpChance) {
      this.state = "jump";
      return;
    }

    this.state = dist > lightRange ? "approach" : Math.random() < p.spacingBias ? "spacing" : "approach";
  }

  private act(me: Fighter, foe: Fighter): InputState {
    const i: InputState = { ...EMPTY_INPUT };
    const dist = Math.abs(me.x - foe.x);
    const toFoe = foe.x > me.x ? 1 : -1;

    switch (this.state) {
      case "approach":
        if (dist > me.stats.attacks.light.range + 30) {
          i.right = toFoe === 1;
          i.left = toFoe === -1;
        }
        break;
      case "spacing": {
        const ideal = me.stats.attacks.heavy.range + 40;
        if (dist < ideal - 25) {
          i.right = toFoe === -1;
          i.left = toFoe === 1;
        } else if (dist > ideal + 25) {
          i.right = toFoe === 1;
          i.left = toFoe === -1;
        }
        break;
      }
      case "retreat":
        i.right = toFoe === -1;
        i.left = toFoe === 1;
        break;
      case "defend":
        i.block = true;
        break;
      case "jump":
        i.up = true;
        i.right = toFoe === 1;
        i.left = toFoe === -1;
        break;
      case "recover":
        i.block = me.onGround;
        break;
      case "special":
        if (me.energy >= me.stats.attacks.special.energyCost && me.specialCooldown <= 0) {
          i.special = true;
          this.state = "spacing";
          this.attackCooldown = 0.5;
        }
        break;
      case "attack": {
        if (me.canAct() && me.state !== "attack" && this.attackCooldown <= 0) {
          const heavy = dist > me.stats.attacks.light.range && Math.random() < 0.5;
          if (heavy) i.heavy = true;
          else i.light = true;
          this.attackCooldown = heavy ? 0.7 : 0.3;
        } else if (dist > me.stats.attacks.light.range) {
          i.right = toFoe === 1;
          i.left = toFoe === -1;
        }
        break;
      }
    }
    this.input = i;
    return i;
  }
}
