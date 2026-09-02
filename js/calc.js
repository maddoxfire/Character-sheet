// Turns a character "build" (race/class/background choices + base ability
// scores) into a fully computed sheet: final abilities, saves, skills, AC,
// HP, spell slots, proficiencies, attacks. Pure functions -- no storage here.
const DND_CALC = (() => {
  const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"];

  const FULL_CASTER_SLOTS = [
    null,
    [2], [3], [4, 2], [4, 3], [4, 3, 2],
    [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
    [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
  ];
  const HALF_CASTER_SLOTS = [
    null,
    [], [2], [3], [3], [4, 2],
    [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2],
    [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2],
    [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2],
  ];
  // Pact Magic: [slot count, slot level] by warlock level.
  const PACT_SLOTS = [
    null,
    [1, 1], [2, 1], [2, 2], [2, 2], [2, 3],
    [2, 3], [2, 4], [2, 4], [2, 5], [2, 5],
    [3, 5], [3, 5], [3, 5], [3, 5], [3, 5],
    [3, 5], [4, 5], [4, 5], [4, 5], [4, 5],
  ];

  const RAGE_USES = (level) => (level >= 20 ? Infinity : level >= 17 ? 6 : level >= 12 ? 5 : level >= 6 ? 4 : level >= 3 ? 3 : 2);

  function abilityMod(score) {
    return Math.floor((score - 10) / 2);
  }
  function profBonus(level) {
    return Math.floor((level - 1) / 4) + 2;
  }
  function fmtMod(n) {
    return (n >= 0 ? "+" : "") + n;
  }

  function resolveRace(character) {
    if (!character.raceId) return null;
    const race = DND_STORE.findById(DND_STORE.getRaces(), character.raceId);
    if (!race) return null;
    const subrace = character.subraceId ? (race.subraces || []).find((s) => s.id === character.subraceId) : null;
    return { race, subrace };
  }

  function resolveClass(character) {
    if (!character.classId) return null;
    const cls = DND_STORE.findById(DND_STORE.getClasses(), character.classId);
    if (!cls) return null;
    const subclass = character.subclassId ? (cls.subclasses || []).find((s) => s.id === character.subclassId) : null;
    return { cls, subclass };
  }

  function resolveBackground(character) {
    if (!character.backgroundId) return null;
    return DND_STORE.findById(DND_STORE.getBackgrounds(), character.backgroundId);
  }

  function finalAbilityScores(character) {
    const base = { ...character.abilityScores };
    const { race, subrace } = resolveRace(character) || {};
    const bonuses = {};
    ABILITY_KEYS.forEach((k) => (bonuses[k] = 0));
    if (race) {
      for (const [k, v] of Object.entries(race.abilityBonuses || {})) bonuses[k] += v;
      if (race.abilityChoice && Array.isArray(character.abilityChoiceAssignments)) {
        character.abilityChoiceAssignments.forEach((k) => {
          if (bonuses[k] !== undefined) bonuses[k] += race.abilityChoice.amount;
        });
      }
      if (subrace) {
        for (const [k, v] of Object.entries(subrace.abilityBonuses || {})) bonuses[k] += v;
      }
    }
    const final = {};
    ABILITY_KEYS.forEach((k) => (final[k] = (base[k] || 10) + bonuses[k]));
    return { base, bonuses, final };
  }

  function collectFeaturesUpToLevel(featuresByLevel, level) {
    const out = [];
    for (let l = 1; l <= level; l++) {
      if (featuresByLevel[l]) out.push(...featuresByLevel[l].map((f) => ({ ...f, level: l })));
    }
    return out;
  }

  function spellSlotsFor(type, level) {
    if (type === "full") return FULL_CASTER_SLOTS[level] || [];
    if (type === "half") return HALF_CASTER_SLOTS[level] || [];
    if (type === "third") return HALF_CASTER_SLOTS[Math.max(1, level)] ? HALF_CASTER_SLOTS[Math.ceil(level * 2 / 3)] || [] : [];
    return [];
  }

  function computeSpellcasting(character, cls, subclass, abilities, level, prof) {
    let sc = cls.spellcasting;
    let sourceLevel = level;
    if (!sc && subclass && subclass.grantsSpellcasting) {
      sc = { ability: subclass.grantsSpellcasting.ability, type: subclass.grantsSpellcasting.type, known: true };
    }
    if (!sc) return null;
    const mod = abilityMod(abilities.final[sc.ability]);
    const saveDC = 8 + prof + mod;
    const attackMod = prof + mod;
    let slots = [];
    if (sc.type === "pact") {
      const [count, slotLevel] = PACT_SLOTS[level] || [0, 0];
      if (count > 0) slots = [{ level: slotLevel, total: count, isPact: true }];
    } else {
      const table = spellSlotsFor(sc.type, level);
      slots = table.map((total, idx) => ({ level: idx + 1, total })).filter((s) => s.total > 0);
    }
    return { ability: sc.ability, saveDC, attackMod, slots, type: sc.type };
  }

  function computeAC(character, abilities) {
    const dexMod = abilityMod(abilities.final.dex);
    const conMod = abilityMod(abilities.final.con);
    const wisMod = abilityMod(abilities.final.wis);
    let base = 10 + dexMod;
    let note = "Unarmored";
    const armor = character.armorId ? DND_STORE.findById(SRD_ARMOR, character.armorId) : null;
    if (armor) {
      const dexBonus = armor.dexMax === null ? dexMod : Math.min(dexMod, armor.dexMax);
      base = armor.baseAC + dexBonus;
      note = armor.name;
    } else if (character.classId === "barbarian") {
      base = 10 + dexMod + conMod;
      note = "Unarmored Defense (Con)";
    } else if (character.classId === "monk" && !character.hasShield) {
      base = 10 + dexMod + wisMod;
      note = "Unarmored Defense (Wis)";
    }
    if (character.hasShield) base += (SRD_SHIELD.acBonus || 2);
    base += character.acMiscBonus || 0;
    return { value: base, note };
  }

  function computeHp(character, cls, abilities, level) {
    const conMod = abilityMod(abilities.final.con);
    const hitDie = cls ? cls.hitDie : 8;
    let total = hitDie + conMod;
    for (let l = 2; l <= level; l++) {
      total += Math.max(1, Math.floor(hitDie / 2) + 1 + conMod);
    }
    return Math.max(1, total + (character.hpMiscBonus || 0));
  }

  function suggestedResources(classId, level, abilities) {
    const chaMod = abilityMod(abilities.final.cha);
    const out = [];
    switch (classId) {
      case "barbarian":
        out.push({ name: "Rage", max: RAGE_USES(level) === Infinity ? 99 : RAGE_USES(level), recovery: "long rest", note: RAGE_USES(level) === Infinity ? "unlimited" : "" });
        break;
      case "bard":
        out.push({ name: "Bardic Inspiration", max: Math.max(1, chaMod), recovery: "long rest" });
        break;
      case "cleric":
        out.push({ name: "Channel Divinity", max: level >= 18 ? 3 : level >= 6 ? 2 : 1, recovery: "short rest" });
        break;
      case "druid":
        out.push({ name: "Wild Shape", max: 2, recovery: "short rest" });
        break;
      case "monk":
        out.push({ name: "Ki Points", max: level, recovery: "short rest" });
        break;
      case "paladin":
        out.push({ name: "Lay on Hands", max: 5 * level, recovery: "long rest", isPool: true });
        out.push({ name: "Divine Sense", max: Math.max(1, 1 + chaMod), recovery: "long rest" });
        if (level >= 3) out.push({ name: "Channel Divinity", max: 1, recovery: "short rest" });
        break;
      case "sorcerer":
        out.push({ name: "Sorcery Points", max: level, recovery: "long rest", isPool: true });
        break;
      case "fighter":
        out.push({ name: "Second Wind", max: 1, recovery: "short rest" });
        if (level >= 2) out.push({ name: "Action Surge", max: level >= 17 ? 2 : 1, recovery: "short rest" });
        break;
      case "wizard":
        out.push({ name: "Arcane Recovery", max: 1, recovery: "long rest" });
        break;
      case "warlock":
        break;
      case "ranger":
        break;
      case "rogue":
        break;
    }
    return out.map((r) => ({ id: DND_STORE.uid("res"), ...r }));
  }

  function computeSheet(character) {
    const { race, subrace } = resolveRace(character) || {};
    const { cls, subclass } = resolveClass(character) || {};
    const background = resolveBackground(character);
    const level = character.level || 1;
    const abilities = finalAbilityScores(character);
    const prof = profBonus(level);

    const saveProfs = new Set((cls && cls.saveProficiencies) || []);
    const saves = {};
    ABILITY_KEYS.forEach((k) => {
      const p = saveProfs.has(k);
      saves[k] = { prof: p, mod: abilityMod(abilities.final[k]) + (p ? prof : 0) };
    });

    const bgSkills = new Set((background && background.skills) || []);
    const chosenSkills = new Set(character.skillProficiencies || []);
    const skills = DND_SKILLS.map((s) => {
      const p = bgSkills.has(s.name) || chosenSkills.has(s.name);
      return { ...s, prof: p, mod: abilityMod(abilities.final[s.ability]) + (p ? prof : 0) };
    });
    const perception = skills.find((s) => s.name === "Perception");
    const passivePerception = 10 + (perception ? perception.mod : 0);

    const ac = computeAC(character, abilities);
    const hp = computeHp(character, cls, abilities, level);
    const speed = (subrace && subrace.speedOverride) || (race && race.speed) || 30;
    const darkvision = (subrace && subrace.darkvisionOverride) || (race && race.darkvision) || 0;

    const classFeatures = cls ? collectFeaturesUpToLevel(cls.featuresByLevel, level) : [];
    const subclassFeatures = subclass ? collectFeaturesUpToLevel(subclass.featuresByLevel, level) : [];
    const raceTraits = race ? [...(race.traits || []), ...((subrace && subrace.traits) || [])] : [];

    const spellcasting = cls ? computeSpellcasting(character, cls, subclass, abilities, level, prof) : null;

    const attacks = (character.weapons || []).map((w) => {
      const weapon = w.custom ? w : DND_STORE.findById(SRD_WEAPONS, w.weaponId);
      if (!weapon) return null;
      const strMod = abilityMod(abilities.final.str);
      const dexMod = abilityMod(abilities.final.dex);
      let ability = "str";
      if (weapon.kind === "Ranged") ability = "dex";
      else if (weapon.finesse) ability = dexMod > strMod ? "dex" : "str";
      const abilMod = ability === "dex" ? dexMod : strMod;
      const weaponProfs = (cls && cls.weaponProf) || [];
      const proficient = w.proficient !== undefined ? w.proficient
        : weaponProfs.some((p) => p.startsWith(weapon.category) || p === weapon.name || p.includes(weapon.name));
      const toHit = abilMod + (proficient ? prof : 0) + (w.toHitBonus || 0);
      return {
        name: weapon.name, range: weapon.kind === "Ranged" ? "Ranged" : (weapon.properties || "").includes("Reach") ? "Melee (Reach)" : "Melee",
        toHit: fmtMod(toHit), damage: `${weapon.damage}${abilMod !== 0 ? fmtMod(abilMod) : ""}${w.damageBonus ? fmtMod(w.damageBonus) : ""}`,
        damageType: weapon.type, desc: weapon.properties || "",
      };
    }).filter(Boolean);

    return {
      character, race, subrace, cls, subclass, background,
      level, prof, abilities, saves, skills, passivePerception,
      ac, hp, speed, darkvision, initiative: abilityMod(abilities.final.dex),
      classFeatures, subclassFeatures, raceTraits, spellcasting, attacks,
    };
  }

  return {
    ABILITY_KEYS, abilityMod, profBonus, fmtMod,
    resolveRace, resolveClass, resolveBackground, finalAbilityScores,
    computeSheet, suggestedResources, spellSlotsFor,
    FULL_CASTER_SLOTS, HALF_CASTER_SLOTS, PACT_SLOTS,
  };
})();
