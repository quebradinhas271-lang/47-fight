import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import ts from "typescript";

const asset = (name) => readFile(new URL(`../public/assets/fighters/${name}`, import.meta.url));
const source = await readFile(new URL("../src/game/config/sprites.ts", import.meta.url), "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { FIGHTER_SPRITES } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);
const { idle, light } = FIGHTER_SPRITES.dictador.animations;
const png = await asset("el-dictador-light-attack.png");

/** Reads 8-bit RGBA PNG alpha without adding runtime dependencies to the game. */
function alphaBounds(buffer, frameWidth, frameCount) {
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  assert.equal(buffer[24], 8, "sprite PNG must use 8-bit samples");
  assert.equal(buffer[25], 6, "sprite PNG must be RGBA");
  assert.equal(width, frameWidth * frameCount);

  const idats = [];
  let at = 8;
  while (at < buffer.length) {
    const size = buffer.readUInt32BE(at);
    const kind = buffer.toString("ascii", at + 4, at + 8);
    if (kind === "IDAT") idats.push(buffer.subarray(at + 8, at + 8 + size));
    at += size + 12;
    if (kind === "IEND") break;
  }
  const raw = inflateSync(Buffer.concat(idats));
  const stride = width * 4;
  const restored = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const input = y * (stride + 1);
    const output = y * stride;
    const filter = raw[input];
    for (let x = 0; x < stride; x += 1) {
      const left = x >= 4 ? restored[output + x - 4] : 0;
      const above = y ? restored[output - stride + x] : 0;
      const upperLeft = y && x >= 4 ? restored[output - stride + x - 4] : 0;
      const p = left + above - upperLeft;
      const pa = Math.abs(p - left);
      const pb = Math.abs(p - above);
      const pc = Math.abs(p - upperLeft);
      const paeth = pa <= pb && pa <= pc ? left : pb <= pc ? above : upperLeft;
      const predictor = [0, left, above, (left + above) >> 1, paeth][filter];
      assert.notEqual(predictor, undefined, "unsupported PNG row filter");
      restored[output + x] = (raw[input + 1 + x] + predictor) & 255;
    }
  }

  return Array.from({ length: frameCount }, (_, frame) => {
    let minX = frameWidth;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < frameWidth; x += 1) {
        if (restored[(y * width + frame * frameWidth + x) * 4 + 3] < 32) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    assert.ok(maxX >= 0, `frame ${frame} must not be transparent`);
    return {
      frame,
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      bottomMargin: height - 1 - maxY,
    };
  });
}

test("El Dictador official light attack PNG matches the configured sprite frames", () => {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(png.subarray(0, 8).equals(signature), "official light attack must be a PNG");
  const sheetWidth = png.readUInt32BE(16);
  const sheetHeight = png.readUInt32BE(20);
  assert.deepEqual(
    { width: sheetWidth, height: sheetHeight },
    { width: light.frameWidth * light.frameCount, height: light.frameHeight },
    `New official PNG is ${sheetWidth}x${sheetHeight}; light attack frame geometry must match`,
  );
});

test("All six light punch frames exist, with measurable visual baseline", async () => {
  const idleFrames = alphaBounds(
    await asset("el-dictador-idle-sheet.png"),
    idle.frameWidth,
    idle.frameCount,
  );
  const attackFrames = alphaBounds(png, light.frameWidth, light.frameCount);
  console.log("Official Dictador IDLE alpha bounds:", JSON.stringify(idleFrames));
  console.log("Official Dictador LIGHT alpha bounds:", JSON.stringify(attackFrames));
  assert.equal(attackFrames.length, 6);

  const idleGuard = idleFrames[0];
  const attackGuard = attackFrames[0];
  assert.ok(
    Math.abs(idleGuard.width * idle.scale - attackGuard.width * light.scaleX) < 6,
    "first punch frame must match idle guard width",
  );
  const idleHeight = idleGuard.height * idle.scale;
  const idleFeet = idle.offsetY - idleGuard.bottomMargin * idle.scale;
  for (const frame of attackFrames) {
    assert.ok(
      Math.abs(idleHeight - frame.height * light.scaleY) < 7,
      `punch frame ${frame.frame} must preserve idle body height`,
    );
    const attackFeet = light.offsetY - frame.bottomMargin * light.scaleY;
    assert.ok(
      Math.abs(idleFeet - attackFeet) < 3,
      `punch frame ${frame.frame} must keep the boots on the same floor line`,
    );
  }
  assert.ok(
    attackFrames[3].width > attackGuard.width,
    "extended punch must be wider than its initial guard pose",
  );
});
