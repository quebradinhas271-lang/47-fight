import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(new URL("../src/game/core/gamepadContext.ts", import.meta.url), "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { resolveGamepadContext, gamepadCanControlArena } =
  await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
test("capture > modal > tutorial > combat > menu", () => {
  const f = { capture: true, modal: true, tutorial: true, combat: true };
  assert.equal(resolveGamepadContext(f), "capture");
  assert.equal(resolveGamepadContext({ ...f, capture: false }), "modal");
  assert.equal(resolveGamepadContext({ ...f, capture: false, modal: false }), "tutorial");
  assert.equal(resolveGamepadContext({ ...f, capture: false, modal: false, tutorialUi: true }), "tutorial-ui");
  assert.equal(resolveGamepadContext({ ...f, capture: false, modal: false, tutorial: false }), "combat");
  assert.equal(resolveGamepadContext({ capture: false, modal: false, tutorial: false, combat: false }), "menu");
});
test("arena controls cannot leak into capture, modal, menu, or tutorial UI", () => {
  for (const ctx of ["capture", "modal", "menu", "tutorial-ui"]) {
    assert.equal(gamepadCanControlArena(ctx, "combat"), false);
    assert.equal(gamepadCanControlArena(ctx, "tutorial"), false);
  }
  assert.equal(gamepadCanControlArena("combat", "combat"), true);
  assert.equal(gamepadCanControlArena("tutorial", "tutorial"), true);
  assert.equal(gamepadCanControlArena("tutorial", "combat"), false);
  assert.equal(gamepadCanControlArena("combat", "tutorial"), false);
});
