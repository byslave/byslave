import type { GameEventName, GameEvents } from "./GameEvents";

type Handler<K extends GameEventName> = (payload: GameEvents[K]) => void;

export class EventBus {
  private readonly listeners = new Map<GameEventName, Set<Handler<GameEventName>>>();

  on<K extends GameEventName>(event: K, handler: Handler<K>): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(handler as Handler<GameEventName>);
    this.listeners.set(event, set);
    return () => this.off(event, handler);
  }

  off<K extends GameEventName>(event: K, handler: Handler<K>): void {
    this.listeners.get(event)?.delete(handler as Handler<GameEventName>);
  }

  emit<K extends GameEventName>(event: K, payload: GameEvents[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of [...set]) {
      handler(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
