# Jaxen Ryder — Character Sheet

An interactive, single-page D&D 5e character sheet website, built from a
MorePurpleMoreBetter (MPMB) character record sheet PDF for **Jaxen Ryder**,
a 3rd-level Protector Aasimar Paladin (Oath of the Crown).

## Features

- Ability scores, saving throws, and skills — click any of them to roll a d20 check in the browser.
- Combat tracker: AC, initiative, speed, HP (with damage/heal buttons and a temp HP pool), hit dice, and death saves.
- Attacks table with click-to-roll attack and damage rolls.
- Spellcasting block with spell slot tracking.
- Limited-use class/racial feature tracker (Divine Sense, Lay on Hands, Channel Divinity, Healing Hands, Radiant Soul) with Short Rest / Long Rest buttons that recharge the right resources.
- Class features, racial traits, and background feature as expandable detail cards.
- Editable personal details, personality traits, appearance, equipment, coins, feats, magic items, and notes — fields left blank on the original sheet, saved locally in your browser (`localStorage`) as you fill them in.
- Responsive layout for desktop and mobile, plus a print stylesheet.

## Running locally

No build step is required — it's plain HTML/CSS/JS.

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` directly in a browser.

## Structure

- `index.html` — page layout/markup
- `css/style.css` — theme and layout
- `js/character.js` — the character's static data, extracted from the source PDF
- `js/app.js` — rendering, dice rolling, and localStorage-backed state
