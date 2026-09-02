// Core species (races) and their subraces. Ability bonuses use ability keys
// (str/dex/con/int/wis/cha). "choice" bonuses let the player pick which
// abilities receive the listed bonus (e.g. Half-Elf, Half-Orc-like flexible rules).
const SRD_RACES = [
  {
    id: "human", name: "Human", source: "PHB",
    abilityBonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    size: "Medium", speed: 30, darkvision: 0,
    languages: ["Common"], languageChoice: 1,
    traits: [],
    subraces: [],
  },
  {
    id: "elf", name: "Elf", source: "PHB",
    abilityBonuses: { dex: 2 },
    size: "Medium", speed: 30, darkvision: 60,
    languages: ["Common", "Elvish"], languageChoice: 0,
    traits: [
      { name: "Fey Ancestry", text: "Advantage on saves against being charmed, and magic can't put me to sleep." },
      { name: "Trance", text: "I don't need to sleep; instead I meditate for 4 hours a day to gain the benefit of a long rest." },
      { name: "Keen Senses", text: "Proficiency in the Perception skill." },
    ],
    subraces: [
      {
        id: "high-elf", name: "High Elf",
        abilityBonuses: { int: 1 },
        traits: [
          { name: "Cantrip", text: "I know one wizard cantrip of my choice; Intelligence is my spellcasting ability for it." },
          { name: "Extra Language", text: "I can speak, read, and write one extra language of my choice." },
        ],
      },
      {
        id: "wood-elf", name: "Wood Elf",
        abilityBonuses: { wis: 1 },
        speedOverride: 35,
        traits: [
          { name: "Mask of the Wild", text: "I can attempt to hide even when only lightly obscured by natural phenomena." },
        ],
      },
    ],
  },
  {
    id: "dwarf", name: "Dwarf", source: "PHB",
    abilityBonuses: { con: 2 },
    size: "Medium", speed: 25, darkvision: 60,
    languages: ["Common", "Dwarvish"], languageChoice: 0,
    traits: [
      { name: "Dwarven Resilience", text: "Advantage on saves against poison, and resistance to poison damage." },
      { name: "Dwarven Combat Training", text: "Proficiency with battleaxe, handaxe, light hammer, and warhammer." },
      { name: "Tool Proficiency", text: "Proficiency with one type of artisan's tools of my choice." },
      { name: "Stonecunning", text: "Double proficiency bonus on History checks related to stonework." },
    ],
    subraces: [
      {
        id: "hill-dwarf", name: "Hill Dwarf",
        abilityBonuses: { wis: 1 },
        traits: [{ name: "Dwarven Toughness", text: "My hit point maximum increases by 1, and by 1 again every time I gain a level." }],
      },
      {
        id: "mountain-dwarf", name: "Mountain Dwarf",
        abilityBonuses: { str: 2 },
        traits: [{ name: "Dwarven Armor Training", text: "Proficiency with light and medium armor." }],
      },
    ],
  },
  {
    id: "halfling", name: "Halfling", source: "PHB",
    abilityBonuses: { dex: 2 },
    size: "Small", speed: 25, darkvision: 0,
    languages: ["Common", "Halfling"], languageChoice: 0,
    traits: [
      { name: "Lucky", text: "When I roll a 1 on an attack roll, ability check, or saving throw, I can reroll it and must use the new roll." },
      { name: "Brave", text: "Advantage on saves against being frightened." },
      { name: "Halfling Nimbleness", text: "I can move through the space of any creature that is larger than me." },
    ],
    subraces: [
      {
        id: "lightfoot-halfling", name: "Lightfoot Halfling",
        abilityBonuses: { cha: 1 },
        traits: [{ name: "Naturally Stealthy", text: "I can attempt to hide even when obscured only by a creature at least one size larger than me." }],
      },
      {
        id: "stout-halfling", name: "Stout Halfling",
        abilityBonuses: { con: 1 },
        traits: [{ name: "Stout Resilience", text: "Advantage on saves against poison, and resistance to poison damage." }],
      },
    ],
  },
  {
    id: "dragonborn", name: "Dragonborn", source: "PHB",
    abilityBonuses: { str: 2, cha: 1 },
    size: "Medium", speed: 30, darkvision: 0,
    languages: ["Common", "Draconic"], languageChoice: 0,
    traits: [
      { name: "Draconic Ancestry", text: "I choose a dragon type, which determines the damage type of my breath weapon and damage resistance (e.g. Red: fire)." },
      { name: "Breath Weapon", text: "As an action, I can exhale destructive energy in a line or cone (DC 8 + Con mod + prof bonus, half damage on success), once per short/long rest, scaling with level." },
      { name: "Damage Resistance", text: "Resistance to the damage type associated with my draconic ancestry." },
    ],
    subraces: [],
  },
  {
    id: "gnome", name: "Gnome", source: "PHB",
    abilityBonuses: { int: 2 },
    size: "Small", speed: 25, darkvision: 60,
    languages: ["Common", "Gnomish"], languageChoice: 0,
    traits: [
      { name: "Gnome Cunning", text: "Advantage on all Intelligence, Wisdom, and Charisma saving throws against magic." },
    ],
    subraces: [
      {
        id: "forest-gnome", name: "Forest Gnome",
        abilityBonuses: { dex: 1 },
        traits: [
          { name: "Natural Illusionist", text: "I know the minor illusion cantrip; Intelligence is my spellcasting ability for it." },
          { name: "Speak with Small Beasts", text: "I can communicate simple ideas with Small or smaller beasts." },
        ],
      },
      {
        id: "rock-gnome", name: "Rock Gnome",
        abilityBonuses: { con: 1 },
        traits: [
          { name: "Artificer's Lore", text: "Add double proficiency bonus on History checks about magic items, alchemical items, or technological devices." },
          { name: "Tinker", text: "Proficiency with artisan's tools (tinker's tools); I can build tiny clockwork devices." },
        ],
      },
    ],
  },
  {
    id: "half-elf", name: "Half-Elf", source: "PHB",
    abilityBonuses: { cha: 2 },
    abilityChoice: { count: 2, amount: 1, exclude: ["cha"] },
    size: "Medium", speed: 30, darkvision: 60,
    languages: ["Common", "Elvish"], languageChoice: 1,
    traits: [
      { name: "Fey Ancestry", text: "Advantage on saves against being charmed, and magic can't put me to sleep." },
      { name: "Skill Versatility", text: "Proficiency in two skills of my choice." },
    ],
    subraces: [],
  },
  {
    id: "half-orc", name: "Half-Orc", source: "PHB",
    abilityBonuses: { str: 2, con: 1 },
    size: "Medium", speed: 30, darkvision: 60,
    languages: ["Common", "Orc"], languageChoice: 0,
    traits: [
      { name: "Menacing", text: "Proficiency in the Intimidation skill." },
      { name: "Relentless Endurance", text: "When reduced to 0 HP but not killed outright, I can drop to 1 HP instead. Once per long rest." },
      { name: "Savage Attacks", text: "When I score a critical hit with a melee weapon, I roll one additional weapon damage die." },
    ],
    subraces: [],
  },
  {
    id: "tiefling", name: "Tiefling", source: "PHB",
    abilityBonuses: { cha: 2, int: 1 },
    size: "Medium", speed: 30, darkvision: 60,
    languages: ["Common", "Infernal"], languageChoice: 0,
    traits: [
      { name: "Hellish Resistance", text: "Resistance to fire damage." },
      { name: "Infernal Legacy", text: "I know the thaumaturgy cantrip. At 3rd level I can cast hellish rebuke once per long rest, at 5th level darkness once per long rest; Charisma is my spellcasting ability for these." },
    ],
    subraces: [],
  },
];
