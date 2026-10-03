import { EMPTY_INPUT, type InputState } from "./types";
import {
  CONTROLS_CHANGED_EVENT,
  loadKeyboardBindings,
  type KeyboardBindings,
} from "./controlSettings";

export type ActionKey = "left" | "right" | "up" | "block" | "light" | "heavy" | "special";

/**
 * Fonte de comandos local (teclado + toque).
 * Ataques são consumidos por pressão (não repetem enquanto segurados),
 * movimentação e defesa funcionam enquanto mantidos.
 */
export class LocalInput {
  private held = new Map<ActionKey, Set<string>>();
  private pending = { light: false, heavy: false, special: false };
  private keyMap: Record<string, ActionKey> = {};
  private enabled = true;

  private onKeyDown = (e: KeyboardEvent) => {
    const action = this.keyMap[e.code];
    if (!action) return;
    e.preventDefault();
    if (e.repeat) return;
    window.dispatchEvent(new CustomEvent("47-fight:input-method", { detail: "keyboard" }));
    this.press(action, `keyboard:${e.code}`);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const action = this.keyMap[e.code];
    if (!action) return;
    e.preventDefault();
    this.release(action, `keyboard:${e.code}`);
  };

  private onBindingsChanged = () => this.configureKeyboard(loadKeyboardBindings());

  private configureKeyboard(bindings: KeyboardBindings) {
    const map = Object.fromEntries(
      Object.entries(bindings).map(([action, code]) => [code, action]),
    );
    const aliases: Record<string, ActionKey> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      Space: "up",
      ArrowDown: "block",
    };
    for (const [code, action] of Object.entries(aliases)) if (!map[code]) map[code] = action;
    this.keyMap = map as Record<string, ActionKey>;
  }

  attachKeyboard() {
    this.configureKeyboard(loadKeyboardBindings());
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp, { passive: false });
    window.addEventListener(CONTROLS_CHANGED_EVENT, this.onBindingsChanged);
  }

  detach() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener(CONTROLS_CHANGED_EVENT, this.onBindingsChanged);
    this.resetAll();
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (!v) this.resetAll();
  }

  press(action: ActionKey, source = "touch") {
    if (!this.enabled) return;
    const sources = this.held.get(action) ?? new Set<string>();
    const newlyPressed = !sources.has(source);
    sources.add(source);
    this.held.set(action, sources);
    if (newlyPressed && (action === "light" || action === "heavy" || action === "special")) {
      this.pending[action] = true;
    }
  }

  release(action: ActionKey, source = "touch") {
    this.held.get(action)?.delete(source);
  }

  releaseSource(prefix: string) {
    for (const sources of this.held.values()) {
      for (const source of sources) if (source.startsWith(prefix)) sources.delete(source);
    }
  }

  resetAll() {
    this.held.clear();
    this.pending = { light: false, heavy: false, special: false };
  }

  /** consome o estado para um passo de simulação */
  sample(): InputState {
    if (!this.enabled) return { ...EMPTY_INPUT };
    const s: InputState = {
      left: Boolean(this.held.get("left")?.size),
      right: Boolean(this.held.get("right")?.size),
      up: Boolean(this.held.get("up")?.size),
      block: Boolean(this.held.get("block")?.size),
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
