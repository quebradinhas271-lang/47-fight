import { EMPTY_INPUT, type InputState } from "./types";

export type ActionKey = "left" | "right" | "up" | "block" | "light" | "heavy" | "special";

/**
 * Fonte de comandos local (teclado + toque).
 * Ataques são consumidos por pressão (não repetem enquanto segurados),
 * movimentação e defesa funcionam enquanto mantidos.
 */
export class LocalInput {
  private held: Record<ActionKey, boolean> = {
    left: false,
    right: false,
    up: false,
    block: false,
    light: false,
    heavy: false,
    special: false,
  };
  private pending = { light: false, heavy: false, special: false };
  private keyMap: Record<string, ActionKey> = {
    KeyA: "left",
    ArrowLeft: "left",
    KeyD: "right",
    ArrowRight: "right",
    KeyW: "up",
    ArrowUp: "up",
    Space: "up",
    KeyS: "block",
    ArrowDown: "block",
    KeyJ: "light",
    KeyK: "heavy",
    KeyL: "special",
  };
  private enabled = true;

  private onKeyDown = (e: KeyboardEvent) => {
    const action = this.keyMap[e.code];
    if (!action) return;
    e.preventDefault();
    if (e.repeat) return;
    this.press(action);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const action = this.keyMap[e.code];
    if (!action) return;
    e.preventDefault();
    this.release(action);
  };

  attachKeyboard() {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp, { passive: false });
  }

  detach() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.resetAll();
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (!v) this.resetAll();
  }

  press(action: ActionKey) {
    if (!this.enabled) return;
    this.held[action] = true;
    if (action === "light" || action === "heavy" || action === "special") {
      this.pending[action] = true;
    }
  }

  release(action: ActionKey) {
    this.held[action] = false;
  }

  resetAll() {
    (Object.keys(this.held) as ActionKey[]).forEach((k) => (this.held[k] = false));
    this.pending = { light: false, heavy: false, special: false };
  }

  /** consome o estado para um passo de simulação */
  sample(): InputState {
    if (!this.enabled) return { ...EMPTY_INPUT };
    const s: InputState = {
      left: this.held.left,
      right: this.held.right,
      up: this.held.up,
      block: this.held.block,
      light: this.pending.light,
      heavy: this.pending.heavy,
      special: this.pending.special,
    };
    this.pending.light = false;
    this.pending.heavy = false;
    this.pending.special = false;
    return s;
  }
}
