import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import ts from "typescript";

/** Runs unmodified combat TypeScript in isolation, without booting Phaser. */
async function loadTypeScript(path, dependencies = {}) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  runInNewContext(javascript, {
    module,
    exports: module.exports,
    require: (id) => {
      assert.ok(Object.hasOwn(dependencies, id), `unexpected runtime import: ${id}`);
      return dependencies[id];
    },
  });
  return module.exports;
}

test("El Dictador: idle -> official light attack -> idle in real combat simulation", async () => {
  const combat = await loadTypeScript("src/game/config/combat.ts");
  const fighters = await loadTypeScript("src/game/config/fighters.ts");
  const types = await loadTypeScript("src/game/core/types.ts");
  const { Fighter } = await loadTypeScript("src/game/core/Fighter.ts", {
    "../config/combat": combat,
    "./types": types,
  });
  const { resolveHits } = await loadTypeScript("src/game/core/CombatSystem.ts", {
    "../config/combat": combat,
  });

  const attacker = new Fighter(fighters.FIGHTERS.dictador, 380, 1);
  const defender = new Fighter(fighters.FIGHTERS.holofokiu, 500, -1);
  const dt = combat.COMBAT.FIXED_DT;
  const idleInput = { ...types.EMPTY_INPUT };

  attacker.step(dt, idleInput, defender.x, false);
  assert.equal(attacker.state, "idle");
  attacker.step(dt, { ...idleInput, light: true }, defender.x, false);
  assert.equal(attacker.state, "attack");
  assert.equal(attacker.attackKind, "light");

  let landedHits = 0;
  for (let frame = 0; frame < 35; frame += 1) {
    attacker.step(dt, idleInput, defender.x, false);
    defender.step(dt, idleInput, attacker.x, false);
    landedHits += resolveHits(attacker, defender, false).length;
  }

  assert.equal(landedHits, 1, "one punch must land once, not once per sprite frame");
  assert.equal(defender.hp, defender.stats.maxHp - attacker.stats.attacks.light.damage);
  assert.equal(attacker.state, "idle");
  assert.equal(attacker.attackKind, null);
  assert.equal(attacker.y, combat.COMBAT.GROUND_Y, "animation must not affect physical ground");
});
