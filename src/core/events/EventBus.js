/**
 * EventBus implements a lightweight Observer pattern for decoupled communication.
 * Singleton because input and gameplay events require a shared dispatcher.
 */
export class EventBus {
  static #instance;

  constructor() {
    if (EventBus.#instance) {
      return EventBus.#instance;
    }
    this.listeners = new Map();
    EventBus.#instance = this;
  }

  static getInstance() {
    return new EventBus();
  }

  subscribe(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
    return () => this.unsubscribe(event, handler);
  }

  unsubscribe(event, handler) {
    if (!this.listeners.has(event)) {
      return;
    }
    this.listeners.get(event).delete(handler);
  }

  publish(event, payload) {
    if (!this.listeners.has(event)) {
      return;
    }
    this.listeners.get(event).forEach((handler) => handler(payload));
  }
}

export const GlobalEventBus = EventBus.getInstance();
