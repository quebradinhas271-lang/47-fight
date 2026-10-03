import type { ActionKey } from "./input";

export type KeyboardBindings = Record<ActionKey, string>;
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

const KEYBOARD_KEY = "47-fight.keyboard-controls.v1";
const VIRTUAL_KEY = "47-fight.virtual-controls.v1";
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
