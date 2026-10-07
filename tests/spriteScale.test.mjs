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

test("El Dictador light attack preserves approved width and ground baseline", () => {
  const { idle, light } = FIGHTER_SPRITES.dictador.animations;
  // Opaque bounds measured in the currently approved alpha masks. The vertical
  // scale is intentionally lower than alpha-height parity after in-game visual calibration.
  const idleBody = { width: 110, height: 241, bottomMargin: 6 };
  const attackGuard = { width: 361, height: 577, bottomMargin: 96 };
  assert.equal(light.frameWidth, 480);
  assert.equal(light.frameHeight, 768);
  assert.equal(light.frameCount, 6);
  const horizontalGrowth = light.scaleX / 0.37;
  const verticalGrowth = light.scaleY / 0.38;
  assert.ok(
    Math.abs(horizontalGrowth - verticalGrowth) < 0.03,
    "light attack must grow uniformly without distorting the approved body proportions",
  );
  assert.equal(light.scaleY, 0.466, "keep the final in-game vertical calibration");
  const alphaMatchedScale = (idleBody.height * idle.scale) / attackGuard.height;
  assert.ok(
    light.scaleY < alphaMatchedScale,
    "visual calibration intentionally compensates for the taller attack artwork",
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
