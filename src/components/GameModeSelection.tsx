import { useState } from "react";
import { ArrowLeft, Bot, Dumbbell, Users } from "lucide-react";
import { GameLogo } from "./GameLogo";
import { MenuActionButton } from "./MenuActionButton";

type ModeId = "local" | "multiplayer" | "training";

const MODES = [
  { id: "local", label: "Contra IA", image: "/assets/ui/game-mode-selection/local.png" },
  {
    id: "multiplayer",
    label: "Multiplayer",
    image: "/assets/ui/game-mode-selection/multiplayer.png",
  },
  { id: "training", label: "Treino", image: "/assets/ui/game-mode-selection/treino.png" },
] as const;

type GameModeSelectionProps = {
  onLocal: () => void;
  onBack: () => void;
};

export function GameModeSelection({ onLocal, onBack }: GameModeSelectionProps) {
  const [highlighted, setHighlighted] = useState<ModeId>("local");

  return (
    <main className="ac-cinematic-screen ac-mode-screen">
      <div className="ac-mode-backgrounds" aria-hidden="true">
        {MODES.map((mode) => (
          <div
            key={mode.id}
            className="ac-mode-background"
            data-active={highlighted === mode.id}
            style={{ backgroundImage: `url(${mode.image})` }}
          />
        ))}
      </div>
      <div className="ac-cinematic-shade" aria-hidden="true" />
      <section className="ac-cinematic-interface ac-fade-in" aria-labelledby="mode-title">
        <header className="ac-cinematic-heading">
          <GameLogo variant="arena" />
          <p id="mode-title">Escolha o modo</p>
        </header>
        <div className="ac-cinematic-actions" aria-label="Modos de jogo">
          <MenuActionButton
            icon={Bot}
            primary
            selected={highlighted === "local"}
            onHighlight={() => setHighlighted("local")}
            onClick={onLocal}
          >
            Contra IA
          </MenuActionButton>
          <MenuActionButton
            icon={Users}
            detail="Em desenvolvimento"
            selected={highlighted === "multiplayer"}
            onHighlight={() => setHighlighted("multiplayer")}
            onClick={() => setHighlighted("multiplayer")}
          >
            Multiplayer
          </MenuActionButton>
          <MenuActionButton
            icon={Dumbbell}
            detail="Em breve"
            selected={highlighted === "training"}
            onHighlight={() => setHighlighted("training")}
            onClick={() => setHighlighted("training")}
          >
            Treino
          </MenuActionButton>
        </div>
        <button className="ac-cinematic-back" onClick={onBack}>
          <ArrowLeft aria-hidden="true" /> Voltar
        </button>
      </section>
    </main>
  );
}
