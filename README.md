# D&D Character Builder

A browser-based D&D 5e character builder and sheet. Create characters from
official races, classes, subclasses, and backgrounds, play with them using an
interactive tracked sheet, and extend the whole thing with your own homebrew
content.

No backend, no build step — plain HTML/CSS/JS. Everything is stored locally
in your browser (`localStorage`).

## Features

- **Character builder**: name, race/subrace, class/subclass, background,
  ability scores (standard array, point buy, or manual), skill proficiencies,
  and starting armor, with a live-computed preview (ability mods, AC, HP,
  proficiency bonus, spell save DC) as you build.
- **Bundled content**: all 9 core species (with iconic subraces), all 12
  classes with their PHB subclasses and full level 1-20 feature progressions,
  13 backgrounds, the full weapon and armor tables, ~34 feats, and a broad
  spell index.
- **Interactive character sheet**: click any ability, save, skill, or attack
  to roll it. Track HP (with temp HP and damage/heal buttons), hit dice,
  death saves, spell slots, and any class resource (Rage, Ki, Channel
  Divinity, Lay on Hands, etc. — auto-suggested at creation, and you can add
  your own). Short Rest / Long Rest buttons recharge the right resources.
  Editable equipment, coins, feats, magic items, personality, and notes.
- **Homebrew content**: add your own custom races, classes, backgrounds,
  feats, spells, and items from the Homebrew Content page. They show up
  right alongside official content in the builder. Export your homebrew as a
  JSON file to share with others, or import someone else's.

## Running locally

No build step required.

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` directly in a browser.

## Structure

- `index.html` — thin page shell; views render into `#app`
- `css/style.css` — theme and layout for every view
- `js/data/` — bundled reference content: skills, races, classes (incl.
  subclasses), backgrounds, equipment, feats, spells
- `js/store.js` — localStorage persistence for characters and homebrew
  content, plus merging homebrew into the bundled content lists
- `js/calc.js` — turns a character's build choices into computed stats
  (final ability scores, saves, skills, AC, HP, spell slots, attacks)
- `js/views/home.js` — character list / entry point
- `js/views/builder.js` — character creation & editing wizard
- `js/views/sheet.js` — the interactive character sheet
- `js/views/homebrew.js` — homebrew content manager (CRUD + import/export)
- `js/router.js`, `js/main.js` — a small hash-based router wiring it together
