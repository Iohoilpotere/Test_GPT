import { TankBattleGame } from './game/TankBattleGame.js';
import { InputManager } from './core/input/InputManager.js';

const canvas = document.getElementById('gameCanvas');
const game = new TankBattleGame(canvas);

// Boot InputManager to ensure event listeners are active.
InputManager.getInstance(window);

game.start();
