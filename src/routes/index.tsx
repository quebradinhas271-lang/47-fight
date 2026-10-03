import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { FIGHTERS, FIGHTER_LIST, type FighterId } from "../game/config/fighters";
import { DEFAULT_MOVE_SPEED, type Difficulty } from "../game/config/combat";
import { ARENAS, ARENA_LIST, type ArenaId } from "../game/config/arenas";
import { FIGHTER_SPRITES } from "../game/config/sprites";
import { GameBus } from "../game/core/bus";
import { LocalInput, type ActionKey } from "../game/core/input";
import { GamepadController } from "../game/core/gamepad";
import {
  CONTROLS_CHANGED_EVENT,
  formatKeyCode,
  formatGamepadButton,
  loadGamepadBindings,
  loadKeyboardBindings,
  loadVirtualControlsPreference,
} from "../game/core/controlSettings";
import type { MatchSnapshot } from "../game/core/types";
import { sfx } from "../game/audio";
import { CinematicIntro } from "../components/CinematicIntro";
import { GameLogo } from "../components/GameLogo";
import { MainMenu } from "../components/MainMenu";
import { GameModeSelection } from "../components/GameModeSelection";
import { DifficultySelection } from "../components/DifficultySelection";
import { Footprints, HandFist, MapPin, Shield, Swords, Zap } from "lucide-react";

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

type Screen =
  | "menu"
  | "modes"
  | "invite"
  | "difficulty"
  | "fighter"
  | "opponent"
  | "arena"
  | "fight"
  | "tutorial";

const TUTORIAL_INVITE_KEY = "47-fight.tutorial-invite.v1";

function FightApp() {
  const [introComplete, setIntroComplete] = useState(false);
  const [screen, setScreen] = useState<Screen>("menu");
  const [fighter, setFighter] = useState<FighterId>("dictador");
  const [opponent, setOpponent] = useState<FighterId>("holofokiu");
  const [arena, setArena] = useState<ArenaId | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [sound, setSound] = useState(true);
  const [tutorialInvite, setTutorialInvite] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [menuSettings, setMenuSettings] = useState(false);

  const navigate = (next: Screen, back = false) => {
    sfx.play(back ? "back" : "click");
    setScreen(next);
  };

  if (!introComplete) {
    return <CinematicIntro onComplete={() => setIntroComplete(true)} />;
  }

  const updateSound = (enabled: boolean) => {
    setSound(enabled);
    sfx.setEnabled(enabled);
    if (enabled) sfx.play("click");
  };

  if (screen === "menu") {
    return (
      <MainMenu
        sound={sound}
        onSoundChange={updateSound}
        onStart={() => navigate("modes")}
        onTutorial={() => {
          setTutorialStep(0);
          navigate("tutorial");
        }}
        initialPanel={menuSettings ? "settings" : null}
        resumeTutorial={
          menuSettings
            ? () => {
                setMenuSettings(false);
                navigate("tutorial");
              }
            : undefined
        }
      />
    );
  }

  if (screen === "modes") {
    return (
      <GameModeSelection
        onLocal={() => {
          if (!localStorage.getItem(TUTORIAL_INVITE_KEY)) {
            setTutorialInvite(true);
            navigate("invite");
          } else navigate("difficulty");
        }}
        onBack={() => navigate("menu", true)}
      />
    );
  }

  if (screen === "invite" && tutorialInvite) {
    return (
      <main className="ac-cinematic-screen ac-tutorial-welcome">
        <div className="ac-cinematic-shade" aria-hidden="true" />
        <div
          className="ac-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-invite-title"
        >
          <div className="ac-modal ac-rise">
            <GameLogo variant="modal" />
            <span className="ac-kicker">PRIMEIROS PASSOS</span>
            <h2 id="tutorial-invite-title">PREPARE-SE PARA LUTAR</h2>
            <p>Deseja aprender os movimentos básicos do 47-FIGHT antes de entrar na arena?</p>
            <button
              className="ac-btn"
              data-variant="solid"
              onClick={() => {
                localStorage.setItem(TUTORIAL_INVITE_KEY, "started");
                setTutorialInvite(false);
                setTutorialStep(0);
                navigate("tutorial");
              }}
            >
              Iniciar tutorial
            </button>
            <button
              className="ac-btn"
              data-variant="ghost"
              onClick={() => {
                localStorage.setItem(TUTORIAL_INVITE_KEY, "skipped");
                setTutorialInvite(false);
                navigate("difficulty");
              }}
            >
              Pular tutorial
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "tutorial") {
    return (
      <TutorialScreen
        step={tutorialStep}
        onStep={setTutorialStep}
        sound={sound}
        onContinue={() => navigate("difficulty")}
        onMenu={() => navigate("menu", true)}
        onSettings={() => {
          setMenuSettings(true);
          navigate("menu");
        }}
      />
    );
  }

  if (screen === "difficulty") {
    return (
      <DifficultySelection
        selected={difficulty}
        onSelect={setDifficulty}
        onConfirm={() => navigate("fighter")}
        onBack={() => navigate("modes", true)}
      />
    );
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
      <header className={`ac-topbar ${screen === "arena" ? "ac-topbar--arena" : ""}`}>
        {screen !== "arena" && <GameLogo variant="header" />}
        <button
          className="ac-icon-btn"
          onClick={() => {
            updateSound(!sound);
          }}
          aria-label={sound ? "Desativar som" : "Ativar som"}
        >
          {sound ? "SOM ON" : "SOM OFF"}
        </button>
      </header>

      {screen === "fighter" && (
        <section className="ac-setup ac-fade-in">
          <StepTitle
            step="02"
            title="Escolha seu lutador"
            subtitle="Cada estilo exige uma estratégia"
          />
          <FighterRoster selected={fighter} onSelect={setFighter} />
          <div className="ac-actions">
            <button
              className="ac-btn"
              data-variant="ghost"
              onClick={() => navigate("difficulty", true)}
            >
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
            step="03"
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
              <span>04 // PRÓXIMO CONFRONTO</span>
              <h1>Escolha sua arena</h1>
              <p>Defina o palco da batalha</p>
            </header>
            <div className="ac-arena-list" aria-label="Arenas disponíveis">
              {ARENA_LIST.map((item, index) => (
                <button
                  key={item.id}
                  className="ac-arena-card"
                  data-selected={arena === item.id}
                  aria-pressed={arena === item.id}
                  onClick={() => {
                    setArena(item.id);
                    sfx.play("click");
                  }}
                >
                  <img src={item.selectionImage} alt="" />
                  <span className="ac-arena-copy">
                    <small>{String(index + 1).padStart(2, "0")} // ARENA</small>
                    <b>{item.name}</b>
                  </span>
                </button>
              ))}
            </div>
            <div className="ac-arena-details" aria-live="polite">
              <MapPin aria-hidden="true" />
              <div>
                <small>{arena ? "ARENA SELECIONADA" : "AGUARDANDO SELEÇÃO"}</small>
                <h2>{arena ? ARENAS[arena].name : "Selecione um cenário"}</h2>
                <p>
                  {arena
                    ? ARENAS[arena].description
                    : "Destaque uma das arenas acima para visualizar o campo de batalha."}
                </p>
              </div>
            </div>
            <div className="ac-arena-actions">
              <button
                className="ac-btn"
                data-variant="solid"
                disabled={!arena}
                onClick={() => arena && navigate("fight")}
              >
                <Swords aria-hidden="true" /> Confirmar <span>›</span>
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

type HelpMethod = "keyboard" | "gamepad" | "touch";

const TUTORIAL_STEPS = [
  {
    title: "MOVIMENTAÇÃO",
    text: "Ande para a esquerda e para a direita.",
    action: "left" as ActionKey,
  },
  { title: "PULO", text: "Salte uma vez.", action: "up" as ActionKey },
  { title: "ATAQUE LEVE", text: "Execute um soco.", action: "light" as ActionKey },
  { title: "ATAQUE PESADO", text: "Execute um chute.", action: "heavy" as ActionKey },
  {
    title: "DEFESA",
    text: "Segure a defesa. O boneco atacará para você praticar.",
    action: "block" as ActionKey,
  },
  {
    title: "ATAQUE ESPECIAL",
    text: "Sua energia foi carregada. Use o especial.",
    action: "special" as ActionKey,
  },
] as const;

const TOUCH_LABELS: Record<ActionKey, string> = {
  left: "JOYSTICK ←",
  right: "JOYSTICK →",
  up: "JOYSTICK ↑",
  light: "ÍCONE DE PUNHO",
  heavy: "ÍCONE DE CHUTE",
  special: "ÍCONE DE RAIO",
  block: "ÍCONE DE ESCUDO",
};

function TutorialScreen({
  step,
  onStep,
  sound,
  onContinue,
  onMenu,
  onSettings,
}: {
  step: number;
  onStep: (step: number) => void;
  sound: boolean;
  onContinue: () => void;
  onMenu: () => void;
  onSettings: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const sceneRef = useRef<import("../game/scenes/ArenaScene").ArenaScene | null>(null);
  const inputRef = useRef(new LocalInput());
  const previousX = useRef<number | null>(null);
  const moved = useRef({ left: false, right: false });
  const stepRef = useRef(step);
  const completingRef = useRef(false);
  const [method, setMethod] = useState<HelpMethod>(() =>
    typeof navigator !== "undefined" && navigator.maxTouchPoints > 0 ? "touch" : "keyboard",
  );
  const [completed, setCompleted] = useState(false);
  const [bindings, setBindings] = useState(loadKeyboardBindings);
  const [gamepadBindings, setGamepadBindings] = useState(loadGamepadBindings);
  const touchCapable =
    typeof navigator !== "undefined" &&
    (navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches);

  const finishStep = useCallback(() => {
    if (completingRef.current) return;
    completingRef.current = true;
    setCompleted(true);
    window.setTimeout(() => {
      setCompleted(false);
      completingRef.current = false;
      onStep(Math.min(6, stepRef.current + 1));
    }, 550);
  }, [onStep]);

  useEffect(() => {
    sfx.setEnabled(sound);
    const bus = new GameBus();
    const input = inputRef.current;
    input.attachKeyboard();
    const unsubscribe = bus.subscribe((snap) => {
      const activeStep = stepRef.current;
      if (activeStep >= 6 || completingRef.current) return;
      const x = snap.p1.x;
      if (activeStep === 0 && previousX.current !== null) {
        if (x < previousX.current - 0.5) moved.current.left = true;
        if (x > previousX.current + 0.5) moved.current.right = true;
        if (moved.current.left && moved.current.right) finishStep();
      }
      previousX.current = x;
      if (activeStep === 1 && snap.p1.state === "jump") finishStep();
      if (activeStep === 2 && snap.p1.attackKind === "light") finishStep();
      if (activeStep === 3 && snap.p1.attackKind === "heavy") finishStep();
      if (activeStep === 4 && snap.p1SuccessfulBlocks > 0) finishStep();
      if (activeStep === 5 && snap.p1.attackKind === "special") finishStep();
    });
    let cancelled = false;
    void import("../game/createGame").then(({ createGame, getArenaScene }) => {
      if (cancelled || !host.current) return;
      const game = createGame(host.current, {
        p1: "dictador",
        p2: "holofokiu",
        arena: "coliseu",
        difficulty: "normal",
        mode: "tutorial",
        bus,
        input,
      });
      gameRef.current = game;
      sceneRef.current = getArenaScene(game);
      sceneRef.current?.setTutorialStep(stepRef.current);
    });
    return () => {
      cancelled = true;
      unsubscribe();
      input.detach();
      bus.clear();
      gameRef.current?.destroy(true);
    };
  }, [finishStep, sound]);

  useEffect(() => {
    stepRef.current = step;
    previousX.current = null;
    sceneRef.current?.setTutorialStep(step);
  }, [step]);
  useEffect(() => {
    const changed = () => {
      setBindings(loadKeyboardBindings());
      setGamepadBindings(loadGamepadBindings());
    };
    window.addEventListener(CONTROLS_CHANGED_EVENT, changed);
    return () => window.removeEventListener(CONTROLS_CHANGED_EVENT, changed);
  }, []);
  useEffect(() => {
    const controller = new GamepadController(
      inputRef.current,
      () => setMethod("gamepad"),
      () => undefined,
    );
    const updateMethod = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (next === "keyboard") setMethod("keyboard");
    };
    controller.start();
    window.addEventListener("47-fight:input-method", updateMethod);
    return () => {
      controller.stop();
      window.removeEventListener("47-fight:input-method", updateMethod);
    };
  }, []);

  const touch = (action: ActionKey, down: boolean) => (event: PointerEvent) => {
    event.preventDefault();
    if (down) {
      event.currentTarget.setPointerCapture(event.pointerId);
      setMethod("touch");
      inputRef.current.press(action, `touch:${event.pointerId}`);
    } else inputRef.current.release(action, `touch:${event.pointerId}`);
  };
  const releaseTouch = useCallback(() => inputRef.current.releaseSource("touch:"), []);
  const command = (action: ActionKey) =>
    method === "keyboard"
      ? formatKeyCode(bindings[action])
      : method === "gamepad"
        ? formatGamepadButton(gamepadBindings[action])
        : TOUCH_LABELS[action];

  return (
    <main className="ac-fight-screen ac-tutorial-screen">
      <div className="ac-game" ref={host} aria-label="Arena de treinamento" />
      <section className="ac-tutorial-panel" aria-live="polite">
        <div className="ac-tutorial-progress" aria-label={`Etapa ${Math.min(step + 1, 7)} de 7`}>
          {Array.from({ length: 7 }, (_, index) => (
            <i key={index} data-active={index <= step} />
          ))}
        </div>
        {step < 6 ? (
          <>
            <small>ETAPA {String(step + 1).padStart(2, "0")} / 07</small>
            <h1>{TUTORIAL_STEPS[step].title}</h1>
            <p>{TUTORIAL_STEPS[step].text}</p>
            <kbd>{command(TUTORIAL_STEPS[step].action)}</kbd>
            {step === 0 && <kbd>{command("right")}</kbd>}
            {completed && <strong className="ac-tutorial-success">CONCLUÍDO!</strong>}
          </>
        ) : (
          <>
            <small>ETAPA 07 / 07</small>
            <h1>TREINAMENTO CONCLUÍDO</h1>
            <p>Você está pronto para entrar na arena.</p>
            <div className="ac-tutorial-finish">
              <button onClick={onContinue}>Continuar para o jogo</button>
              <button
                onClick={() => {
                  moved.current = { left: false, right: false };
                  onStep(0);
                }}
              >
                Repetir tutorial
              </button>
              <button onClick={onMenu}>Voltar ao menu</button>
            </div>
          </>
        )}
      </section>
      <div className="ac-tutorial-methods" role="group" aria-label="Método exibido">
        {(["keyboard", "gamepad", "touch"] as HelpMethod[]).map((value) => (
          <button key={value} data-selected={method === value} onClick={() => setMethod(value)}>
            {value === "keyboard" ? "Teclado" : value === "gamepad" ? "Gamepad" : "Touch"}
          </button>
        ))}
      </div>
      {(touchCapable || method === "touch") && method === "touch" && (
        <TouchControls touch={touch} releaseAll={releaseTouch} />
      )}
      <aside className="ac-tutorial-guide">
        <b>PERSONALIZE SEUS CONTROLES</b>
        <span>Menu Principal › Configurações › Controles do teclado / Controles do gamepad</span>
        <p>
          Selecione o comando, pressione a nova tecla e confirme a alteração exibida. Use “Restaurar
          controles padrão” para voltar ao esquema original.
        </p>
        <p>
          <b>Controles virtuais:</b> Automático, Sempre exibir ou Sempre ocultar.
        </p>
        <button onClick={onSettings}>Abrir configurações</button>
      </aside>
      <div className="ac-tutorial-actions">
        {step < 6 && <button onClick={() => onStep(step + 1)}>Pular etapa</button>}
        <button onClick={onMenu}>Sair do tutorial</button>
      </div>
    </main>
  );
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
  const [virtualPreference, setVirtualPreference] = useState(loadVirtualControlsPreference);
  const [activeMethod, setActiveMethod] = useState<"keyboard" | "touch" | "gamepad">("keyboard");
  const [gamepadNotice, setGamepadNotice] = useState(false);
  const touchCapable =
    typeof navigator !== "undefined" &&
    (navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches);

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
  const togglePauseRef = useRef(togglePause);
  useEffect(() => {
    togglePauseRef.current = togglePause;
  }, [togglePause]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.code === "Escape") togglePause();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [togglePause]);

  useEffect(() => {
    const controller = new GamepadController(
      inputRef.current,
      () => {
        setActiveMethod("gamepad");
        window.dispatchEvent(new CustomEvent("47-fight:input-method", { detail: "gamepad" }));
      },
      () => togglePauseRef.current(),
    );
    const onStatus = (event: Event) => {
      if ((event as CustomEvent<boolean>).detail) setGamepadNotice(true);
      else setActiveMethod(touchCapable ? "touch" : "keyboard");
    };
    const onMethod = (event: Event) => {
      const method = (event as CustomEvent<string>).detail;
      if (method === "keyboard") setActiveMethod("keyboard");
    };
    controller.start();
    window.addEventListener("47-fight:gamepad-status", onStatus);
    window.addEventListener("47-fight:input-method", onMethod);
    return () => {
      controller.stop();
      window.removeEventListener("47-fight:gamepad-status", onStatus);
      window.removeEventListener("47-fight:input-method", onMethod);
    };
  }, [touchCapable]);

  useEffect(() => {
    if (!gamepadNotice) return;
    const timeout = window.setTimeout(() => setGamepadNotice(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [gamepadNotice]);

  useEffect(() => {
    const update = () => setVirtualPreference(loadVirtualControlsPreference());
    window.addEventListener(CONTROLS_CHANGED_EVENT, update);
    return () => window.removeEventListener(CONTROLS_CHANGED_EVENT, update);
  }, []);

  const touch = (action: ActionKey, down: boolean) => (event: PointerEvent) => {
    event.preventDefault();
    if (down) {
      event.currentTarget.setPointerCapture(event.pointerId);
      setActiveMethod("touch");
      window.dispatchEvent(new CustomEvent("47-fight:input-method", { detail: "touch" }));
      inputRef.current.press(action, `touch:${event.pointerId}`);
    } else inputRef.current.release(action, `touch:${event.pointerId}`);
  };
  const releaseTouch = useCallback(() => inputRef.current.releaseSource("touch:"), []);

  const showTouchControls =
    virtualPreference === "show" ||
    (virtualPreference === "auto" && touchCapable && activeMethod !== "gamepad");

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
      {showTouchControls && <TouchControls touch={touch} releaseAll={releaseTouch} />}
      {gamepadNotice && (
        <div className="ac-gamepad-notice" role="status">
          CONTROLE CONECTADO
        </div>
      )}

      {paused && !snapshot?.over && (
        <div className="ac-overlay" role="dialog" aria-modal="true" aria-label="Jogo pausado">
          <div className="ac-modal ac-rise">
            <GameLogo variant="modal" />
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
        <div
          className="ac-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Resultado da partida"
        >
          <div className="ac-modal ac-rise">
            <GameLogo variant="modal" />
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
  releaseAll,
}: {
  touch: (action: ActionKey, down: boolean) => (event: PointerEvent) => void;
  releaseAll: () => void;
}) {
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const activePointer = useRef<number | null>(null);
  const joystickActions = useRef({ left: false, right: false, up: false });
  const JOYSTICK_DEADZONE = 0.22;
  const JOYSTICK_JUMP_THRESHOLD = -0.45;

  useEffect(() => releaseAll, [releaseAll]);

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
  const button = (action: ActionKey, label: string, icon: ReactNode, className = "") => (
    <button
      className={`ac-touch-btn ${className}`}
      aria-label={label}
      onPointerDown={touch(action, true)}
      onPointerUp={touch(action, false)}
      onPointerCancel={touch(action, false)}
    >
      {icon}
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
        {button("block", "Defender", <Shield aria-hidden="true" />, "ac-touch-small")}
        {button("light", "Ataque leve, soco", <HandFist aria-hidden="true" />)}
        {button("heavy", "Ataque pesado, chute", <Footprints aria-hidden="true" />)}
        {button("special", "Ataque especial", <Zap aria-hidden="true" />, "ac-touch-special")}
      </div>
    </div>
  );
}
