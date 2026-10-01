import { COMBAT } from "../config/combat";
import type { Fighter } from "./Fighter";
import type { Rect } from "./types";

export interface HitEvent {
  x: number;
  y: number;
  damage: number;
  blocked: boolean;
  attacker: Fighter;
  defender: Fighter;
  heavy: boolean;
}

const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/**
 * Única camada de regras de dano. Nenhum outro módulo altera vida diretamente.
 */
export function resolveHits(a: Fighter, b: Fighter, matchOver: boolean): HitEvent[] {
  if (matchOver) return [];
  const events: HitEvent[] = [];
  for (const [attacker, defender] of [
    [a, b],
    [b, a],
  ] as const) {
    if (!attacker.alive || !defender.alive) continue;
    const hb = attacker.hitbox();
    if (!hb) continue;
    if (attacker.hitTargets.has(defender)) continue; // um acerto por golpe
    if (!overlap(hb, defender.hurtbox())) continue;

    attacker.hitTargets.add(defender);
    const def = attacker.attack!;
    const dir: 1 | -1 = defender.x >= attacker.x ? 1 : -1;
    // defesa só funciona de frente para o ataque
    const blocked = defender.blocking && defender.state === "block" && defender.facing === -dir;

    const scaling = Math.pow(COMBAT.COMBO_DAMAGE_SCALING, attacker.comboCount);
    let damage = def.damage * scaling;
    if (blocked) damage *= COMBAT.BLOCK_DAMAGE_MULTIPLIER;
    damage = Math.max(1, Math.round(damage));

    defender.takeHit(
      damage,
      blocked ? COMBAT.BLOCK_PUSHBACK : def.knockback,
      blocked ? 0 : def.launch,
      def.hitstun,
      dir,
      blocked,
    );

    attacker.energy = Math.min(
      attacker.stats.maxEnergy,
      attacker.energy + (blocked ? COMBAT.ENERGY_ON_BLOCK : COMBAT.ENERGY_ON_HIT_DEALT),
    );
    if (!blocked) {
      attacker.comboTimer = COMBAT.COMBO_WINDOW;
    }

    events.push({
      x: (hb.x + hb.w / 2 + defender.x) / 2,
      y: hb.y + hb.h / 2,
      damage,
      blocked,
      attacker,
      defender,
      heavy: def.damage >= 13,
    });
  }
  return events;
}
