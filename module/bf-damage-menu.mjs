class BFDamageMenu {
  static MODULE_NAME = "bf-damage-menu";

  static init() {
    console.log(`${BFDamageMenu.MODULE_NAME} | Initializing`);

    // Test 1: Does renderChatMessage work? (we know it does from RetroAdvBF)
    Hooks.on("renderChatMessage", (message, html) => {
      console.debug(`${BFDamageMenu.MODULE_NAME} | renderChatMessage fired | type=${message.type}`);
    });

    // Test 2: Does getChatMessageContextOptions fire?
    Hooks.on("getChatMessageContextOptions", (html, options) => {
      console.debug(`${BFDamageMenu.MODULE_NAME} | getChatMessageContextOptions FIRED`);
      console.debug(`${BFDamageMenu.MODULE_NAME} | html type:`, typeof html, html);
      console.debug(`${BFDamageMenu.MODULE_NAME} | options:`, options);
    });

    // Test 3: Maybe the hook name changed in v13?
    Hooks.on("getChatLogEntryContext", (html, options) => {
      console.debug(`${BFDamageMenu.MODULE_NAME} | getChatLogEntryContext FIRED`);
    });
  }

  static _extractDamages(message) {
    try {
      const rolls = message.rolls;
      if (!rolls?.length) return [];
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
      const numericRolls = rolls.filter(r => r instanceof Roll && typeof r.total === "number");
      if (!numericRolls.length) return [];
      const total = numericRolls.reduce((sum, r) => sum + r.total, 0);
      return [{ magical: false, rollType: "damage", type: undefined, value: total }];
    } catch (err) {
      console.error(`${BFDamageMenu.MODULE_NAME} | _extractDamages error:`, err);
      return [];
    }
  }

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
