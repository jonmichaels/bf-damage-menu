class BFDamageMenu {
  static MODULE_NAME = "bf-damage-menu";

  static init() {
    Hooks.on("getChatMessageContextOptions", (app, options) => {
      options.push(
        BFDamageMenu._contextMenuEntry("BFDM.Damage.Apply", '<i class="fa-solid fa-heart-crack"></i>', 1),
        BFDamageMenu._contextMenuEntry("BFDM.Damage.Healing", '<i class="fa-solid fa-heart-circle-plus"></i>', -1),
        BFDamageMenu._contextMenuEntry("BFDM.Damage.Half", '<i class="fa-solid fa-heart-circle-minus"></i>', 0.5),
        BFDamageMenu._contextMenuEntry("BFDM.Damage.Double", '<i class="fa-solid fa-skull"></i>', 2)
      );
    });
  }

  /* -------------------------------------------------- */

  static _contextMenuEntry(label, icon, multiplier) {
    const entry = { icon, group: "damage" };
    if ( game.release?.generation >= 14 ) {
      entry.label = label;
      entry.visible = target => BFDamageMenu._canApply(target);
      entry.onClick = (event, target) => BFDamageMenu._applyFromLi(target, multiplier);
    } else {
      entry.name = label;
      entry.condition = li => BFDamageMenu._canApply(li);
      entry.callback = li => BFDamageMenu._applyFromLi(li, multiplier);
    }
    return entry;
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

      // Black Flag / ToV DamageRoll instances
      if (CONFIG.Dice?.DamageRoll) {
        const damageRolls = rolls.filter(r => r instanceof CONFIG.Dice.DamageRoll);
        if (damageRolls.length) {
          return damageRolls.map(roll => ({
            magical: roll.options.magical === true,
            rollType: message.getFlag("black-flag", "roll.type") ?? "damage",
            type: roll.options.damageType,
            value: roll.total
          }));
        }
      }

      // Generic numeric rolls (e.g., /r d20, /r 4d6)
      const numericRolls = rolls.filter(r => r instanceof Roll && typeof r.total === "number");
      if (!numericRolls.length) return [];
      const total = numericRolls.reduce((sum, r) => sum + r.total, 0);
      return [{ magical: false, rollType: "damage", type: undefined, value: total }];
    } catch (err) {
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
