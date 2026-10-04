export type GamepadContext = "capture" | "modal" | "tutorial-ui" | "tutorial" | "combat" | "menu";
export function resolveGamepadContext(f: {
  capture: boolean;
  modal: boolean;
  tutorial: boolean;
  combat: boolean;
  tutorialUi?: boolean;
}): GamepadContext {
  if (f.capture) return "capture";
  if (f.modal) return "modal";
  if (f.tutorial && f.tutorialUi) return "tutorial-ui";
  if (f.tutorial) return "tutorial";
  if (f.combat) return "combat";
  return "menu";
}
export function gamepadCanControlArena(context: GamepadContext, arena: "combat" | "tutorial") {
  return context === arena;
}
