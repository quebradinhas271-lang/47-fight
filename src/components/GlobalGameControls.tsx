import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { loadGamepadBindings } from "../game/core/controlSettings";
import { resolveGamepadContext, type GamepadContext } from "../game/core/gamepadContext";

export const GAMEPAD_FRAME_EVENT = "47-fight:gamepad-frame";

function visible(element: HTMLElement) {
  return (
    !element.closest('[inert], [aria-hidden="true"]') &&
    !element.hasAttribute("disabled") &&
    element.getAttribute("aria-disabled") !== "true" &&
    element.getClientRects().length > 0
  );
}

function focusables(context: GamepadContext) {
  const dialog = [...document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')]
    .filter(visible)
    .at(-1);
  const root = dialog ?? document.querySelector<HTMLElement>("main") ?? document.body;
  const selector =
    context === "tutorial-ui" && !dialog
      ? ".ac-tutorial-finish button, .ac-tutorial-actions button, .ac-tutorial-methods button, .ac-tutorial-guide button"
      : 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let items = [...root.querySelectorAll<HTMLElement>(selector)].filter(visible);
  if (dialog) {
    const audio = dialog.querySelector<HTMLElement>(".ac-setting-row");
    if (audio && visible(audio)) items = [audio, ...items.filter((item) => item !== audio)];
  } else {
    items = items.filter((item) => !item.classList.contains("ac-fullscreen-button"));
    const fullscreen = document.querySelector<HTMLElement>(".ac-fullscreen-button");
    if (fullscreen && visible(fullscreen)) items.push(fullscreen);
  }
  return items;
}

export function GlobalGameControls() {
  const [fullscreen, setFullscreen] = useState(false);
  const [message, setMessage] = useState("");
  const previous = useRef<boolean[]>([]);
  const direction = useRef(0);
  const repeatedAt = useRef(0);
  const rootRef = useRef<HTMLElement | null>(null);
  const focusBeforeModal = useRef<HTMLElement | null>(null);
  const tutorialUi = useRef(false);

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    const failed = () => setMessage("Tela cheia indisponível neste navegador.");
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("fullscreenerror", failed);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("fullscreenerror", failed);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const poll = (now: number) => {
      const pad = [...(navigator.getGamepads?.() ?? [])].find((item): item is Gamepad =>
        Boolean(item?.connected),
      );
      if (pad) {
        const pressed = pad.buttons.map((button) => button.pressed);
        const old = previous.current;
        const edge = (index: number) => Boolean(pressed[index] && !old[index]);
        const tutorial = Boolean(document.querySelector(".ac-tutorial-screen"));
        if (!tutorial) tutorialUi.current = false;
        const flags = {
          capture: Boolean(document.querySelector('[data-gamepad-capturing="true"]')),
          modal: Boolean(document.querySelector('[role="dialog"][aria-modal="true"]')),
          tutorial,
          tutorialUi: tutorialUi.current,
          combat: Boolean(document.querySelector(".ac-fight-screen:not(.ac-tutorial-screen)")),
        };
        const pauseButton = loadGamepadBindings().pause;
        if (tutorial && !flags.modal && !flags.capture && edge(pauseButton)) {
          tutorialUi.current = !tutorialUi.current;
          flags.tutorialUi = tutorialUi.current;
          direction.current = 0;
        }
        const context = resolveGamepadContext(flags);
        // A single reader publishes exactly one context-tagged frame to the arena controllers.
        window.dispatchEvent(
          new CustomEvent(GAMEPAD_FRAME_EVENT, {
            detail: { pad, pressed, previous: old, context },
          }),
        );
        if (context === "menu" || context === "modal" || context === "tutorial-ui") {
          const dialog = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
          const root = dialog ?? document.querySelector<HTMLElement>("main") ?? document.body;
          const items = focusables(context);
          if (rootRef.current !== root) {
            if (dialog) focusBeforeModal.current = document.activeElement as HTMLElement;
            else if (rootRef.current?.getAttribute("role") === "dialog") {
              if (focusBeforeModal.current?.isConnected) focusBeforeModal.current.focus();
              focusBeforeModal.current = null;
            }
            rootRef.current = root;
            direction.current = 0;
            if (!items.includes(document.activeElement as HTMLElement)) items[0]?.focus();
          }
          const x = pad.axes[0] ?? 0;
          const y = pad.axes[1] ?? 0;
          const next =
            pressed[12] || y < -0.55 || pressed[14] || x < -0.55
              ? -1
              : pressed[13] || y > 0.55 || pressed[15] || x > 0.55
                ? 1
                : 0;
          if (next && (next !== direction.current || now - repeatedAt.current > 260)) {
            const current = items.indexOf(document.activeElement as HTMLElement);
            if (items.length)
              items[current < 0 ? 0 : (current + next + items.length) % items.length]?.focus();
            repeatedAt.current = now;
          }
          direction.current = next;
          if (edge(0)) {
            const target = items.includes(document.activeElement as HTMLElement)
              ? (document.activeElement as HTMLElement)
              : items[0];
            target?.focus();
            target?.click();
          }
          if (context === "modal" && pauseButton !== 0 && edge(pauseButton)) {
            (
              items.find((item) => item.matches('.ac-btn[data-variant="solid"]')) ?? items[0]
            )?.click();
          } else if (edge(1)) {
            const back = items.find((item) =>
              /voltar|fechar|sair|cancelar|pular/i.test(
                `${item.textContent} ${item.getAttribute("aria-label")}`,
              ),
            );
            if (back) back.click();
            else
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape" }));
          }
        } else rootRef.current = null;
        previous.current = pressed;
      } else {
        previous.current = [];
        direction.current = 0;
        rootRef.current = null;
      }
      frame = requestAnimationFrame(poll);
    };
    frame = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggle = async () => {
    setMessage("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        try {
          await screen.orientation?.lock?.("landscape");
        } catch {
          /* optional capability */
        }
      } else setMessage("Use a opção de tela cheia do navegador.");
    } catch {
      setMessage("Não foi possível ativar a tela cheia.");
    }
  };

  return (
    <>
      <button
        className="ac-fullscreen-button"
        onClick={toggle}
        aria-label={fullscreen ? "Sair da tela cheia" : "Expandir para tela cheia"}
      >
        {fullscreen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
      </button>
      {message && (
        <div className="ac-fullscreen-message" role="status">
          {message}
        </div>
      )}
    </>
  );
}
