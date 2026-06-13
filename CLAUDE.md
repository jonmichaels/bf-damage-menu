# bf-damage-menu — Foundry VTT Development Notes

## Purpose
- Adds right-click chat-message context options for applying rolled damage/healing to selected tokens.
- Primary target is Black Flag Roleplaying / Tales of the Valiant; generic numeric rolls and dnd5e-style `DamageRoll` cards are also supported where the runtime exposes compatible roll data.

## Runtime Targets
- Foundry v13 is the released target in `module.json` (`compatibility.verified: "13"`).
- Foundry v14 + Black Flag v3 compatibility work starts here. Use the locally configured v14 Foundry server/port from the active development environment; do not commit private Foundry hostnames or URLs.
- Local project: `/home/jon/projects/bf-damage-menu`.
- v14 module symlink: `/home/jon/foundryuserdata14/Data/modules/bf-damage-menu -> /home/jon/projects/bf-damage-menu`.

## Current Architecture
- Manifest: `module.json`.
- Entry point: `module/bf-damage-menu.mjs`.
- Main class: `BFDamageMenu`.
- Hook: `Hooks.on("getChatMessageContextOptions", ...)` registers four menu actions:
  - `BFDM.Damage.Apply` → multiplier `1`
  - `BFDM.Damage.Healing` → multiplier `-1`
  - `BFDM.Damage.Half` → multiplier `0.5`
  - `BFDM.Damage.Double` → multiplier `2`
- Damage extraction path:
  - Prefer runtime `CONFIG.Dice.DamageRoll` instances.
  - Fall back to summing generic numeric `Roll` totals.
- Application path: selected canvas tokens → `token.actor.applyDamage(damages, { multiplier, isDelta: true })`.

## Build / Test Commands
- No bundler/package setup currently; source is loaded directly by Foundry from `module/bf-damage-menu.mjs`.
- Basic static checks:
  - `node --check module/bf-damage-menu.mjs`
  - `python3 -m json.tool module.json >/dev/null`
- Live v14 checks should use Foundry MCP or `fvtt game script execute` where possible, then verify in the running Black Flag v3 test world.

## Black Flag / v14 Compatibility Work
- Do not assume Black Flag v3 damage data matches v2. Inspect live v14/BF v3 objects before changing extraction/application code.
- Key runtime contracts to verify:
  - `getChatMessageContextOptions` still fires for v14 chat cards.
  - `li.dataset.messageId` still resolves to `game.messages.get(...)`.
  - BF v3 damage rolls still use `CONFIG.Dice.DamageRoll` or expose a replacement class/shape.
  - Damage roll options still carry `damageType` and `magical`, or identify their new locations.
  - `Actor.applyDamage(damages, options)` still exists and accepts the current damage array shape.
  - Chat-card context menu groups/icons render correctly in Foundry v14.

## Reference Workflow
- Load/read this file before editing.
- Follow the global Foundry rule: reference before intuition. For Black Flag data model questions, use QMD docs in `software-projects` and live inspection.
- Useful QMD queries:
  - `Black Flag v3 damage roll applyDamage damage data model Foundry v14`
  - `Black Flag damage roll DamageRoll applyDamage actor damage array`
  - `Foundry v14 chat message context options getChatMessageContextOptions`
- Build/static-check before live testing; commit and push after meaningful changes.

## Known Pitfalls
- This module has no build step, so Foundry loads edited source immediately after world reload/cache refresh.
- Generic `/r` rolls intentionally produce untyped non-magical damage; do not remove this fallback while fixing Black Flag-specific cards.
- Keep changes narrow: first goal is v14/BF v3 compatibility, not UI redesign or extra damage features.
- If live UI behavior is visual or screenshot-driven, call `vision_analyze` before coding visual fixes.
