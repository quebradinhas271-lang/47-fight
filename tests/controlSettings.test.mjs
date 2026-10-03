import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(
  new URL("../src/game/core/controlSettings.ts", import.meta.url),
  "utf8",
);
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { DEFAULT_GAMEPAD_BINDINGS, formatGamepadButton, loadGamepadBindings, saveGamepadBindings } =
  await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

const values = new Map();
Object.assign(globalThis, {
  localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  },
  window: { dispatchEvent: () => true },
  CustomEvent: class CustomEvent {
    constructor(type) {}
  },
});

test("uses independent defaults when saved data is absent or corrupt", () => {
  values.clear();
  assert.deepEqual(loadGamepadBindings(), DEFAULT_GAMEPAD_BINDINGS);
  values.set("47-fight.gamepad-controls.v1", '{"left":14}');
  assert.deepEqual(loadGamepadBindings(), DEFAULT_GAMEPAD_BINDINGS);
});

test("persists a valid, conflict-free gamepad mapping", () => {
  const custom = { ...DEFAULT_GAMEPAD_BINDINGS, light: 8, pause: 9 };
  saveGamepadBindings(custom);
  assert.deepEqual(loadGamepadBindings(), custom);
});

test("rejects duplicate and invalid button indexes", () => {
  values.set(
    "47-fight.gamepad-controls.v1",
    JSON.stringify({ ...DEFAULT_GAMEPAD_BINDINGS, light: 1 }),
  );
  assert.deepEqual(loadGamepadBindings(), DEFAULT_GAMEPAD_BINDINGS);
  values.set(
    "47-fight.gamepad-controls.v1",
    JSON.stringify({ ...DEFAULT_GAMEPAD_BINDINGS, light: -1 }),
  );
  assert.deepEqual(loadGamepadBindings(), DEFAULT_GAMEPAD_BINDINGS);
});

test("labels standard and fallback buttons safely", () => {
  assert.equal(formatGamepadButton(0), "A / ×");
  assert.equal(formatGamepadButton(24), "BOTÃO 25");
});
