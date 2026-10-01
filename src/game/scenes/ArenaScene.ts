import Phaser from "phaser";
import { COMBAT, type Difficulty } from "../config/combat";
import { FIGHTERS, type FighterId } from "../config/fighters";
import {
  FIGHTER_SPRITES,
  idleTextureKey,
  spriteAnimationKey,
  spriteTextureKey,
  type FighterAnimation,
} from "../config/sprites";
import { Fighter } from "../core/Fighter";
import { FighterAI } from "../core/ai";
import { resolveHits } from "../core/CombatSystem";
import type { GameBus } from "../core/bus";
import type { LocalInput } from "../core/input";
import {
  EMPTY_INPUT,
  type FighterSnapshot,
  type InputState,
  type MatchSnapshot,
} from "../core/types";

export interface ArenaSceneData {
  p1: FighterId;
  p2: FighterId;
  difficulty: Difficulty;
  mode: "ai" | "online";
  bus: GameBus;
  input: LocalInput;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: number;
  size: number;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

/** Compensa a pequena margem inferior dos PNGs sem deslocar a simulação/hitbox. */
const IDLE_IMAGE_GROUND_OFFSET = 4;

export class ArenaScene extends Phaser.Scene {
  private sceneData!: ArenaSceneData;
  private f1!: Fighter;
  private f2!: Fighter;
  private ai!: FighterAI;
  private bg!: Phaser.GameObjects.Graphics;
  private gfx!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private fighterSprites = new Map<Fighter, Phaser.GameObjects.Image | Phaser.GameObjects.Sprite>();
  private announce!: Phaser.GameObjects.Text;
  private sparks: Spark[] = [];
  private floats: FloatText[] = [];
  private accumulator = 0;
  private timeLeft: number = COMBAT.ROUND_TIME;
  private over = false;
  private winner: "p1" | "p2" | "draw" | null = null;
  private paused = false;
  private introTimer = 2;
  private endTimer = 0;
  private shake = 0;
  private hitStop = 0;

  constructor() {
    super("arena");
  }

  init(data: ArenaSceneData) {
    this.sceneData = data;
  }

  preload() {
    for (const id of new Set([this.sceneData.p1, this.sceneData.p2])) {
      const config = FIGHTER_SPRITES[id];
      if (config.idleImage) {
        this.load.image(idleTextureKey(id), config.idleImage);
      }
      if (config.sheet) {
        this.load.spritesheet(spriteTextureKey(id), config.sheet, {
          frameWidth: config.frameWidth,
          frameHeight: config.frameHeight,
        });
      }
    }
  }

  create() {
    const { p1, p2, difficulty } = this.sceneData;
    this.f1 = new Fighter(FIGHTERS[p1], 380, 1);
    this.f2 = new Fighter(FIGHTERS[p2], 900, -1);
    this.ai = new FighterAI(difficulty);

    this.bg = this.add.graphics();
    this.drawBackground();
    this.gfx = this.add.graphics();
    this.fx = this.add.graphics();
    this.prepareFighterSprite(this.f1);
    this.prepareFighterSprite(this.f2);

    this.announce = this.add
      .text(COMBAT.ARENA_WIDTH / 2, 300, "PREPARAR", {
        fontFamily: "Teko, Impact, sans-serif",
        fontSize: "140px",
        color: "#ff2f3c",
        stroke: "#000000",
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    this.resetMatch();
    this.events.on("shutdown", () => {
      this.sparks = [];
      this.floats = [];
      this.fighterSprites.clear();
    });
  }

  // ---------- controle externo (React) ----------
  setPaused(v: boolean) {
    if (this.sceneData.mode === "online") return; // pausa individual não é permitida online
    this.paused = v;
    this.emitSnapshot();
  }

  setDifficulty(d: Difficulty) {
    this.ai.setDifficulty(d);
  }

  resetMatch() {
    this.f1.reset(380, 1);
    this.f2.reset(900, -1);
    this.ai.reset();
    this.timeLeft = COMBAT.ROUND_TIME;
    this.over = false;
    this.winner = null;
    this.paused = false;
    this.introTimer = 2;
    this.endTimer = 0;
    this.accumulator = 0;
    this.hitStop = 0;
    this.shake = 0;
    this.sparks = [];
    this.floats = [];
    this.floatObjects.forEach((item) => item.setVisible(false));
    this.announce.setText("PREPARAR").setAlpha(1);
    this.sceneData.input.resetAll();
    this.emitSnapshot();
  }

  // ---------- loop ----------
  override update(_time: number, delta: number) {
    const dtRaw = Math.min(delta / 1000, 0.25);
    if (!this.paused) {
      this.accumulator += dtRaw;
      let steps = 0;
      while (this.accumulator >= COMBAT.FIXED_DT && steps < COMBAT.MAX_STEPS_PER_FRAME) {
        this.fixedStep(COMBAT.FIXED_DT);
        this.accumulator -= COMBAT.FIXED_DT;
        steps += 1;
      }
      if (steps === COMBAT.MAX_STEPS_PER_FRAME) this.accumulator = 0;
    }
    this.render(dtRaw);
  }

  private fixedStep(dt: number) {
    if (this.hitStop > 0) {
      this.hitStop -= dt;
      return;
    }

    const intro = this.introTimer > 0;
    if (intro) {
      this.introTimer -= dt;
      this.announce.setText(this.introTimer > 0.9 ? "PREPARAR" : "LUTEM!");
      if (this.introTimer <= 0) this.announce.setAlpha(0);
    }

    const frozen = intro || this.over;
    const i1: InputState = frozen ? { ...EMPTY_INPUT } : this.sceneData.input.sample();
    const i2: InputState =
      this.sceneData.mode === "ai"
        ? this.ai.update(dt, this.f2, this.f1, frozen)
        : { ...EMPTY_INPUT };

    const previousSeparation = this.f2.x - this.f1.x;
    this.f1.step(dt, i1, this.f2.x, frozen);
    this.f2.step(dt, i2, this.f1.x, frozen);
    this.pushApart(previousSeparation);

    const hits = resolveHits(this.f1, this.f2, this.over);
    for (const h of hits) {
      this.spawnHit(h.x, h.y, h.blocked, h.damage, h.heavy, h.defender.stats.cssAccent);
      this.hitStop = h.blocked ? 0.03 : h.heavy ? 0.09 : 0.04;
      this.shake = h.blocked ? 3 : h.heavy ? 12 : 6;
    }

    if (!this.over && !intro) {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (!this.f1.alive || !this.f2.alive || this.timeLeft <= 0) this.finish();
    }

    if (this.over) {
      this.endTimer += dt;
    }
    this.emitSnapshot();
  }

  /** Impede cruzamento de corpos, exceto quando um lutador passa por cima do outro. */
  private pushApart(previousSeparation: number) {
    const verticalOverlap =
      Math.min(this.f1.y, this.f2.y) -
      Math.max(this.f1.y - COMBAT.BODY_HEIGHT, this.f2.y - COMBAT.BODY_HEIGHT);
    if (verticalOverlap <= 0) return;

    const minDist = COMBAT.BODY_WIDTH * 0.85;
    const d = this.f2.x - this.f1.x;
    const abs = Math.abs(d);
    if (abs >= minDist) return;

    // Enquanto os corpos se sobrepõem verticalmente, preserva a ordem anterior
    // para que um passo grande da simulação não permita atravessar no chão.
    const dir = previousSeparation < 0 ? -1 : 1;
    const midpoint = (this.f1.x + this.f2.x) / 2;
    this.f1.x = midpoint - (dir * minDist) / 2;
    this.f2.x = midpoint + (dir * minDist) / 2;
  }

  private finish() {
    this.over = true;
    const h1 = this.f1.hp;
    const h2 = this.f2.hp;
    if (h1 === h2) {
      // desempate: quem tiver maior percentual de vida; empate total => jogador 1 (iniciativa)
      const r1 = h1 / this.f1.stats.maxHp;
      const r2 = h2 / this.f2.stats.maxHp;
      this.winner = r1 === r2 ? "draw" : r1 > r2 ? "p1" : "p2";
    } else if (!this.f1.alive) this.winner = "p2";
    else if (!this.f2.alive) this.winner = "p1";
    else {
      const r1 = h1 / this.f1.stats.maxHp;
      const r2 = h2 / this.f2.stats.maxHp;
      this.winner = r1 === r2 ? "draw" : r1 > r2 ? "p1" : "p2";
    }
    if (this.winner === "p1") this.f1.state = this.f1.alive ? "win" : "ko";
    if (this.winner === "p2") this.f2.state = this.f2.alive ? "win" : "ko";
    this.announce
      .setText(this.winner === "draw" ? "EMPATE" : this.winner === "p1" ? "K.O." : "K.O.")
      .setAlpha(1);
    this.shake = 16;
    this.sceneData.input.resetAll();
  }

  private snap(f: Fighter): FighterSnapshot {
    return {
      id: f.stats.id,
      name: f.stats.name,
      hp: Math.round(f.hp),
      maxHp: f.stats.maxHp,
      energy: Math.round(f.energy),
      maxEnergy: f.stats.maxEnergy,
      state: f.state,
      combo: f.comboCount,
      cssColor: f.stats.cssColor,
    };
  }

  private emitSnapshot() {
    const s: MatchSnapshot = {
      p1: this.snap(this.f1),
      p2: this.snap(this.f2),
      timeLeft: Math.ceil(this.timeLeft),
      over: this.over,
      winner: this.winner,
      paused: this.paused,
    };
    this.sceneData.bus.emit(s);
  }

  // ---------- efeitos ----------
  private spawnHit(
    x: number,
    y: number,
    blocked: boolean,
    damage: number,
    heavy: boolean,
    color: string,
  ) {
    const n = blocked ? 6 : heavy ? 18 : 11;
    const c = blocked ? 0x6fd7ff : heavy ? 0xff2f3c : 0xffd166;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * (heavy ? 380 : 220);
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        life: 0,
        max: 0.25 + Math.random() * 0.3,
        color: c,
        size: 3 + Math.random() * (heavy ? 6 : 3),
      });
    }
    this.floats.push({
      x,
      y: y - 30,
      text: blocked ? "BLOQUEIO" : `-${damage}`,
      life: 0,
      color: blocked ? "#6fd7ff" : color,
    });
  }

  // ---------- desenho ----------
  private drawBackground() {
    const g = this.bg;
    const W = COMBAT.ARENA_WIDTH;
    const H = COMBAT.ARENA_HEIGHT;
    g.clear();
    g.fillStyle(0x07080c, 1).fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) {
      const a = 0.05 + i * 0.004;
      g.fillStyle(0x12161f, a).fillRect(0, (H / 16) * i, W, H / 16);
    }
    // halo vermelho atrás da arena
    for (let r = 420; r > 0; r -= 30) {
      g.fillStyle(0xff2f3c, 0.012).fillCircle(W / 2, 430, r);
    }
    // estruturas ao fundo
    const towers = [90, 230, 400, 620, 820, 1010, 1160];
    towers.forEach((x, i) => {
      const w = 70 + ((i * 37) % 60);
      const h = 180 + ((i * 91) % 220);
      g.fillStyle(0x121722, 1).fillRect(x - w / 2, 430 - h, w, h);
      for (let wy = 0; wy < h - 20; wy += 26) {
        for (let wx = 6; wx < w - 12; wx += 20) {
          const lit = (i * 7 + wy + wx) % 5 < 2;
          g.fillStyle(lit ? 0x2f82ff : 0x1b2130, lit ? 0.55 : 1).fillRect(
            x - w / 2 + wx,
            430 - h + wy + 10,
            9,
            12,
          );
        }
      }
    });
    // refletores
    for (const x of [200, 640, 1080]) {
      g.fillStyle(0x2f82ff, 0.06);
      g.fillTriangle(x, 60, x - 170, COMBAT.GROUND_Y, x + 170, COMBAT.GROUND_Y);
    }
    // plataforma / ringue
    g.fillStyle(0x1a1f2b, 1).fillRect(0, COMBAT.GROUND_Y, W, H - COMBAT.GROUND_Y);
    g.fillStyle(0xff2f3c, 0.85).fillRect(0, COMBAT.GROUND_Y, W, 5);
    g.fillStyle(0x2f82ff, 0.25).fillRect(0, COMBAT.GROUND_Y + 5, W, 2);
    g.fillStyle(0x0d1118, 1).fillRect(0, COMBAT.GROUND_Y + 46, W, 6);
    for (let x = 0; x < W; x += 80) {
      g.fillStyle(0x222a39, 1).fillRect(x + 4, COMBAT.GROUND_Y + 12, 72, 24);
    }
    // laterais da arena
    g.fillStyle(0x0a0d14, 0.9).fillRect(0, 0, COMBAT.WALL_MARGIN - 28, H);
    g.fillStyle(0x0a0d14, 0.9).fillRect(W - COMBAT.WALL_MARGIN + 28, 0, COMBAT.WALL_MARGIN, H);
  }

  private render(dt: number) {
    const g = this.gfx;
    g.clear();
    this.drawFighter(g, this.f2, false, this.syncFighterSprite(this.f2));
    this.drawFighter(g, this.f1, true, this.syncFighterSprite(this.f1));

    // efeitos
    const fx = this.fx;
    fx.clear();
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      if (!s) continue;
      s.life += dt;
      if (s.life >= s.max) {
        this.sparks.splice(i, 1);
        continue;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 900 * dt;
      fx.fillStyle(s.color, 1 - s.life / s.max).fillCircle(s.x, s.y, s.size * (1 - s.life / s.max));
    }
    this.renderFloats(dt);

    // tremor de câmera
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 60);
      this.cameras.main.setScroll(
        (Math.random() - 0.5) * this.shake,
        (Math.random() - 0.5) * this.shake,
      );
    } else {
      this.cameras.main.setScroll(0, 0);
    }

    if (this.over) {
      this.announce.setAlpha(0.65 + Math.sin(this.time.now / 180) * 0.35);
    }
  }

  private floatObjects: Phaser.GameObjects.Text[] = [];
  private renderFloats(dt: number) {
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      if (!f) continue;
      f.life += dt;
      f.y -= 40 * dt;
      if (f.life > 0.7) this.floats.splice(i, 1);
    }
    while (this.floatObjects.length < this.floats.length) {
      this.floatObjects.push(
        this.add
          .text(0, 0, "", {
            fontFamily: "Teko, Impact, sans-serif",
            fontSize: "44px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 6,
          })
          .setOrigin(0.5),
      );
    }
    this.floatObjects.forEach((obj, i) => {
      const f = this.floats[i];
      if (!f) {
        obj.setVisible(false);
        return;
      }
      obj
        .setVisible(true)
        .setPosition(f.x, f.y)
        .setText(f.text)
        .setColor(f.color)
        .setAlpha(1 - f.life / 0.7);
    });
  }

  private prepareFighterSprite(f: Fighter) {
    const config = FIGHTER_SPRITES[f.stats.id];
    const texture = spriteTextureKey(f.stats.id);
    if (config.sheet && this.textures.exists(texture)) {
      for (const [state, animation] of Object.entries(config.animations) as [
        FighterAnimation,
        (typeof config.animations)[FighterAnimation],
      ][]) {
        const key = spriteAnimationKey(f.stats.id, state);
        if (!this.anims.exists(key)) {
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(texture, {
              start: animation.start,
              end: animation.end,
            }),
            frameRate: animation.frameRate,
            repeat: animation.repeat,
          });
        }
      }

      const sprite = this.add
        .sprite(f.x, f.y, texture)
        .setOrigin(0.5, 1)
        .setScale(config.displayScale);
      this.fighterSprites.set(f, sprite);
      return;
    }

    const idleTexture = idleTextureKey(f.stats.id);
    if (!config.idleImage || !this.textures.exists(idleTexture)) return;

    const image = this.add
      .image(f.x, f.y + IDLE_IMAGE_GROUND_OFFSET, idleTexture)
      .setOrigin(0.5, 1);
    image.setScale(config.idleDisplayHeight / image.height);
    this.fighterSprites.set(f, image);
  }

  /** Sincroniza a representação Phaser sem alterar a simulação de combate. */
  private syncFighterSprite(f: Fighter) {
    const sprite = this.fighterSprites.get(f);
    if (!sprite) return false;
    const animation: FighterAnimation = f.state === "attack" ? (f.attackKind ?? "idle") : f.state;
    const key = spriteAnimationKey(f.stats.id, animation);
    const hurtFlash = f.flash > 0 && Math.floor(f.flash * 40) % 2 === 0;
    let visualY = f.y;
    if (!(sprite instanceof Phaser.GameObjects.Sprite)) {
      visualY += IDLE_IMAGE_GROUND_OFFSET;
    }
    sprite
      .setPosition(f.x, visualY)
      .setFlipX(f.facing === -1)
      .setAlpha(hurtFlash ? 0.55 : 1);
    if (sprite instanceof Phaser.GameObjects.Sprite && sprite.anims.currentAnim?.key !== key) {
      sprite.play(key, true);
    }
    return true;
  }

  private drawFighter(
    g: Phaser.GameObjects.Graphics,
    f: Fighter,
    isP1: boolean,
    hasSprite: boolean,
  ) {
    const s = f.stats;
    const x = f.x;
    const y = f.y;
    const dir = f.facing;
    const W = COMBAT.BODY_WIDTH;
    const H = COMBAT.BODY_HEIGHT;
    const t = f.animTime;

    // sombra
    const airLift = Math.max(0, COMBAT.GROUND_Y - y);
    g.fillStyle(0x000000, 0.35 - Math.min(0.25, airLift / 1200)).fillEllipse(
      x,
      COMBAT.GROUND_Y + 8,
      W * 1.25 - airLift * 0.08,
      16,
    );

    if (hasSprite) {
      g.fillStyle(isP1 ? 0x2f82ff : 0xff2f3c, 0.9);
      g.fillTriangle(x - 12, y - H - 34, x + 12, y - H - 34, x, y - H - 16);
      return;
    }

    const hurtFlash = f.flash > 0 && Math.floor(f.flash * 40) % 2 === 0;
    const body = hurtFlash ? 0xffffff : s.color;
    const accent = hurtFlash ? 0xffffff : s.accent;

    let crouch = 0;
    let lean = 0;
    if (f.state === "walk") lean = Math.sin(t * 14) * 4;
    if (f.state === "block") crouch = 10;
    if (f.state === "hurt") lean = -dir * 10;
    if (f.state === "ko") crouch = H * 0.55;
    if (f.state === "attack" && f.attack) {
      const p = f.attackTime / (f.startupT + f.activeT + f.recoveryT);
      lean = dir * (p < 0.4 ? -8 : 14);
    }
    if (f.state === "win") crouch = Math.sin(t * 6) * -6;

    const topY = y - H + crouch;
    const ko = f.state === "ko";

    const drawBody = () => {
      // pernas
      const legSwing = f.state === "walk" ? Math.sin(t * 14) * 14 : f.onGround ? 0 : 10;
      g.fillStyle(0x12161f, 1);
      g.fillRect(x - 20 + legSwing, y - H * 0.42, 16, H * 0.42);
      g.fillRect(x + 6 - legSwing, y - H * 0.42, 16, H * 0.42);
      // tronco
      g.fillStyle(body, 1);
      g.fillRect(x - W / 2 + 8 + lean * 0.3, topY + H * 0.2, W - 16, H * 0.42);
      g.fillStyle(accent, 0.85);
      g.fillRect(x - W / 2 + 8 + lean * 0.3, topY + H * 0.2, W - 16, 8);
      // cabeça
      g.fillStyle(0x0f131b, 1).fillCircle(x + lean * 0.5, topY + H * 0.1, 22);
      g.fillStyle(accent, 1);
      g.fillRect(x + lean * 0.5 + (dir === 1 ? 4 : -18), topY + H * 0.06, 14, 5);
      // crista / identidade
      g.fillStyle(body, 1).fillTriangle(
        x + lean * 0.5 - 6,
        topY + H * 0.1 - 20,
        x + lean * 0.5 + 6,
        topY + H * 0.1 - 20,
        x + lean * 0.5 - dir * 14,
        topY + H * 0.1 - 40,
      );
    };

    drawBody();

    // braços / arma
    const shoulderY = topY + H * 0.3;
    if (f.state === "block") {
      g.fillStyle(0x6fd7ff, 0.22).fillRect(x + (dir === 1 ? 10 : -56), topY + 6, 46, H * 0.72);
      g.lineStyle(3, 0x6fd7ff, 0.9).strokeRect(x + (dir === 1 ? 10 : -56), topY + 6, 46, H * 0.72);
      g.lineStyle(0, 0, 0);
    } else if (f.state === "attack" && f.attack) {
      const a = f.attack;
      const phase =
        f.attackTime < f.startupT
          ? f.attackTime / Math.max(0.001, f.startupT)
          : f.attackTime < f.startupT + f.activeT
            ? 1
            : 1 - (f.attackTime - f.startupT - f.activeT) / Math.max(0.001, f.recoveryT);
      const reach = a.range * Math.min(1, phase);
      const hy = y - H / 2 + a.offsetY;
      const ax = dir === 1 ? x + W / 2 : x - W / 2 - reach;
      const active = f.hitbox() !== null;
      g.fillStyle(active ? accent : body, active ? 0.95 : 0.5);
      g.fillRect(ax, hy - a.height * 0.18, reach, Math.max(12, a.height * 0.36));
      if (f.attackKind === "special" && active) {
        g.fillStyle(accent, 0.3).fillRect(ax, hy - a.height / 2, reach, a.height);
      }
      g.fillStyle(body, 1).fillRect(x + (dir === 1 ? 10 : -34), shoulderY, 24, 14);
    } else {
      const sway = Math.sin(t * (f.state === "walk" ? 14 : 3)) * 5;
      g.fillStyle(body, 1);
      g.fillRect(x + (dir === 1 ? 14 : -36), shoulderY + sway, 22, 44);
    }

    if (ko) {
      g.fillStyle(0x000000, 0.35).fillRect(x - W / 2, y - 30, W, 30);
    }

    // marcador do jogador
    g.fillStyle(isP1 ? 0x2f82ff : 0xff2f3c, 0.9);
    g.fillTriangle(x - 12, topY - 34, x + 12, topY - 34, x, topY - 16);
  }
}
