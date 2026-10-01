/** Efeitos sonoros sintetizados (opcionais, sem arquivos externos). */
let ctx: AudioContext | null = null;
let enabled = true;

export const sfx = {
  setEnabled(v: boolean) {
    enabled = v;
  },
  get enabled() {
    return enabled;
  },
  play(kind: "click" | "back" | "hit" | "block" | "special" | "ko") {
    if (!enabled || typeof window === "undefined") return;
    try {
      ctx ||= new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === "suspended") void ctx.resume();
      const now = ctx.currentTime;
      const presets = {
        click: { f: 620, to: 880, t: "square" as OscillatorType, d: 0.07, g: 0.05 },
        back: { f: 440, to: 220, t: "square" as OscillatorType, d: 0.09, g: 0.05 },
        hit: { f: 220, to: 70, t: "sawtooth" as OscillatorType, d: 0.14, g: 0.09 },
        block: { f: 900, to: 500, t: "triangle" as OscillatorType, d: 0.1, g: 0.06 },
        special: { f: 160, to: 760, t: "sawtooth" as OscillatorType, d: 0.3, g: 0.08 },
        ko: { f: 300, to: 40, t: "square" as OscillatorType, d: 0.6, g: 0.12 },
      };
      const p = presets[kind];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = p.t;
      osc.frequency.setValueAtTime(p.f, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, p.to), now + p.d);
      gain.gain.setValueAtTime(p.g, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + p.d + 0.02);
    } catch {
      /* áudio indisponível — ignorado */
    }
  },
};
