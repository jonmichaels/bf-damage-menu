# Damage Context Menu — Black Flag / Tales of the Valiant

> **⚠️ Disclaimer:** This module was created by an AI coding agent (Hephaestus, via Hermes Agent) under the direction of Jon Michaels. While tested and functional, users should verify behavior in their own games before relying on it in critical sessions.

[![Foundry VTT](https://img.shields.io/badge/Foundry-v13-orange)](https://foundryvtt.com)
[![Black Flag](https://img.shields.io/badge/System-Black%20Flag%20%2F%20ToV-blue)](https://github.com/koboldpress/black-flag)

Adds a right-click context menu to Black Flag damage chat cards, allowing the GM to apply damage, healing, half damage, or double damage to selected tokens on the canvas.

## Installation

1. Go to **Add-on Modules** → **Install Module**
2. Paste the manifest URL: `https://github.com/jonmichaels/bf-damage-menu/releases/latest/download/module.json`
3. Click **Install**

## Requirements

- **Foundry VTT** v13+
- **Black Flag Roleplaying** (Tales of the Valiant) system v2.0+

## Usage

1. Roll damage for an attack or spell in the Black Flag system
2. Select one or more tokens on the canvas
3. Right-click the damage chat card
4. Choose from the context menu:

| Option | Multiplier | Effect |
|--------|-----------|--------|
| **Apply Damage** | 1× | Deals the rolled damage |
| **Apply as Healing** | -1× | Heals instead of damaging |
| **Apply Half Damage** | 0.5× | Applies half the rolled damage |
| **Apply Double Damage** | 2× | Applies double the rolled damage |

All options respect Black Flag's built-in damage pipeline (resistances, immunities, vulnerabilities, temp HP).

## License

MIT
