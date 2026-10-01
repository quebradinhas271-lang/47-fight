import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { FIGHTERS, FIGHTER_LIST, type FighterId } from "../game/config/fighters";
import type { Difficulty } from "../game/config/combat";
import { FIGHTER_SPRITES } from "../game/config/sprites";
import { GameBus } from "../game/core/bus";
import { LocalInput, type ActionKey } from "../game/core/input";
import type { MatchSnapshot } from "../game/core/types";
import { sfx } from "../game/audio";

export const Route = createFileRoute("/")({ component: FightApp });

type Screen = "menu" | "fighter" | "difficulty" | "fight";

const DIFFICULTIES: { id: Difficulty; name: string; detail: string }[] = [
  { id: "facil", name: "Fácil", detail: "IA mais paciente e menos agressiva" },
  { id: "normal", name: "Normal", detail: "O equilíbrio ideal para começar" },
  { id: "dificil", name: "Difícil", detail: "Reações rápidas e pressão máxima" },
];

function FightApp() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [fighter, setFighter] = useState<FighterId>("dictador");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [sound, setSound] = useState(true);

  const navigate = (next: Screen, back = false) => {
    sfx.play(back ? "back" : "click");
    setScreen(next);
  };

  if (screen === "fight") {
    return (
      <FightScreen
        fighter={fighter}
        difficulty={difficulty}
        sound={sound}
        onMenu={() => navigate("menu", true)}
      />
    );
  }

  return (
    <main className="ac-screen ac-shell">
      <div className="ac-grid" aria-hidden="true" />
      <header className="ac-topbar">
        <Logo compact={screen !== "menu"} />
        <button
          className="ac-icon-btn"
          onClick={() => {
            const next = !sound;
            setSound(next);
            sfx.setEnabled(next);
            if (next) sfx.play("click");
          }}
          aria-label={sound ? "Desativar som" : "Ativar som"}
        >
          {sound ? "SOM ON" : "SOM OFF"}
        </button>
      </header>

      {screen === "menu" && (
        <section className="ac-hero ac-fade-in">
          <div className="ac-hero-copy">
            <p className="ac-kicker">PROTOCOLO DE COMBATE // 2047</p>
            <Logo />
            <p className="ac-tagline">Entre na arena. Domine o combate.</p>
          </div>
          <div className="ac-menu ac-rise">
            <button className="ac-btn" data-variant="solid" onClick={() => navigate("fighter")}>
              Jogar contra IA <span>›</span>
            </button>
            <button className="ac-btn" disabled>
              Multiplayer <span className="ac-chip">Em desenvolvimento</span>
            </button>
            <div className="ac-controls-hint">
              <b>TECLADO</b> A/D mover · W pular · S defender · J/K/L atacar
            </div>
          </div>
        </section>
      )}

      {screen === "fighter" && (
        <section className="ac-setup ac-fade-in">
          <StepTitle
            step="01"
            title="Escolha seu lutador"
            subtitle="Cada estilo exige uma estratégia"
          />
          <div className="ac-roster">
            {FIGHTER_LIST.map((item) => (
              <button
                key={item.id}
                className="ac-fighter-card"
                data-selected={fighter === item.id}
                style={
                  {
                    "--fighter": item.cssColor,
                    "--fighter-accent": item.cssAccent,
                  } as CSSProperties
                }
                onClick={() => {
                  setFighter(item.id);
                  sfx.play("click");
                }}
              >
                <span className="ac-fighter-number">0{FIGHTER_LIST.indexOf(item) + 1}</span>
                <span className="ac-fighter-silhouette">
                  {FIGHTER_SPRITES[item.id].portrait ? (
                    <img src={FIGHTER_SPRITES[item.id].portrait ?? undefined} alt="" />
                  ) : (
                    <span aria-hidden="true">{item.name[0]}</span>
                  )}
                </span>
                <span className="ac-fighter-name">{item.name}</span>
                <span className="ac-fighter-epithet">{item.epithet}</span>
                <span className="ac-fighter-description">{item.description}</span>
                <span className="ac-stats">
                  <Stat label="VIDA" value={item.maxHp / 1.3} />
                  <Stat label="VELOCIDADE" value={item.speed / 2.65} />
                  <Stat label="ATAQUE" value={item.attacks.heavy.damage * 5} />
                </span>
                <span className="ac-special">ESPECIAL // {item.specialName}</span>
              </button>
            ))}
          </div>
          <div className="ac-actions">
            <button className="ac-btn" data-variant="ghost" onClick={() => navigate("menu", true)}>
              ‹ Voltar
            </button>
            <button className="ac-btn" data-variant="solid" onClick={() => navigate("difficulty")}>
              Confirmar {FIGHTERS[fighter].name} ›
            </button>
          </div>
        </section>
      )}

      {screen === "difficulty" && (
        <section className="ac-setup ac-fade-in ac-setup--narrow">
          <StepTitle
            step="02"
            title="Nível da ameaça"
            subtitle="Escolha a intensidade do adversário"
          />
          <div className="ac-difficulties">
            {DIFFICULTIES.map((item, index) => (
              <button
                className="ac-difficulty"
                data-selected={difficulty === item.id}
                key={item.id}
                onClick={() => {
                  setDifficulty(item.id);
                  sfx.play("click");
                }}
              >
                <span className="ac-threat">
                  {Array.from({ length: 3 }, (_, i) => (
                    <i key={i} data-on={i <= index} />
                  ))}
                </span>
                <b>{item.name}</b>
                <small>{item.detail}</small>
              </button>
            ))}
          </div>
          <div className="ac-versus">
            <span style={{ color: FIGHTERS[fighter].cssColor }}>{FIGHTERS[fighter].name}</span>
            <em>VS</em>
            <span className="ac-enemy">?</span>
          </div>
          <div className="ac-actions">
            <button
              className="ac-btn"
              data-variant="ghost"
              onClick={() => navigate("fighter", true)}
            >
              ‹ Voltar
            </button>
            <button className="ac-btn" data-variant="solid" onClick={() => navigate("fight")}>
              Entrar na arena ›
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="ac-logo" data-compact={compact}>
      <strong>47</strong>
      <span>FIGHT</span>
    </div>
  );
}

function StepTitle({ step, title, subtitle }: { step: string; title: string; subtitle: string }) {
  return (
    <header className="ac-step-title">
      <span>{step}</span>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="ac-stat">
      <small>{label}</small>
      <i>
        <b style={{ width: `${Math.min(100, value)}%` }} />
      </i>
    </span>
  );
}

function FightScreen({
  fighter,
  difficulty,
  sound,
  onMenu,
}: {
  fighter: FighterId;
  difficulty: Difficulty;
  sound: boolean;
  onMenu: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const sceneRef = useRef<import("../game/scenes/ArenaScene").ArenaScene | null>(null);
  const inputRef = useRef(new LocalInput());
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
  const [paused, setPaused] = useState(false);
  const previous = useRef<MatchSnapshot | null>(null);

  useEffect(() => {
    sfx.setEnabled(sound);
    const bus = new GameBus();
    const input = inputRef.current;
    input.attachKeyboard();
    const unsubscribe = bus.subscribe((next) => {
      const old = previous.current;
      if (old && (next.p1.hp < old.p1.hp || next.p2.hp < old.p2.hp)) sfx.play("hit");
      if (old && !old.over && next.over) sfx.play("ko");
      previous.current = next;
      setSnapshot(next);
      setPaused(next.paused);
    });
    let cancelled = false;
    void import("../game/createGame").then(({ createGame, getArenaScene }) => {
      if (cancelled || !host.current) return;
      const enemies = FIGHTER_LIST.filter((item) => item.id !== fighter);
      const opponent = enemies[Math.floor(Math.random() * enemies.length)]!.id;
      const game = createGame(host.current, {
        p1: fighter,
        p2: opponent,
        difficulty,
        mode: "ai",
        bus,
        input,
      });
      gameRef.current = game;
      sceneRef.current = getArenaScene(game);
    });
    return () => {
      cancelled = true;
      unsubscribe();
      input.detach();
      bus.clear();
      gameRef.current?.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, [difficulty, fighter, sound]);

  const togglePause = useCallback(() => {
    if (snapshot?.over) return;
    sfx.play("click");
    sceneRef.current?.setPaused(!paused);
  }, [paused, snapshot?.over]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.code === "Escape") togglePause();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [togglePause]);

  const touch = (action: ActionKey, down: boolean) => (event: PointerEvent) => {
    event.preventDefault();
    if (down) {
      event.currentTarget.setPointerCapture(event.pointerId);
      inputRef.current.press(action);
    } else inputRef.current.release(action);
  };

  const p1 = snapshot?.p1;
  const p2 = snapshot?.p2;
  return (
    <main className="ac-fight-screen">
      <div className="ac-game" ref={host} aria-label="Arena de combate" />
      <div className="ac-hud">
        <HudFighter fighter={p1} side="left" fallback={fighter} />
        <div className="ac-timer">
          <span>ROUND 1</span>
          <b>{String(snapshot?.timeLeft ?? 99).padStart(2, "0")}</b>
        </div>
        <HudFighter fighter={p2} side="right" fallback="holofokiu" />
      </div>
      <button className="ac-pause-button" onClick={togglePause} aria-label="Pausar partida">
        Ⅱ
      </button>
      <TouchControls touch={touch} />

      {paused && !snapshot?.over && (
        <div className="ac-overlay">
          <div className="ac-modal ac-rise">
            <span className="ac-kicker">COMBATE INTERROMPIDO</span>
            <h2>PAUSA</h2>
            <button className="ac-btn" data-variant="solid" onClick={togglePause}>
              Retomar
            </button>
            <button className="ac-btn" data-variant="ghost" onClick={onMenu}>
              Voltar ao menu
            </button>
            <small>Pressione ESC para retomar</small>
          </div>
        </div>
      )}
      {snapshot?.over && (
        <div className="ac-overlay">
          <div className="ac-modal ac-rise">
            <span className="ac-kicker">RESULTADO DA PARTIDA</span>
            <h2>
              {snapshot.winner === "draw"
                ? "EMPATE"
                : snapshot.winner === "p1"
                  ? "VITÓRIA"
                  : "DERROTA"}
            </h2>
            <p>
              {snapshot.winner === "p1"
                ? `${p1?.name} domina a arena.`
                : snapshot.winner === "p2"
                  ? `${p2?.name} venceu o confronto.`
                  : "Forças perfeitamente equilibradas."}
            </p>
            <button
              className="ac-btn"
              data-variant="solid"
              onClick={() => {
                sfx.play("click");
                sceneRef.current?.resetMatch();
              }}
            >
              Revanche
            </button>
            <button className="ac-btn" data-variant="ghost" onClick={onMenu}>
              Voltar ao menu
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function HudFighter({
  fighter,
  side,
  fallback,
}: {
  fighter: MatchSnapshot["p1"] | undefined;
  side: "left" | "right";
  fallback: FighterId;
}) {
  const stats = FIGHTERS[fighter?.id ?? fallback];
  const hp = fighter ? (fighter.hp / fighter.maxHp) * 100 : 100;
  const energy = fighter ? (fighter.energy / fighter.maxEnergy) * 100 : 0;
  return (
    <section className="ac-hud-fighter" data-side={side}>
      <div className="ac-hud-name">
        <b>{fighter?.name ?? stats.name}</b>
        <span>{side === "left" ? "JOGADOR" : "CPU"}</span>
      </div>
      <div className="ac-bar ac-bar--health">
        <span style={{ width: `${hp}%` }} />
      </div>
      <div className="ac-bar ac-bar--energy">
        <span style={{ width: `${energy}%` }} />
      </div>
      <small>{Math.max(0, fighter?.hp ?? stats.maxHp)} HP</small>
    </section>
  );
}

function TouchControls({
  touch,
}: {
  touch: (action: ActionKey, down: boolean) => (event: PointerEvent) => void;
}) {
  const button = (action: ActionKey, label: string, className = "") => (
    <button
      className={`ac-touch-btn ${className}`}
      onPointerDown={touch(action, true)}
      onPointerUp={touch(action, false)}
      onPointerCancel={touch(action, false)}
    >
      {label}
    </button>
  );
  return (
    <div className="ac-touch-controls">
      <div className="ac-dpad">
        {button("left", "◀")}
        {button("up", "▲")}
        {button("right", "▶")}
        {button("block", "DEF", "ac-touch-small")}
      </div>
      <div className="ac-attacks">
        {button("light", "J")}
        {button("heavy", "K")}
        {button("special", "L", "ac-touch-special")}
      </div>
    </div>
  );
}
