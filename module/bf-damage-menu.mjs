class BFDamageMenu {
  static MODULE_NAME = "bf-damage-menu";

  /* -------------------------------------------------- */

  static init() {
    console.log(`${BFDamageMenu.MODULE_NAME} | Initializing`);

    Hooks.on("getChatMessageContextOptions", (message, entries) => {
      // Guard: must have tokens selected on the canvas
      if (!canvas.tokens?.controlled.length) return;

      // Guard: must have rolls with numeric totals to apply
      const damages = BFDamageMenu._extractDamages(message);
      if (!damages.length) return;

      // Add menu entries
      entries.push(
        {
          name: "BFDM.Damage.Apply",
          icon: '<i class="fa-solid fa-heart-crack"></i>',
          group: "damage",
          callback: () => BFDamageMenu._applyDamage(message, 1)
        },
        {
          name: "BFDM.Damage.Healing",
          icon: '<i class="fa-solid fa-heart-circle-plus"></i>',
          group: "damage",
          callback: () => BFDamageMenu._applyDamage(message, -1)
        },
        {
          name: "BFDM.Damage.Half",
          icon: '<i class="fa-solid fa-heart-circle-minus"></i>',
          group: "damage",
          callback: () => BFDamageMenu._applyDamage(message, 0.5)
        },
        {
          name: "BFDM.Damage.Double",
          icon: '<i class="fa-solid fa-skull"></i>',
          group: "damage",
          callback: () => BFDamageMenu._applyDamage(message, 2)
        }
      );
    });
  }

  /* -------------------------------------------------- */

  /**
   * Extract damage values from a chat message's rolls.
   * Works with Black Flag DamageRoll instances AND core Foundry Roll instances
   * (e.g., /r 1d8 or /r 4d6). Returns aggregated damage descriptions.
   * @param {ChatMessage} message
   * @returns {DamageDescription[]}
   */
  static _extractDamages(message) {
    const rolls = message.rolls;
    if (!rolls?.length) return [];

    // Try BF's DamageRoll first (respects damage types, magical, resistance properties)
    const damageRolls = rolls.filter(r => r instanceof CONFIG.Dice.DamageRoll);
    if (damageRolls.length) {
      const aggregated = aggregateDamageRolls(damageRolls, { respectProperties: true });
      return aggregated.map(roll => ({
        magical: roll.options.magical === true,
        rollType: message.getFlag("black-flag", "roll.type") ?? "damage",
        type: roll.options.damageType,
        value: roll.total
      }));
    }

    // Fallback: any core Foundry Roll with a numeric total (e.g., /r 1d8, /r 4d6)
    const numericRolls = rolls.filter(r => r instanceof Roll && typeof r.total === "number");
    if (!numericRolls.length) return [];

    // Sum all numeric rolls into a single untyped damage value
    const total = numericRolls.reduce((sum, r) => sum + r.total, 0);
    return [{
      magical: false,
      rollType: "damage",
      type: undefined,
      value: total
    }];
  }

  /* -------------------------------------------------- */

  /**
   * Apply damage from a chat message to all controlled tokens.
   * @param {ChatMessage} message
   * @param {number} multiplier   1 = damage, -1 = healing, 0.5 = half, 2 = double
   */
  static async _applyDamage(message, multiplier) {
    const damages = BFDamageMenu._extractDamages(message);
    if (!damages.length) return;

    const options = { multiplier, isDelta: true };

    for (const token of canvas.tokens.controlled) {
      if (!token.actor?.isOwner) continue;
      await token.actor.applyDamage(damages, options);
    }
  }
}

Hooks.on("init", BFDamageMenu.init);
