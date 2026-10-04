import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/game/config/sprites.ts", import.meta.url), "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { FIGHTER_SPRITES } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

test("El Dictador light attack preserves idle body proportions and foot position", () => {
  const { idle, light } = FIGHTER_SPRITES.dictador.animations;
  // Opaque bounds measured in the currently approved alpha masks. A new sheet
  // must be recalibrated if the visual asset is replaced.
  const idleBody = { width: 110, height: 241, bottomMargin: 6 };
  const attackGuard = { width: 286, height: 488, bottomMargin: 115 };
  assert.equal(light.frameWidth, 480);
  assert.equal(light.frameHeight, 768);
  assert.equal(light.frameCount, 6);
  assert.ok(
    Math.abs(idleBody.width * idle.scale - attackGuard.width * light.scaleX) < 6,
    "stance should not suddenly become wider when starting a punch",
  );
  assert.ok(
    Math.abs(idleBody.height * idle.scale - attackGuard.height * light.scaleY) < 6,
    "stance should not change apparent height when starting a punch",
  );
  const idleFeet = idle.offsetY - idleBody.bottomMargin * idle.scale;
  const attackFeet = light.offsetY - attackGuard.bottomMargin * light.scaleY;
  assert.ok(Math.abs(idleFeet - attackFeet) < 3, "feet stay on the same floor line");
});

test("Phaser uses separate visual axis scales when supplied", async () => {
  const scene = await readFile(
    new URL("../src/game/scenes/ArenaScene.ts", import.meta.url),
    "utf8",
  );
  assert.ok(scene.includes("animationDef.scaleX ?? animationDef.scale"));
  assert.ok(scene.includes("animationDef.scaleY ?? animationDef.scale"));
});
