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
import { DEFAULT_MOVE_SPEED, type Difficulty } from "../game/config/combat";
import { ARENAS, ARENA_LIST, type ArenaId } from "../game/config/arenas";
import { FIGHTER_SPRITES } from "../game/config/sprites";
import { GameBus } from "../game/core/bus";
import { LocalInput, type ActionKey } from "../game/core/input";
import type { MatchSnapshot } from "../game/core/types";
import { sfx } from "../game/audio";
import { CinematicIntro } from "../components/CinematicIntro";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "47-FIGHT | Jogo de luta 2D" },
      {
        name: "description",
        content: "Entre no 47-FIGHT, escolha seu lutador e dispute combates 2D em tempo real.",
      },
      { property: "og:title", content: "47-FIGHT | Jogo de luta 2D" },
      {
        property: "og:description",
        content: "Escolha seu lutador e entre em combates 2D em tempo real no 47-FIGHT.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FightApp,
});

type Screen = "menu" | "fighter" | "opponent" | "arena" | "fight";

function FightApp() {
  const [introComplete, setIntroComplete] = useState(false);
  const [screen, setScreen] = useState<Screen>("menu");
  const [fighter, setFighter] = useState<FighterId>("dictador");
  const [opponent, setOpponent] = useState<FighterId>("holofokiu");
  const [arena, setArena] = useState<ArenaId | null>(null);
  const difficulty: Difficulty = "normal";
  const [sound, setSound] = useState(true);

  const navigate = (next: Screen, back = false) => {
    sfx.play(back ? "back" : "click");
    setScreen(next);
  };

  if (!introComplete) {
    return <CinematicIntro onComplete={() => setIntroComplete(true)} />;
  }

  if (screen === "fight" && arena) {
    return (
      <FightScreen
        fighter={fighter}
        opponent={opponent}
        arena={arena}
        difficulty={difficulty}
        sound={sound}
        onMenu={() => navigate("menu", true)}
      />
    );
  }

  return (
    <main className={`ac-screen ac-shell ${screen === "arena" ? "ac-shell--arena" : ""}`}>
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
          <FighterRoster selected={fighter} onSelect={setFighter} />
          <div className="ac-actions">
            <button className="ac-btn" data-variant="ghost" onClick={() => navigate("menu", true)}>
              ‹ Voltar
            </button>
            <button className="ac-btn" data-variant="solid" onClick={() => navigate("opponent")}>
              Confirmar {FIGHTERS[fighter].name} ›
            </button>
          </div>
        </section>
      )}

      {screen === "opponent" && (
        <section className="ac-setup ac-fade-in">
          <StepTitle
            step="02"
            title="Escolha seu adversário"
            subtitle="Selecione o lutador controlado pela IA"
          />
          <FighterRoster selected={opponent} onSelect={setOpponent} />
          <div className="ac-versus">
            <span style={{ color: FIGHTERS[fighter].cssColor }}>{FIGHTERS[fighter].name}</span>
            <em>VS</em>
            <span style={{ color: FIGHTERS[opponent].cssColor }}>{FIGHTERS[opponent].name}</span>
          </div>
          <div className="ac-actions">
            <button
              className="ac-btn"
              data-variant="ghost"
              onClick={() => navigate("fighter", true)}
            >
              ‹ Voltar
            </button>
            <button className="ac-btn" data-variant="solid" onClick={() => navigate("arena")}>
              Confirmar {FIGHTERS[opponent].name} ›
            </button>
          </div>
        </section>
      )}

      {screen === "arena" && (
        <section className="ac-arena-selection ac-fade-in">
          <div className="ac-arena-backgrounds" aria-hidden="true">
            {ARENA_LIST.map((item) => (
              <div
                key={item.id}
                className="ac-arena-background"
                data-active={arena === item.id}
                style={{ backgroundImage: `url(${item.selectionImage})` }}
              />
            ))}
          </div>
          <div className="ac-arena-shade" aria-hidden="true" />
          <div className="ac-arena-interface">
            <header className="ac-arena-title">
              <span>03 // PRÓXIMO CONFRONTO</span>
              <h1>Escolha sua arena</h1>
              <p>Defina o palco da batalha</p>
            </header>
            <div className="ac-arena-list" aria-label="Arenas disponíveis">
              {ARENA_LIST.map((item, index) => (
                <button
                  key={item.id}
                  className="ac-arena-card"
                  data-selected={arena === item.id}
                  onClick={() => {
                    setArena(item.id);
                    sfx.play("click");
                  }}
                >
                  <span className="ac-arena-copy">
                    <small>{String(index + 1).padStart(2, "0")} // ARENA</small>
                    <b>{item.name}</b>
                  </span>
                </button>
              ))}
            </div>
            <div className="ac-arena-details" aria-live="polite">
              <small>{arena ? "ARENA SELECIONADA" : "AGUARDANDO SELEÇÃO"}</small>
              <h2>{arena ? ARENAS[arena].name : "Selecione um cenário"}</h2>
              <p>
                {arena
                  ? ARENAS[arena].description
                  : "Destaque uma das arenas acima para visualizar o campo de batalha."}
              </p>
            </div>
            <div className="ac-arena-actions">
              <button
                className="ac-btn"
                data-variant="solid"
                disabled={!arena}
                onClick={() => arena && navigate("fight")}
              >
                Confirmar <span>›</span>
              </button>
              <button
                className="ac-btn"
                data-variant="ghost"
                onClick={() => navigate("opponent", true)}
              >
                ‹ Voltar
              </button>
            </div>
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

function FighterRoster({
  selected,
  onSelect,
}: {
  selected: FighterId;
  onSelect: (fighter: FighterId) => void;
}) {
  return (
    <div className="ac-roster">
      {FIGHTER_LIST.map((item, index) => (
        <button
          key={item.id}
          className="ac-fighter-card"
          data-selected={selected === item.id}
          style={
            { "--fighter": item.cssColor, "--fighter-accent": item.cssAccent } as CSSProperties
          }
          onClick={() => {
            onSelect(item.id);
            sfx.play("click");
          }}
        >
          <span className="ac-fighter-info">
            <span className="ac-fighter-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="ac-fighter-name">{item.name}</span>
            <span className="ac-fighter-epithet">{item.epithet}</span>
            <span className="ac-fighter-description">{item.description}</span>
            <span className="ac-stats">
              <Stat label="VIDA" value={item.maxHp / 1.3} />
              <Stat label="VELOCIDADE" value={(item.moveSpeed ?? DEFAULT_MOVE_SPEED) / 2.65} />
              <Stat label="ATAQUE" value={item.attacks.heavy.damage * 5} />
            </span>
            <span className="ac-special">ESPECIAL // {item.specialName}</span>
          </span>
          <span className="ac-fighter-silhouette">
            <FighterPortrait fighter={item.id} name={item.name} />
          </span>
        </button>
      ))}
    </div>
  );
}

function FighterPortrait({ fighter, name }: { fighter: FighterId; name: string }) {
  const portrait = FIGHTER_SPRITES[fighter].portrait;
  const [loadFailed, setLoadFailed] = useState(false);

  if (!portrait || loadFailed) return <span aria-hidden="true">{name[0]}</span>;

  return <img src={portrait} alt="" onError={() => setLoadFailed(true)} />;
}

function FightScreen({
  fighter,
  opponent,
  arena,
  difficulty,
  sound,
  onMenu,
}: {
  fighter: FighterId;
  opponent: FighterId;
  arena: ArenaId;
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
      const game = createGame(host.current, {
        p1: fighter,
        p2: opponent,
        arena,
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
  }, [arena, difficulty, fighter, opponent, sound]);

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
        <HudFighter fighter={p2} side="right" fallback={opponent} />
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
                const scene =
                  sceneRef.current ??
                  (gameRef.current?.scene.getScene("arena") as
                    import("../game/scenes/ArenaScene").ArenaScene | undefined) ??
                  null;
                sceneRef.current = scene;
                scene?.resetMatch();
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
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const activePointer = useRef<number | null>(null);
  const joystickActions = useRef({ left: false, right: false, up: false });
  const JOYSTICK_DEADZONE = 0.22;
  const JOYSTICK_JUMP_THRESHOLD = -0.45;

  const updateJoystick = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = rect.width / 2;
    let x = (event.clientX - (rect.left + radius)) / radius;
    let y = (event.clientY - (rect.top + radius)) / radius;
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    setStick({ x, y });
    const left = x < -JOYSTICK_DEADZONE;
    const right = x > JOYSTICK_DEADZONE;
    const up = y < JOYSTICK_JUMP_THRESHOLD;
    const emit = (action: "left" | "right" | "up", active: boolean) => {
      if (joystickActions.current[action] === active) return;
      joystickActions.current[action] = active;
      const synthetic = {
        preventDefault() {},
        currentTarget: event.currentTarget,
        pointerId: event.pointerId,
      } as unknown as PointerEvent;
      touch(action, active)(synthetic);
    };
    emit("left", left);
    emit("right", right);
    emit("up", up);
  };

  const resetJoystick = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (activePointer.current !== event.pointerId) return;
    for (const action of ["left", "right", "up"] as const) {
      if (joystickActions.current[action]) touch(action, false)(event as unknown as PointerEvent);
      joystickActions.current[action] = false;
    }
    activePointer.current = null;
    setStick({ x: 0, y: 0 });
  };
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
      <div
        className="ac-joystick"
        aria-label="Joystick de movimento"
        onPointerDown={(event) => {
          event.preventDefault();
          activePointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          updateJoystick(event);
        }}
        onPointerMove={(event) => {
          if (activePointer.current === event.pointerId) updateJoystick(event);
        }}
        onPointerUp={resetJoystick}
        onPointerCancel={resetJoystick}
        onLostPointerCapture={resetJoystick}
      >
        <span style={{ transform: `translate(${stick.x * 38}px, ${stick.y * 38}px)` }} />
      </div>
      <div className="ac-attacks">
        {button("block", "DEF", "ac-touch-small")}
        {button("light", "J")}
        {button("heavy", "K")}
        {button("special", "L", "ac-touch-special")}
      </div>
    </div>
  );
}
