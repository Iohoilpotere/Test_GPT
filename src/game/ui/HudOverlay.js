export class HudOverlay {
  constructor() {
    this.root = this.#createRoot();
    const playerPanel = this.#createPanel('Carro alleato');
    this.playerHealthValue = playerPanel.querySelector('.hud-stat__value[data-stat="health"]');
    this.playerSpeedValue = playerPanel.querySelector('.hud-stat__value[data-stat="speed"]');
    this.root.appendChild(playerPanel);
  }

  #createRoot() {
    const root = document.createElement('section');
    root.id = 'hud-overlay';
    document.body.appendChild(root);
    return root;
  }

  #createPanel(title) {
    const panel = document.createElement('article');
    panel.className = 'hud-panel';

    const heading = document.createElement('h2');
    heading.className = 'hud-panel__title';
    heading.textContent = title;
    panel.appendChild(heading);

    const healthRow = this.#createStatRow('HP', 'health');
    const speedRow = this.#createStatRow('Velocità', 'speed');
    panel.appendChild(healthRow);
    panel.appendChild(speedRow);
    return panel;
  }

  #createStatRow(label, key) {
    const row = document.createElement('div');
    row.className = 'hud-stat';
    row.dataset.stat = key;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'hud-stat__label';
    labelSpan.textContent = label;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'hud-stat__value';
    valueSpan.dataset.stat = key;
    valueSpan.textContent = '—';

    row.appendChild(labelSpan);
    row.appendChild(valueSpan);
    return row;
  }

  updatePlayerStats({ health, maxHealth, speed }) {
    if (typeof health === 'number' && typeof maxHealth === 'number') {
      const current = Math.max(0, Math.round(health));
      const max = Math.max(0, Math.round(maxHealth));
      this.playerHealthValue.textContent = `${current} / ${max}`;
      this.playerHealthValue.parentElement.style.setProperty(
        '--hud-health-ratio',
        max > 0 ? (current / max).toFixed(2) : '0'
      );
    }
    if (typeof speed === 'number') {
      this.playerSpeedValue.textContent = `${speed.toFixed(1)} u/s`;
    }
  }
}
