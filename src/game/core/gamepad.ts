import type { ActionKey, LocalInput } from "./input";

const DEADZONE = 0.22;

export class GamepadController {
  private frame = 0;
  private pressed = new Set<ActionKey>();
  private startPressed = false;
  private activeIndex: number | null = null;

  constructor(
    private input: LocalInput,
    private onActivity: () => void,
    private onPause: () => void,
  ) {}

  start() {
    if (!("getGamepads" in navigator)) return;
    window.addEventListener("gamepaddisconnected", this.disconnect);
    this.poll();
  }

  stop() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener("gamepaddisconnected", this.disconnect);
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

  private poll = () => {
    const pads = navigator.getGamepads?.() ?? [];
    const pad = Array.from(pads).find((item): item is Gamepad => Boolean(item?.connected));
    if (pad) this.read(pad);
    else if (this.activeIndex !== null)
      this.disconnect({ gamepad: { index: this.activeIndex } } as GamepadEvent);
    this.frame = requestAnimationFrame(this.poll);
  };

  private read(pad: Gamepad) {
    const axisX = pad.axes[0] ?? 0;
    const axisY = pad.axes[1] ?? 0;
    const button = (index: number) => Boolean(pad.buttons[index]?.pressed);
    const states: Record<ActionKey, boolean> = {
      left: axisX < -DEADZONE || button(14),
      right: axisX > DEADZONE || button(15),
      up: axisY < -0.55 || button(12),
      light: button(0),
      heavy: button(1),
      special: button(3),
      block: button(4) || button(5) || button(6) || button(7),
    };
    const start = button(9);
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
