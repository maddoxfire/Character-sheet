// Character data extracted from Jaxen Ryder's MPMB character record sheet (PDF).
// Blank fields from the source PDF (equipment, personality, personal details, feats,
// magic items) are left empty here too -- they're editable in the website and saved
// to the browser via localStorage.

const CHARACTER = {
  name: "Jaxen Ryder",
  classLevel: "Paladin (Oath of the Crown)",
  level: 3,
  background: "Folk Hero",
  race: "Aasimar, Protector",
  xp: 900,
  xpNext: 2700,

  alignment: "",
  faith: "",
  gender: "",
  age: "",
  size: "Medium",
  height: "",
  weight: "",
  hair: "",
  eyes: "",
  skin: "",

  abilities: {
    str: 14, dex: 13, con: 14, int: 12, wis: 13, cha: 16,
  },

  proficiencyBonus: 2,

  saves: {
    str: { prof: false }, dex: { prof: false }, con: { prof: false },
    int: { prof: false }, wis: { prof: true }, cha: { prof: true },
  },
  saveNotes: "Immune to disease",

  skills: [
    { name: "Acrobatics", abbr: "Acr", ability: "dex", prof: false },
    { name: "Animal Handling", abbr: "Ani", ability: "wis", prof: true },
    { name: "Arcana", abbr: "Arc", ability: "int", prof: false },
    { name: "Athletics", abbr: "Ath", ability: "str", prof: false },
    { name: "Deception", abbr: "Dec", ability: "cha", prof: false },
    { name: "History", abbr: "His", ability: "int", prof: false },
    { name: "Insight", abbr: "Ins", ability: "wis", prof: false },
    { name: "Intimidation", abbr: "Inti", ability: "cha", prof: false },
    { name: "Investigation", abbr: "Inv", ability: "int", prof: false },
    { name: "Medicine", abbr: "Med", ability: "wis", prof: false },
    { name: "Nature", abbr: "Nat", ability: "int", prof: false },
    { name: "Perception", abbr: "Perc", ability: "wis", prof: false },
    { name: "Performance", abbr: "Perf", ability: "cha", prof: false },
    { name: "Persuasion", abbr: "Pers", ability: "cha", prof: false },
    { name: "Religion", abbr: "Rel", ability: "int", prof: false },
    { name: "Sleight of Hand", abbr: "Sle", ability: "dex", prof: false },
    { name: "Stealth", abbr: "Ste", ability: "dex", prof: false, disadvantage: true },
    { name: "Survival", abbr: "Sur", ability: "wis", prof: true },
  ],

  ac: 16,
  acNote: "Chain Mail",
  initiative: 1,
  speed: 30,
  speedEncumbered: 20,
  passivePerception: 11,

  hp: { max: 28 },
  hitDice: { die: "d10", total: 3 },

  senses: ["Darkvision 60 ft"],
  resistances: ["Necrotic", "Radiant"],

  languages: ["Common", "Celestial"],
  tools: ["Artisan's tools", "Vehicles (land)"],
  armorProf: ["Light Armor", "Medium Armor", "Heavy Armor", "Shields"],
  weaponProf: ["Simple Weapons", "Martial Weapons"],

  lifestyle: "Modest",
  lifestyleCost: "1 gp",

  attacks: [
    {
      name: "Longsword", prof: true, ability: "Str", range: "Melee",
      toHit: "+4", damage: "1d8+4", damageType: "Slashing",
      desc: "Versatile (1d10)",
    },
  ],

  spellcasting: {
    ability: "cha",
    saveDC: 13,
    attackMod: 5,
    slots: [{ level: 1, total: 3 }],
    cantrips: ["Light"],
    alwaysPrepared: [
      "Command", "Compelled Duel", "Warding Bond", "Zone of Truth",
      "Aura of Vitality", "Spirit Guardians", "Banishment",
      "Guardian of Faith", "Circle of Power", "Geas",
    ],
  },

  limitedFeatures: [
    { id: "divine-sense", name: "Divine Sense", max: 4, maxLabel: "1 + Cha modifier", recovery: "long rest" },
    { id: "lay-on-hands", name: "Lay on Hands", max: 15, recovery: "long rest", isPool: true },
    { id: "channel-divinity", name: "Channel Divinity", max: 1, recovery: "short rest" },
    { id: "healing-hands", name: "Healing Hands", max: 1, recovery: "long rest", note: "3 HP" },
    { id: "radiant-soul", name: "Radiant Soul", max: 1, recovery: "long rest", note: "+3 damage" },
  ],

  classFeatures: [
    {
      name: "Divine Sense", src: "Paladin 1, PHB 84", limit: "1 + Charisma modifier per long rest",
      lines: [
        "As an action, I sense celestials/fiends/undead/consecrated/desecrated within 60 ft",
        "Until the end of my next turn, I sense the type/location if it is not behind total cover",
      ],
    },
    {
      name: "Lay on Hands", src: "Paladin 1, PHB 84", limit: "15× per long rest",
      lines: [
        "As an action, I can use points in my pool to heal a touched, living creature's hit points",
        "I can neutralize poisons/diseases instead at a cost of 5 points per affliction",
      ],
    },
    {
      name: "Divine Smite", src: "Paladin 2, PHB 84",
      lines: [
        "When I hit someone in melee, I can expend spell slots to do 2d8 extra radiant damage",
        "This increases by +1d8 for each spell slot level above 1st and +1d8 against undead/fiends",
      ],
    },
    {
      name: "Dueling Fighting Style", src: "Paladin 2, PHB 84",
      lines: [
        "+2 to damage rolls when wielding a melee weapon in one hand and no other weapons",
      ],
    },
    {
      name: "Spellcasting", src: "Paladin 2, PHB 84",
      lines: [
        "I can cast prepared paladin spells, using Charisma as my spellcasting ability",
        "I can use a holy symbol as a spellcasting focus",
      ],
    },
    {
      name: "Divine Health", src: "Paladin 3, PHB 85",
      lines: ["I am immune to disease, thanks to the power of my faith"],
    },
    {
      name: "Channel Divinity", src: "Oath of the Crown 3, PHB 85", limit: "1× per short rest",
      lines: [],
    },
    {
      name: "Channel Divinity: Champion Challenge", src: "Oath of the Crown 3, SCAG 133",
      lines: [
        "I can compel any chosen creatures within 30 ft of me to make a Wisdom save",
        "If failed, a target is unable to willingly move more than 30 ft away from me",
        "The effect ends if I'm incapacitated, die, or it is moved more than 30 ft away from me",
      ],
    },
    {
      name: "Channel Divinity: Turn the Tide", src: "Oath of the Crown 3, SCAG 133",
      lines: [
        "As a bonus action, any chosen creatures within 30 ft that can hear me regain HP",
        "Each regain 1d6 + my Charisma modifier HP, up to half of its total HP",
      ],
    },
  ],

  racialTraits: [
    { name: "Protector Aasimar", lines: ["+1 Wisdom, +2 Charisma"] },
    { name: "Light Bearer", lines: ["I know the Light cantrip."] },
    { name: "Healing Hands", lines: ["As an action, once per long rest, I can touch to heal for my level in HP."] },
    {
      name: "Radiant Soul",
      lines: [
        "Once per long rest when I'm 3rd level, I can use an action to transform, gaining glimmer in my eyes and two incorporeal wings.",
        "For 1 minute or until I end it as a bonus action, I have 30 feet fly speed; once on my turn I can have one of my attacks or spells deal my level in extra radiant damage to one target.",
      ],
    },
  ],

  backgroundFeature: {
    name: "Rustic Hospitality",
    text: "Since I come from the ranks of the common folk, I fit in among them with ease. I can find a place to hide, rest, or recuperate among other commoners, unless I have shown myself to be a danger to them. They will shield me from the law or anyone else searching for me, though they will not risk their lives for me.",
  },

  background_history: "Jaxen Ryder spent his life wearing masks other people made for him.\n\nAt home, he was the perfect son—stoic, obedient, spiritual. His father, a pastor, preached fire and discipline, drilling into him that a “real man” was a leader, a provider, a defender of the faith. His mother prayed he’d be a blessing to the world. But what Jaxen heard was: don’t mess up. Don’t disappoint. Don’t be weak.\n\nAt school, he was the quarterback. The alpha. The guy who had it all figured out. But Jaxen only knew one way to stay on top: by keeping everyone else beneath him. Bullying was easy. Being vulnerable wasn’t.\n\nWhen he and his classmates were ripped into the D&D world, Jaxen didn’t land free—he landed back in chains.",

  // Left blank in the source sheet -- filled in via the website and saved locally.
  personality: { traits: "", ideals: "", bonds: "", flaws: "" },
  appearance: "",
  alliesOrganizations: "",
  enemies: "",
  feats: [],
  equipment: [],
  magicItems: [],
  coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  notes: "",
};
