import { useEffect, useState } from "react";
import {
  Gamepad2,
  Info,
  Keyboard,
  Play,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { GameLogo } from "./GameLogo";
import { MenuActionButton } from "./MenuActionButton";
import {
  DEFAULT_KEYBOARD_BINDINGS,
  formatKeyCode,
  loadKeyboardBindings,
  loadVirtualControlsPreference,
  saveKeyboardBindings,
  saveVirtualControlsPreference,
  type KeyboardBindings,
  type VirtualControlsPreference,
} from "../game/core/controlSettings";
import type { ActionKey } from "../game/core/input";

type MainMenuProps = {
  sound: boolean;
  onSoundChange: (enabled: boolean) => void;
  onStart: () => void;
};

type Panel = "settings" | "credits" | null;

export function MainMenu({ sound, onSoundChange, onStart }: MainMenuProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const [bindings, setBindings] = useState(loadKeyboardBindings);
  const [virtualControls, setVirtualControls] = useState(loadVirtualControlsPreference);
  const [capturing, setCapturing] = useState<ActionKey | null>(null);
  const [bindingError, setBindingError] = useState("");
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [inputMethod, setInputMethod] = useState("TECLADO / TOQUE");

  useEffect(() => {
    if (!panel) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !capturing) setPanel(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [capturing, panel]);

  useEffect(() => {
    if (!capturing) return;
    const capture = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.code === "Escape") return setCapturing(null);
      if (
        Object.entries(bindings).some(
          ([action, code]) => action !== capturing && code === event.code,
        )
      ) {
        setBindingError("Esta tecla já está atribuída a outro comando.");
        return;
      }
      const next = { ...bindings, [capturing]: event.code } as KeyboardBindings;
      setBindings(next);
      saveKeyboardBindings(next);
      setBindingError("");
      setCapturing(null);
    };
    window.addEventListener("keydown", capture, true);
    return () => window.removeEventListener("keydown", capture, true);
  }, [bindings, capturing]);

  useEffect(() => {
    const updatePads = () => setGamepadConnected(Boolean(navigator.getGamepads?.().some(Boolean)));
    const method = (event: Event) =>
      setInputMethod(String((event as CustomEvent).detail).toUpperCase());
    updatePads();
    window.addEventListener("gamepadconnected", updatePads);
    window.addEventListener("gamepaddisconnected", updatePads);
    window.addEventListener("47-fight:input-method", method);
    return () => {
      window.removeEventListener("gamepadconnected", updatePads);
      window.removeEventListener("gamepaddisconnected", updatePads);
      window.removeEventListener("47-fight:input-method", method);
    };
  }, []);

  const actions: [ActionKey, string][] = [
    ["left", "Mover para esquerda"],
    ["right", "Mover para direita"],
    ["up", "Pular"],
    ["block", "Defender"],
    ["light", "Ataque leve (Soco)"],
    ["heavy", "Ataque pesado (Chute)"],
    ["special", "Especial"],
  ];

  return (
    <main className="ac-cinematic-screen ac-main-menu">
      <div className="ac-cinematic-shade" aria-hidden="true" />
      <section className="ac-cinematic-interface ac-fade-in" aria-labelledby="main-menu-title">
        <header className="ac-cinematic-heading">
          <GameLogo variant="arena" />
          <p id="main-menu-title">Escolha seu caminho</p>
        </header>
        <nav className="ac-cinematic-actions" aria-label="Menu principal">
          <MenuActionButton icon={Play} primary onClick={onStart}>
            Iniciar jogo
          </MenuActionButton>
          <MenuActionButton icon={Settings} onClick={() => setPanel("settings")}>
            Configurações
          </MenuActionButton>
          <MenuActionButton icon={Info} onClick={() => setPanel("credits")}>
            Créditos
          </MenuActionButton>
        </nav>
      </section>

      {panel && (
        <div className="ac-menu-overlay" role="presentation" onMouseDown={() => setPanel(null)}>
          <section
            className="ac-menu-panel ac-rise"
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-panel-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="ac-menu-panel__close"
              onClick={() => setPanel(null)}
              aria-label="Fechar"
            >
              <X aria-hidden="true" />
            </button>
            <GameLogo variant="modal" />
            {panel === "settings" ? (
              <div className="ac-settings-content">
                <p className="ac-kicker">SISTEMA</p>
                <h2 id="menu-panel-title">Configurações</h2>
                <h3>Áudio</h3>
                <button
                  className="ac-setting-row"
                  onClick={() => onSoundChange(!sound)}
                  aria-pressed={sound}
                >
                  {sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
                  <span>
                    <b>Som</b>
                    <small>Efeitos sonoros do jogo</small>
                  </span>
                  <strong>{sound ? "ON" : "OFF"}</strong>
                </button>
                <h3>
                  <Keyboard aria-hidden="true" /> Controles do teclado
                </h3>
                <div className="ac-key-bindings">
                  {actions.map(([action, label]) => (
                    <button
                      key={action}
                      onClick={() => {
                        setBindingError("");
                        setCapturing(action);
                      }}
                    >
                      <span>{label}</span>
                      <kbd>
                        {capturing === action
                          ? "PRESSIONE UMA TECLA"
                          : formatKeyCode(bindings[action])}
                      </kbd>
                    </button>
                  ))}
                </div>
                {capturing && <p className="ac-capture-help">ESC cancela a alteração.</p>}
                {bindingError && (
                  <p className="ac-setting-error" role="alert">
                    {bindingError}
                  </p>
                )}
                <button
                  className="ac-reset-controls"
                  onClick={() => {
                    const defaults = { ...DEFAULT_KEYBOARD_BINDINGS };
                    setBindings(defaults);
                    saveKeyboardBindings(defaults);
                    setCapturing(null);
                    setBindingError("");
                  }}
                >
                  <RotateCcw aria-hidden="true" /> Restaurar controles padrão
                </button>
                <h3>Controles virtuais</h3>
                <div
                  className="ac-choice-group"
                  role="group"
                  aria-label="Exibição dos controles virtuais"
                >
                  {(["auto", "show", "hide"] as VirtualControlsPreference[]).map((value) => (
                    <button
                      key={value}
                      data-selected={virtualControls === value}
                      onClick={() => {
                        setVirtualControls(value);
                        saveVirtualControlsPreference(value);
                      }}
                    >
                      {value === "auto"
                        ? "Automático"
                        : value === "show"
                          ? "Sempre exibir"
                          : "Sempre ocultar"}
                    </button>
                  ))}
                </div>
                <h3>
                  <Gamepad2 aria-hidden="true" /> Gamepad
                </h3>
                <div className="ac-gamepad-status">
                  <span>
                    Controle: <b>{gamepadConnected ? "CONECTADO" : "NÃO DETECTADO"}</b>
                  </span>
                  <span>
                    Método ativo: <b>{inputMethod}</b>
                  </span>
                </div>
              </div>
            ) : (
              <>
                <p className="ac-kicker">47-FIGHT</p>
                <h2 id="menu-panel-title">Créditos</h2>
                <p className="ac-menu-panel__message">
                  Informações da equipe serão apresentadas aqui em uma atualização futura.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
