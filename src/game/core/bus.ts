import type { MatchSnapshot } from "./types";

type Listener = (s: MatchSnapshot) => void;

/** Ponte de eventos entre a cena Phaser e a interface React. */
export class GameBus {
  private listeners = new Set<Listener>();
  private last: MatchSnapshot | null = null;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    if (this.last) fn(this.last);
    return () => this.listeners.delete(fn);
  }

  emit(snapshot: MatchSnapshot) {
    this.last = snapshot;
    this.listeners.forEach((l) => l(snapshot));
  }

  clear() {
    this.listeners.clear();
    this.last = null;
  }
}
