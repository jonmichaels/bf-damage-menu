class BFDamageMenu {
  static MODULE_NAME = "bf-damage-menu";

  /* -------------------------------------------------- */

  static init() {
    console.log(`${BFDamageMenu.MODULE_NAME} | Initializing`);

    Hooks.on("getChatMessageContextOptions", (message, entries) => {
      // Guard: must be a damage roll in the Black Flag system
      if (message.getFlag("black-flag", "roll.type") !== "damage") return;

      // Guard: must have tokens selected on the canvas
      if (!canvas.tokens?.controlled.length) return;

      // Guard: must have damage rolls to apply
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
   * Extract damage descriptions from a chat message's rolls.
   * Mirrors BlackFlagChatMessage._renderDamageUI pattern.
   * @param {ChatMessage} message
   * @returns {DamageDescription[]}
   */
  static _extractDamages(message) {
    const damageRolls = message.rolls.filter(r => r instanceof CONFIG.Dice.DamageRoll);
    if (!damageRolls.length) return [];

    const aggregated = aggregateDamageRolls(damageRolls, { respectProperties: true });
    return aggregated.map(roll => ({
      magical: roll.options.magical === true,
      rollType: message.getFlag("black-flag", "roll.type") ?? "damage",
      type: roll.options.damageType,
      value: roll.total
    }));
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
    if (message.flags["black-flag"]?.originatingMessage) {
      options.originatingMessage = message;
    }

    for (const token of canvas.tokens.controlled) {
      if (!token.actor?.isOwner) continue;
      await token.actor.applyDamage(damages, options);
    }
  }
}

Hooks.on("init", BFDamageMenu.init);
