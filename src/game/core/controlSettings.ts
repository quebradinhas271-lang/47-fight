import type { ActionKey } from "./input";

export type KeyboardBindings = Record<ActionKey, string>;
export type GamepadAction = ActionKey | "pause";
export type GamepadBindings = Record<GamepadAction, number>;
export type VirtualControlsPreference = "auto" | "show" | "hide";

export const DEFAULT_KEYBOARD_BINDINGS: KeyboardBindings = {
  left: "KeyA",
  right: "KeyD",
  up: "KeyW",
  block: "KeyS",
  light: "KeyJ",
  heavy: "KeyK",
  special: "KeyL",
};
export const DEFAULT_GAMEPAD_BINDINGS: GamepadBindings = {
  left: 14,
  right: 15,
  up: 12,
  block: 4,
  light: 0,
  heavy: 1,
  special: 3,
  pause: 9,
};

const KEYBOARD_KEY = "47-fight.keyboard-controls.v1";
const VIRTUAL_KEY = "47-fight.virtual-controls.v1";
const GAMEPAD_KEY = "47-fight.gamepad-controls.v1";
export const CONTROLS_CHANGED_EVENT = "47-fight:controls-changed";

const actions = Object.keys(DEFAULT_KEYBOARD_BINDINGS) as ActionKey[];

export function loadKeyboardBindings(): KeyboardBindings {
  if (typeof window === "undefined") return { ...DEFAULT_KEYBOARD_BINDINGS };
  try {
    const value = JSON.parse(localStorage.getItem(KEYBOARD_KEY) ?? "null") as unknown;
    if (!value || typeof value !== "object") return { ...DEFAULT_KEYBOARD_BINDINGS };
    const entries = actions.map((action) => (value as Record<string, unknown>)[action]);
    if (entries.some((code) => typeof code !== "string" || code === "Escape")) throw new Error();
    if (new Set(entries).size !== entries.length) throw new Error();
    return Object.fromEntries(
      actions.map((action, index) => [action, entries[index]]),
    ) as KeyboardBindings;
  } catch {
    return { ...DEFAULT_KEYBOARD_BINDINGS };
  }
}

export function saveKeyboardBindings(bindings: KeyboardBindings) {
  localStorage.setItem(KEYBOARD_KEY, JSON.stringify(bindings));
  window.dispatchEvent(new CustomEvent(CONTROLS_CHANGED_EVENT));
}

export function loadGamepadBindings(): GamepadBindings {
  if (typeof window === "undefined") return { ...DEFAULT_GAMEPAD_BINDINGS };
  try {
    const value = JSON.parse(localStorage.getItem(GAMEPAD_KEY) ?? "null") as unknown;
    if (!value || typeof value !== "object") throw new Error();
    const keys = Object.keys(DEFAULT_GAMEPAD_BINDINGS) as GamepadAction[];
    const entries = keys.map((key) => (value as Record<string, unknown>)[key]);
    if (entries.some((button) => !Number.isInteger(button) || Number(button) < 0))
      throw new Error();
    if (new Set(entries).size !== entries.length) throw new Error();
    return Object.fromEntries(keys.map((key, index) => [key, entries[index]])) as GamepadBindings;
  } catch {
    return { ...DEFAULT_GAMEPAD_BINDINGS };
  }
}

export function saveGamepadBindings(bindings: GamepadBindings) {
  localStorage.setItem(GAMEPAD_KEY, JSON.stringify(bindings));
  window.dispatchEvent(new CustomEvent(CONTROLS_CHANGED_EVENT));
}

const STANDARD_BUTTON_NAMES = [
  "A / ×",
  "B / ○",
  "X / □",
  "Y / △",
  "L1",
  "R1",
  "L2",
  "R2",
  "SELECT",
  "START / OPTIONS",
  "L3",
  "R3",
  "D-PAD ↑",
  "D-PAD ↓",
  "D-PAD ←",
  "D-PAD →",
  "HOME",
];
export function formatGamepadButton(index: number) {
  return STANDARD_BUTTON_NAMES[index] ?? `BOTÃO ${index + 1}`;
}

export function loadVirtualControlsPreference(): VirtualControlsPreference {
  if (typeof window === "undefined") return "auto";
  const value = localStorage.getItem(VIRTUAL_KEY);
  return value === "show" || value === "hide" ? value : "auto";
}

export function saveVirtualControlsPreference(value: VirtualControlsPreference) {
  localStorage.setItem(VIRTUAL_KEY, value);
  window.dispatchEvent(new CustomEvent(CONTROLS_CHANGED_EVENT));
}

export function formatKeyCode(code: string) {
  return code
    .replace(/^Key/, "")
    .replace(/^Digit/, "")
    .replace("Arrow", "SETA ")
    .toUpperCase();
}
