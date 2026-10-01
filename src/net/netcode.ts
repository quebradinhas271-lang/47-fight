import type { FighterId } from "../game/config/fighters";
import type { InputState } from "../game/core/types";

/**
 * Camada de integração do multiplayer online.
 *
 * O jogo fala apenas com esta interface. Quando o servidor autoritativo de
 * partidas (WebSocket) estiver configurado, basta implementar um transporte
 * real e registrá-lo em `createNetClient` — nenhuma regra de combate muda,
 * porque o servidor passa a ser a fonte da verdade de vida/dano/resultado.
 */
export interface NetRoomState {
  code: string;
  hostReady: boolean;
  guestReady: boolean;
  hostFighter: FighterId | null;
  guestFighter: FighterId | null;
  connected: boolean;
  latencyMs: number | null;
}

export interface NetClient {
  readonly available: boolean;
  readonly unavailableReason: string;
  createRoom(fighter: FighterId): Promise<NetRoomState>;
  joinRoom(code: string, fighter: FighterId): Promise<NetRoomState>;
  setReady(ready: boolean): Promise<void>;
  sendInput(tick: number, input: InputState): void;
  leave(): void;
  on(event: "state" | "start" | "snapshot" | "error" | "disconnect", cb: (payload: unknown) => void): () => void;
}

export const MULTIPLAYER_MISSING = [
  "Servidor autoritativo de partidas (WebSocket) ainda não provisionado.",
  "Backend de contas e salas (Lovable Cloud) ainda não ativado.",
  "Sincronização de entradas e reconciliação de estado dependem dos dois itens acima.",
];

class UnavailableNetClient implements NetClient {
  readonly available = false;
  readonly unavailableReason =
    "O servidor de partidas online ainda não está configurado neste projeto.";
  private fail(): never {
    throw new Error(this.unavailableReason);
  }
  createRoom(): Promise<NetRoomState> {
    return Promise.reject(new Error(this.unavailableReason));
  }
  joinRoom(): Promise<NetRoomState> {
    return Promise.reject(new Error(this.unavailableReason));
  }
  setReady(): Promise<void> {
    return Promise.reject(new Error(this.unavailableReason));
  }
  sendInput(): void {
    /* no-op enquanto offline */
  }
  leave(): void {
    /* no-op */
  }
  on(): () => void {
    return () => {};
  }
  // mantém o `fail` referenciado para futuras implementações
  protected _unused() {
    this.fail();
  }
}

export function createNetClient(): NetClient {
  return new UnavailableNetClient();
}
