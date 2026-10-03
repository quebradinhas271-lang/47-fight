import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const GAMEPAD_FRAME_EVENT = "47-fight:gamepad-frame";

function visible(element: HTMLElement) {
  return (
    !element.hasAttribute("disabled") &&
    element.getAttribute("aria-disabled") !== "true" &&
    element.getClientRects().length > 0
  );
}

function focusables() {
  const dialogs = [
    ...document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]'),
  ].filter(visible);
  const root = dialogs.at(-1) ?? document.body;
  return [
    ...root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter(visible);
}

export function GlobalGameControls() {
  const [fullscreen, setFullscreen] = useState(false);
  const [message, setMessage] = useState("");
  const previous = useRef<boolean[]>([]);
  const direction = useRef(0);
  const repeatedAt = useRef(0);

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
        window.dispatchEvent(
          new CustomEvent(GAMEPAD_FRAME_EVENT, {
            detail: { pad, pressed, previous: previous.current },
          }),
        );
        const inFight = Boolean(
          document.querySelector(".ac-fight-screen:not(.ac-tutorial-screen)"),
        );
        const modal = Boolean(
          document.querySelector(
            '[role="dialog"][aria-modal="true"], .ac-fight-screen .ac-overlay',
          ),
        );
        const capturing = Boolean(document.querySelector('[data-gamepad-capturing="true"]'));
        if ((!inFight || modal) && !capturing) {
          const x = pad.axes[0] ?? 0;
          const y = pad.axes[1] ?? 0;
          const nextDirection =
            pressed[12] || y < -0.55
              ? -1
              : pressed[13] || y > 0.55
                ? 1
                : pressed[14] || x < -0.55
                  ? -1
                  : pressed[15] || x > 0.55
                    ? 1
                    : 0;
          if (
            nextDirection &&
            (nextDirection !== direction.current || now - repeatedAt.current > 260)
          ) {
            const items = focusables();
            if (items.length) {
              const current = items.indexOf(document.activeElement as HTMLElement);
              items[(current + nextDirection + items.length) % items.length]?.focus();
              repeatedAt.current = now;
            }
          }
          direction.current = nextDirection;
          if (pressed[0] && !previous.current[0]) {
            const items = focusables();
            const target = items.includes(document.activeElement as HTMLElement)
              ? (document.activeElement as HTMLElement)
              : items[0];
            target?.focus();
            target?.click();
          }
          if (pressed[1] && !previous.current[1]) {
            const items = focusables();
            const back = items.find((item) =>
              /voltar|fechar|sair|cancelar|pular/i.test(
                `${item.textContent} ${item.getAttribute("aria-label")}`,
              ),
            );
            if (back) back.click();
            else
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape" }));
          }
        }
        previous.current = pressed;
      } else previous.current = [];
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
