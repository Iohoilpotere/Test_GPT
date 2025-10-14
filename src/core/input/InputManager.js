import { GlobalEventBus } from '../events/EventBus.js';

const KEY_EVENTS = {
  KEY_DOWN: 'input:keyDown',
  KEY_UP: 'input:keyUp'
};

/**
 * Singleton InputManager capturing keyboard state and publishing events.
 */
export class InputManager {
  static #instance;

  constructor(target = window) {
    if (InputManager.#instance) {
      return InputManager.#instance;
    }
    this.target = target;
    this.pressedKeys = new Set();
    this.#bindEvents();
    InputManager.#instance = this;
  }

  static getInstance(target) {
    return new InputManager(target);
  }

  #bindEvents() {
    this.keydownHandler = (event) => {
      if (event.repeat) return;
      this.pressedKeys.add(event.code);
      GlobalEventBus.publish(KEY_EVENTS.KEY_DOWN, event.code);
    };

    this.keyupHandler = (event) => {
      this.pressedKeys.delete(event.code);
      GlobalEventBus.publish(KEY_EVENTS.KEY_UP, event.code);
    };

    this.target.addEventListener('keydown', this.keydownHandler);
    this.target.addEventListener('keyup', this.keyupHandler);
  }

  isPressed(code) {
    return this.pressedKeys.has(code);
  }

  dispose() {
    this.target.removeEventListener('keydown', this.keydownHandler);
    this.target.removeEventListener('keyup', this.keyupHandler);
  }
}

export const InputEvents = KEY_EVENTS;
