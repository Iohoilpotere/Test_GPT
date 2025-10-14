import { GlobalEventBus } from '../../core/events/EventBus.js';
import { UIEvents } from './UIEvents.js';

export class LoadoutMenu {
  constructor({ tankPresets, weaponPresets, defaultTankId, defaultWeaponId }) {
    this.tankPresets = tankPresets;
    this.weaponPresets = weaponPresets;
    this.root = this.#createRoot();

    const tankSection = this.#createSection('Carri', Object.values(tankPresets), (id) => {
      this.markTankSelection(id);
      GlobalEventBus.publish(UIEvents.SELECT_TANK, id);
    });
    const weaponSection = this.#createSection('Armi', Object.values(weaponPresets), (id) => {
      this.markWeaponSelection(id);
      GlobalEventBus.publish(UIEvents.SELECT_WEAPON, id);
    });

    this.tankButtons = tankSection.buttons;
    this.weaponButtons = weaponSection.buttons;
    this.tankDetails = tankSection.details;
    this.weaponDetails = weaponSection.details;

    this.root.appendChild(tankSection.container);
    this.root.appendChild(weaponSection.container);

    this.markTankSelection(defaultTankId);
    this.markWeaponSelection(defaultWeaponId);
  }

  #createRoot() {
    const root = document.createElement('aside');
    root.id = 'loadout-menu';
    document.body.appendChild(root);
    return root;
  }

  #createSection(title, presets, onSelect) {
    const container = document.createElement('section');
    container.className = 'loadout-section';

    const heading = document.createElement('h2');
    heading.textContent = title;
    container.appendChild(heading);

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'loadout-buttons';
    container.appendChild(buttonGroup);

    const buttons = new Map();
    presets.forEach((preset) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'loadout-button';
      button.dataset.presetId = preset.id;

      const titleSpan = document.createElement('span');
      titleSpan.className = 'loadout-button__title';
      titleSpan.textContent = preset.label;

      const subtitle = document.createElement('span');
      subtitle.className = 'loadout-button__subtitle';
      subtitle.textContent = preset.description;

      button.appendChild(titleSpan);
      button.appendChild(subtitle);

      button.addEventListener('click', () => onSelect(preset.id));

      buttonGroup.appendChild(button);
      buttons.set(preset.id, button);
    });

    const details = document.createElement('div');
    details.className = 'loadout-details';
    container.appendChild(details);

    return { container, buttons, details };
  }

  markTankSelection(tankId) {
    if (!tankId || !this.tankButtons.has(tankId)) return;
    this.#markSelection(this.tankButtons, tankId);
    const preset = this.tankPresets[tankId];
    this.#renderTankDetails(preset);
  }

  markWeaponSelection(weaponId) {
    if (!weaponId || !this.weaponButtons.has(weaponId)) return;
    this.#markSelection(this.weaponButtons, weaponId);
    const preset = this.weaponPresets[weaponId];
    this.#renderWeaponDetails(preset);
  }

  #markSelection(map, selectedId) {
    map.forEach((button, id) => {
      if (id === selectedId) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  #renderTankDetails(preset) {
    this.tankDetails.innerHTML = '';
    const title = document.createElement('h3');
    title.textContent = `Carro selezionato: ${preset.label}`;
    const description = document.createElement('p');
    description.className = 'loadout-details__description';
    description.textContent = preset.description;

    const list = document.createElement('ul');
    list.className = 'stat-list';
    this.#appendStat(list, 'Salute', `${preset.stats.salute} HP`);
    this.#appendStat(list, 'Armatura', `${preset.stats.armatura}`);
    this.#appendStat(list, 'Velocità max', `${preset.stats.velocita} u/s`);
    this.#appendStat(list, 'Manovrabilità', `${preset.stats.manovrabilita}`);

    this.tankDetails.appendChild(title);
    this.tankDetails.appendChild(description);
    this.tankDetails.appendChild(list);
  }

  #renderWeaponDetails(preset) {
    this.weaponDetails.innerHTML = '';
    const title = document.createElement('h3');
    title.textContent = `Arma selezionata: ${preset.label}`;
    const description = document.createElement('p');
    description.className = 'loadout-details__description';
    description.textContent = preset.description;

    const list = document.createElement('ul');
    list.className = 'stat-list';
    this.#appendStat(list, 'Danno', `${preset.stats.danno}`);
    this.#appendStat(list, 'Rateo di fuoco', `${preset.stats.rateo} colpi/s`);
    this.#appendStat(list, 'Raggio di effetto', `${preset.stats.raggio} m`);
    this.#appendStat(list, 'Velocità proiettile', `${preset.stats.velocitaProiettile} u/s`);

    this.weaponDetails.appendChild(title);
    this.weaponDetails.appendChild(description);
    this.weaponDetails.appendChild(list);
  }

  #appendStat(list, label, value) {
    const item = document.createElement('li');
    const statLabel = document.createElement('span');
    statLabel.textContent = label;
    const statValue = document.createElement('span');
    statValue.textContent = value;
    item.appendChild(statLabel);
    item.appendChild(statValue);
    list.appendChild(item);
  }
}
