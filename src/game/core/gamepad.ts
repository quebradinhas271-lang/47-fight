import type { ActionKey, LocalInput } from "./input";
import { DEFAULT_GAMEPAD_BINDINGS, loadGamepadBindings } from "./controlSettings";
import { GAMEPAD_FRAME_EVENT } from "../../components/GlobalGameControls";
import { gamepadCanControlArena, type GamepadContext } from "./gamepadContext";

const DEADZONE = 0.22;

export class GamepadController {
  private pressed = new Set<ActionKey>();
  private startPressed = false;
  private awaitingNeutral = false;
  private activeIndex: number | null = null;

  constructor(
    private input: LocalInput,
    private onActivity: () => void,
    private onPause: () => void,
    private arena: "combat" | "tutorial" = "combat",
  ) {}

  start() {
    if (!("getGamepads" in navigator)) return;
    window.addEventListener("gamepaddisconnected", this.disconnect);
    window.addEventListener(GAMEPAD_FRAME_EVENT, this.onFrame);
  }

  stop() {
    window.removeEventListener("gamepaddisconnected", this.disconnect);
    window.removeEventListener(GAMEPAD_FRAME_EVENT, this.onFrame);
    this.releaseAll();
  }

  private disconnect = (event: GamepadEvent) => {
    if (this.activeIndex === event.gamepad.index) {
      this.releaseAll();
      this.activeIndex = null;
      window.dispatchEvent(new CustomEvent("47-fight:gamepad-status", { detail: false }));
    }
  };

  private releaseAll() {
    this.input.releaseSource("gamepad:");
    this.pressed.clear();
    this.startPressed = false;
  }

  private onFrame = (event: Event) => {
    const { pad, context } = (event as CustomEvent<{ pad: Gamepad; context: GamepadContext }>).detail;
    if (!gamepadCanControlArena(context, this.arena)) {
      this.releaseAll(); // Also clears pending gamepad actions in LocalInput.
      this.awaitingNeutral = true;
      return;
    }
    // A held A/START from confirming a modal cannot become a strike/pause on resume.
    if (this.awaitingNeutral) {
      const buttonsNeutral = !pad.buttons.some(button => button.pressed);
      const stickNeutral = Math.abs(pad.axes[0] ?? 0) < DEADZONE &&
        Math.abs(pad.axes[1] ?? 0) < DEADZONE;
      if (!buttonsNeutral || !stickNeutral) return;
      this.awaitingNeutral = false;
      return;
    }
    this.read(pad);
  };

  private read(pad: Gamepad) {
    const axisX = pad.axes[0] ?? 0;
    const axisY = pad.axes[1] ?? 0;
    const button = (index: number) => Boolean(pad.buttons[index]?.pressed);
    const bindings = loadGamepadBindings();
    const states: Record<ActionKey, boolean> = {
      left: axisX < -DEADZONE || button(bindings.left),
      right: axisX > DEADZONE || button(bindings.right),
      up: axisY < -0.55 || button(bindings.up),
      light: button(bindings.light),
      heavy: button(bindings.heavy),
      special: button(bindings.special),
      block:
        button(bindings.block) ||
        (bindings.block === DEFAULT_GAMEPAD_BINDINGS.block &&
          (button(5) || button(6) || button(7))),
    };
    const start = button(bindings.pause);
    const hasActivity = Object.values(states).some(Boolean) || start;
    if (hasActivity && this.activeIndex !== pad.index) {
      this.activeIndex = pad.index;
      window.dispatchEvent(new CustomEvent("47-fight:gamepad-status", { detail: true }));
    }
    if (hasActivity) this.onActivity();
    for (const [action, active] of Object.entries(states) as [ActionKey, boolean][]) {
      if (active && !this.pressed.has(action)) this.input.press(action, `gamepad:${action}`);
      if (!active && this.pressed.has(action)) this.input.release(action, `gamepad:${action}`);
      if (active) this.pressed.add(action);
      else this.pressed.delete(action);
    }
    if (start && !this.startPressed) this.onPause();
    this.startPressed = start;
  }
}
