import { ArrowLeft, Check, Gauge } from "lucide-react";
import type { Difficulty } from "../game/config/combat";
import { sfx } from "../game/audio";
import { GameLogo } from "./GameLogo";

const DIFFICULTIES: ReadonlyArray<{
  id: Difficulty;
  label: string;
  description: string;
  threat: number;
}> = [
  {
    id: "facil",
    label: "Fácil",
    description: "Para aprender os golpes e dominar a arena.",
    threat: 1,
  },
  {
    id: "normal",
    label: "Normal",
    description: "Um confronto equilibrado para todo lutador.",
    threat: 2,
  },
  {
    id: "dificil",
    label: "Difícil",
    description: "A IA não perdoa. Recomendado para veteranos.",
    threat: 3,
  },
];

type DifficultySelectionProps = {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
  onConfirm: () => void;
  onBack: () => void;
};

export function DifficultySelection({
  selected,
  onSelect,
  onConfirm,
  onBack,
}: DifficultySelectionProps) {
  return (
    <main className="ac-screen ac-shell ac-difficulty-screen">
      <div className="ac-grid" aria-hidden="true" />
      <header className="ac-topbar">
        <GameLogo variant="header" />
        <span className="ac-difficulty-kicker">
          <Gauge aria-hidden="true" /> Configuração da IA
        </span>
      </header>

      <section
        className="ac-setup ac-difficulty-setup ac-fade-in"
        aria-labelledby="difficulty-title"
      >
        <header className="ac-step-title">
          <span>01</span>
          <div>
            <h1 id="difficulty-title">Selecione a dificuldade</h1>
            <p>Escolha o nível de desafio do seu adversário</p>
          </div>
        </header>

        <div
          className="ac-difficulties"
          role="radiogroup"
          aria-label="Nível da inteligência artificial"
        >
          {DIFFICULTIES.map((option) => (
            <button
              key={option.id}
              type="button"
              className="ac-difficulty"
              data-selected={selected === option.id}
              role="radio"
              aria-checked={selected === option.id}
              onClick={() => {
                onSelect(option.id);
                sfx.play("click");
              }}
            >
              <span className="ac-threat" aria-label={`Nível de ameaça ${option.threat} de 3`}>
                {[1, 2, 3].map((level) => (
                  <i key={level} data-on={level <= option.threat} />
                ))}
              </span>
              <b>{option.label}</b>
              <small>{option.description}</small>
              {selected === option.id && (
                <Check className="ac-difficulty-check" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        <div className="ac-actions">
          <button className="ac-btn" data-variant="ghost" onClick={onBack}>
            <ArrowLeft aria-hidden="true" /> Voltar
          </button>
          <button className="ac-btn" data-variant="solid" onClick={onConfirm}>
            Confirmar {DIFFICULTIES.find((item) => item.id === selected)?.label} <span>›</span>
          </button>
        </div>
      </section>
    </main>
  );
}
