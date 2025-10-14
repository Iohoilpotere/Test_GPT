export class TankStatusManager {
  constructor({ tank, highlight }) {
    this.tank = tank;
    this.highlight = highlight;
    this.effects = [];
  }

  addEffect(effect) {
    if (!effect?.id) {
      throw new Error('Effect requires an id.');
    }
    const existingIndex = this.effects.findIndex((entry) => entry.id === effect.id);
    if (existingIndex >= 0) {
      const existing = this.effects[existingIndex];
      existing.remaining = effect.duration;
      existing.data?.onRefresh?.(this.tank, existing.context);
      return existing;
    }

    const entry = {
      id: effect.id,
      duration: effect.duration,
      remaining: effect.duration,
      data: effect,
      context: {}
    };

    effect.onApply?.(this.tank, entry.context);
    if (effect.highlight) {
      this.highlight?.applyHighlight({
        id: `effect-${effect.id}`,
        color: effect.highlight.color,
        intensity: effect.highlight.intensity ?? 1.4,
        duration: effect.duration,
        pulse: effect.highlight.pulse ?? false
      });
    }

    this.effects.push(entry);
    return entry;
  }

  update(delta) {
    for (const entry of Array.from(this.effects)) {
      entry.data.onUpdate?.(this.tank, entry.context, delta);
      if (entry.duration && entry.duration > 0) {
        entry.remaining = Math.max(0, entry.remaining - delta);
        if (entry.remaining === 0) {
          entry.data.onRemove?.(this.tank, entry.context);
          if (entry.data.highlight) {
            this.highlight?.clearHighlight(`effect-${entry.id}`);
          }
          this.effects.splice(this.effects.indexOf(entry), 1);
        }
      }
    }
  }

  modifyIncomingDamage(amount) {
    return this.effects.reduce((acc, entry) => {
      if (typeof entry.data.modifyIncomingDamage === 'function') {
        return entry.data.modifyIncomingDamage(acc, this.tank, entry.context);
      }
      return acc;
    }, amount);
  }

  clearAll() {
    for (const entry of this.effects) {
      entry.data.onRemove?.(this.tank, entry.context);
      if (entry.data.highlight) {
        this.highlight?.clearHighlight(`effect-${entry.id}`);
      }
    }
    this.effects = [];
  }
}
