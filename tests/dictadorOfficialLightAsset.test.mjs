import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const png = await readFile(
  new URL("../public/assets/fighters/el-dictador-light-attack.png", import.meta.url),
);
const source = await readFile(new URL("../src/game/config/sprites.ts", import.meta.url), "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { FIGHTER_SPRITES } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

test("El Dictador official light attack PNG matches the configured sprite frames", () => {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(png.subarray(0, 8).equals(signature), "official light attack must be a PNG");
  const sheetWidth = png.readUInt32BE(16);
  const sheetHeight = png.readUInt32BE(20);
  const light = FIGHTER_SPRITES.dictador.animations.light;

  assert.deepEqual(
    { width: sheetWidth, height: sheetHeight },
    { width: light.frameWidth * light.frameCount, height: light.frameHeight },
    `New official PNG is ${sheetWidth}x${sheetHeight}; light attack frame geometry must match`,
  );
});
