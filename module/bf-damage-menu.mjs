class BFDamageMenu {
  static MODULE_NAME = "bf-damage-menu";

  static init() {
    console.log(`${BFDamageMenu.MODULE_NAME} | init START`);

    // --- Hook 1: renderChatMessage (known working in v13) ---
    Hooks.on("renderChatMessage", (message, html, data) => {
      console.log(`${BFDamageMenu.MODULE_NAME} | renderChatMessage FIRED | type=${message.type}`);
    });

    // --- Hook 2: getChatMessageContextOptions ---
    Hooks.on("getChatMessageContextOptions", (app, options) => {
      console.log(`${BFDamageMenu.MODULE_NAME} | getChatMessageContextOptions FIRED | tokens=${canvas.tokens?.controlled?.length ?? "N/A"}`);
      if (!canvas.tokens?.controlled.length) return;
      options.push(
        {
          name: "BFDM.Damage.Apply",
          icon: '<i class="fa-solid fa-heart-crack"></i>',
          group: "damage",
          condition: li => BFDamageMenu._canApply(li),
          callback: li => BFDamageMenu._applyFromLi(li, 1)
        },
        {
          name: "BFDM.Damage.Healing",
          icon: '<i class="fa-solid fa-heart-circle-plus"></i>',
          group: "damage",
          condition: li => BFDamageMenu._canApply(li),
          callback: li => BFDamageMenu._applyFromLi(li, -1)
        },
        {
          name: "BFDM.Damage.Half",
          icon: '<i class="fa-solid fa-heart-circle-minus"></i>',
          group: "damage",
          condition: li => BFDamageMenu._canApply(li),
          callback: li => BFDamageMenu._applyFromLi(li, 0.5)
        },
        {
          name: "BFDM.Damage.Double",
          icon: '<i class="fa-solid fa-skull"></i>',
          group: "damage",
          condition: li => BFDamageMenu._canApply(li),
          callback: li => BFDamageMenu._applyFromLi(li, 2)
        }
      );
      console.log(`${BFDamageMenu.MODULE_NAME} | Pushed 4 items, total options=${options.length}`);
    });

    // --- DIRECT TEST: call the hook ourselves to prove registration ---
    console.log(`${BFDamageMenu.MODULE_NAME} | Direct test: calling Hooks.callAll("getChatMessageContextOptions")`);
    Hooks.callAll("getChatMessageContextOptions", {constructor:{name:"TestApp"}}, []);
    console.log(`${BFDamageMenu.MODULE_NAME} | Direct test DONE`);

    console.log(`${BFDamageMenu.MODULE_NAME} | init COMPLETE`);
  }

  /* -------------------------------------------------- */

  static _canApply(li) {
    if (!canvas.tokens?.controlled.length) return false;
    const message = game.messages.get(li.dataset.messageId);
    if (!message) return false;
    return BFDamageMenu._extractDamages(message).length > 0;
  }

  /* -------------------------------------------------- */

  static async _applyFromLi(li, multiplier) {
    const message = game.messages.get(li.dataset.messageId);
    if (!message) return;
    await BFDamageMenu._applyDamage(message, multiplier);
  }

  /* -------------------------------------------------- */

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

  /* -------------------------------------------------- */

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
