class BFDamageMenu {
  static MODULE_NAME = "bf-damage-menu";

  /* -------------------------------------------------- */

  static init() {
    console.log(`${BFDamageMenu.MODULE_NAME} | Initializing`);

    Hooks.on("getChatMessageContextOptions", (html, options) => {
      console.debug(`${BFDamageMenu.MODULE_NAME} | hook fired`);

      const li = html[0] || html;
      const messageId = li.dataset?.messageId;
      console.debug(`${BFDamageMenu.MODULE_NAME} | messageId=${messageId}`);

      if (!messageId) return;

      const message = game.messages.get(messageId);
      if (!message) return;

      console.debug(`${BFDamageMenu.MODULE_NAME} | message type=${message.type} rolls=${message.rolls?.length} tokens=${canvas.tokens?.controlled.length}`);

      // Guard: must have tokens selected on the canvas
      if (!canvas.tokens?.controlled.length) return;

      // Guard: must have applicable rolls
      const damages = BFDamageMenu._extractDamages(message);
      console.debug(`${BFDamageMenu.MODULE_NAME} | damages=${damages.length}`);
      if (!damages.length) return;

      options.push(
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
   * Works with Black Flag DamageRoll AND core Foundry Roll.
   */
  static _extractDamages(message) {
    try {
      const rolls = message.rolls;
      if (!rolls?.length) return [];

      // Try BF's DamageRoll first
      if (CONFIG.Dice?.DamageRoll) {
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
      }

      // Fallback: any core Foundry Roll with a numeric total
      const numericRolls = rolls.filter(r => r instanceof Roll && typeof r.total === "number");
      if (!numericRolls.length) return [];

      const total = numericRolls.reduce((sum, r) => sum + r.total, 0);
      return [{
        magical: false,
        rollType: "damage",
        type: undefined,
        value: total
      }];
    } catch (err) {
      console.error(`${BFDamageMenu.MODULE_NAME} | _extractDamages error:`, err);
      return [];
    }
  }

  /* -------------------------------------------------- */

  /**
   * Apply damage from a chat message to all controlled tokens.
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
