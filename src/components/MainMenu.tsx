import { useEffect, useState } from "react";
import { Info, Play, Settings, Volume2, VolumeX, X } from "lucide-react";
import { GameLogo } from "./GameLogo";
import { MenuActionButton } from "./MenuActionButton";

type MainMenuProps = {
  sound: boolean;
  onSoundChange: (enabled: boolean) => void;
  onStart: () => void;
};

type Panel = "settings" | "credits" | null;

export function MainMenu({ sound, onSoundChange, onStart }: MainMenuProps) {
  const [panel, setPanel] = useState<Panel>(null);

  useEffect(() => {
    if (!panel) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [panel]);

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
              <>
                <p className="ac-kicker">SISTEMA</p>
                <h2 id="menu-panel-title">Configurações</h2>
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
              </>
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
