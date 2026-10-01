import { COMBAT } from "../config/combat";
import type { AttackDef, AttackKind, FighterStats } from "../config/fighters";
import type { FighterState, InputState, Rect } from "./types";
import { EMPTY_INPUT } from "./types";

const frames = (f: number, speed: number) => f / 60 / speed;

/**
 * Entidade de combate pura (sem Phaser). Toda a física, máquina de estados e
 * temporização de golpes vive aqui, rodando em passo fixo.
 */
export class Fighter {
  readonly stats: FighterStats;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  facing: 1 | -1 = 1;
  hp: number;
  energy = 0;
  state: FighterState = "idle";
  onGround = true;
  blocking = false;

  attack: AttackDef | null = null;
  attackKind: AttackKind | null = null;
  attackTime = 0;
  startupT = 0;
  activeT = 0;
  recoveryT = 0;
  hitTargets = new Set<Fighter>();

  hurtTimer = 0;
  comboCount = 0;
  comboTimer = 0;
  specialCooldown = 0;
  animTime = 0;
  flash = 0;
  lockedInput: InputState = EMPTY_INPUT;

  constructor(stats: FighterStats, x: number, facing: 1 | -1) {
    this.stats = stats;
    this.x = x;
    this.y = COMBAT.GROUND_Y;
    this.hp = stats.maxHp;
    this.facing = facing;
  }

  reset(x: number, facing: 1 | -1) {
    this.x = x;
    this.y = COMBAT.GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.hp = this.stats.maxHp;
    this.energy = 0;
    this.state = "idle";
    this.onGround = true;
    this.blocking = false;
    this.attack = null;
    this.attackKind = null;
    this.attackTime = 0;
    this.hitTargets.clear();
    this.hurtTimer = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.specialCooldown = 0;
    this.animTime = 0;
    this.flash = 0;
  }

  get alive() {
    return this.hp > 0;
  }

  hurtbox(): Rect {
    const w = COMBAT.BODY_WIDTH;
    const h = COMBAT.BODY_HEIGHT;
    return { x: this.x - w / 2, y: this.y - h, w, h };
  }

  /** hitbox ativo ou null */
  hitbox(): Rect | null {
    if (this.state !== "attack" || !this.attack) return null;
    const t = this.attackTime;
    if (t < this.startupT || t > this.startupT + this.activeT) return null;
    const a = this.attack;
    const front = this.x + (this.facing * COMBAT.BODY_WIDTH) / 2;
    const x = this.facing === 1 ? front : front - a.range;
    return {
      x,
      y: this.y - COMBAT.BODY_HEIGHT / 2 + a.offsetY - a.height / 2,
      w: a.range,
      h: a.height,
    };
  }

  canAct() {
    return this.state !== "hurt" && this.state !== "ko" && this.state !== "win";
  }

  private startAttack(kind: AttackKind) {
    const a = this.stats.attacks[kind];
    if (a.energyCost > 0) {
      if (this.energy < a.energyCost || this.specialCooldown > 0) return;
      this.energy -= a.energyCost;
      this.specialCooldown = a.cooldown;
    }
    this.state = "attack";
    this.attack = a;
    this.attackKind = kind;
    this.attackTime = 0;
    this.startupT = frames(a.startup, this.stats.attackSpeed);
    this.activeT = frames(a.active, this.stats.attackSpeed);
    this.recoveryT = frames(a.recovery, this.stats.attackSpeed);
    this.hitTargets.clear();
    this.blocking = false;
    if (a.lunge && this.onGround) this.vx = this.facing * a.lunge;
  }

  /** chamado pelo sistema de combate quando este lutador é atingido */
  takeHit(
    damage: number,
    knockback: number,
    launch: number,
    hitstun: number,
    fromDir: 1 | -1,
    blocked: boolean,
  ) {
    this.hp = Math.max(0, this.hp - damage);
    this.flash = 0.15;
    if (blocked) {
      this.vx = fromDir * COMBAT.BLOCK_PUSHBACK;
      this.energy = Math.min(this.stats.maxEnergy, this.energy + COMBAT.ENERGY_ON_BLOCK);
      this.hurtTimer = Math.max(this.hurtTimer, COMBAT.BLOCK_STUN);
      return;
    }
    this.energy = Math.min(this.stats.maxEnergy, this.energy + COMBAT.ENERGY_ON_HIT_TAKEN);
    this.attack = null;
    this.attackKind = null;
    this.comboCount = 0;
    this.vx = fromDir * knockback;
    if (launch) {
      this.vy = launch;
      this.onGround = false;
    }
    this.hurtTimer = hitstun;
    this.state = this.hp <= 0 ? "ko" : "hurt";
    if (this.hp <= 0) {
      this.vx = fromDir * (knockback + 120);
      this.vy = -320;
      this.onGround = false;
    }
  }

  step(dt: number, input: InputState, opponentX: number, frozen: boolean) {
    this.animTime += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.specialCooldown > 0) this.specialCooldown -= dt;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }

    const act = !frozen && this.state !== "ko" && this.state !== "win";

    // Mantém os lutadores frente a frente, inclusive depois de uma passagem aérea.
    if (
      act &&
      (this.state === "idle" ||
        this.state === "walk" ||
        this.state === "jump" ||
        this.state === "fall")
    ) {
      this.facing = opponentX >= this.x ? 1 : -1;
    }

    if (this.state === "hurt") {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0) this.state = this.onGround ? "idle" : "fall";
    } else if (this.state === "attack" && this.attack) {
      this.attackTime += dt;
      const total = this.startupT + this.activeT + this.recoveryT;
      // cancelamento de combo: golpe leve pode encadear na recuperação
      const inRecovery = this.attackTime > this.startupT + this.activeT;
      if (
        act &&
        inRecovery &&
        this.attack.comboable &&
        input.light &&
        this.comboCount < COMBAT.MAX_COMBO
      ) {
        this.comboCount += 1;
        this.comboTimer = COMBAT.COMBO_WINDOW;
        this.startAttack("light");
      } else if (this.attackTime >= total) {
        this.attack = null;
        this.attackKind = null;
        this.state = this.onGround ? "idle" : "fall";
      }
    } else if (act) {
      this.blocking = input.block && this.onGround;
      if (this.blocking) {
        this.state = "block";
        this.vx = 0;
      } else {
        if (input.light) this.startAttack("light");
        else if (input.heavy) this.startAttack("heavy");
        else if (input.special) this.startAttack("special");
      }

      if (this.state !== "attack" && !this.blocking) {
        const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        const control = this.onGround ? 1 : COMBAT.AIR_CONTROL;
        if (dir !== 0) {
          this.vx = dir * this.stats.speed * control;
          if (this.onGround) this.state = "walk";
        } else if (this.onGround) {
          this.vx -= this.vx * Math.min(1, COMBAT.GROUND_FRICTION * dt);
          this.state = "idle";
        }
        // salto (sem salto infinito: exige estar no chão)
        if (input.up && this.onGround) {
          this.vy = -this.stats.jumpForce;
          this.onGround = false;
          this.state = "jump";
        }
      }
    } else {
      this.vx -= this.vx * Math.min(1, COMBAT.HURT_FRICTION * dt);
    }

    // física
    if (!this.onGround) {
      this.vy += COMBAT.GRAVITY * dt;
      if (this.state !== "attack" && this.state !== "hurt" && this.state !== "ko") {
        this.state = this.vy < 0 ? "jump" : "fall";
      }
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y >= COMBAT.GROUND_Y) {
      this.y = COMBAT.GROUND_Y;
      this.vy = 0;
      if (!this.onGround) {
        this.onGround = true;
        if (this.state === "jump" || this.state === "fall") this.state = "idle";
      }
    }

    const min = COMBAT.WALL_MARGIN;
    const max = COMBAT.ARENA_WIDTH - COMBAT.WALL_MARGIN;
    if (this.x < min) {
      this.x = min;
      this.vx = 0;
    }
    if (this.x > max) {
      this.x = max;
      this.vx = 0;
    }
  }
}
