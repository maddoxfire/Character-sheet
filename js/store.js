// Local storage for characters and homebrew (custom) content. Everything lives
// in the browser; homebrew can be exported/imported as JSON files so people can
// share their custom races, classes, backgrounds, feats, spells, and items.
const DND_STORE = (() => {
  const CHAR_KEY = "dnd-builder:characters";
  const HOMEBREW_KEY = "dnd-builder:homebrew";

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function emptyHomebrew() {
    return { races: [], classes: [], backgrounds: [], feats: [], spells: [], items: [] };
  }

  function loadHomebrew() {
    try {
      const raw = localStorage.getItem(HOMEBREW_KEY);
      if (!raw) return emptyHomebrew();
      const parsed = JSON.parse(raw);
      return { ...emptyHomebrew(), ...parsed };
    } catch (e) {
      console.warn("Could not load homebrew library", e);
      return emptyHomebrew();
    }
  }

  function saveHomebrew(hb) {
    localStorage.setItem(HOMEBREW_KEY, JSON.stringify(hb));
  }

  function loadCharacters() {
    try {
      const raw = localStorage.getItem(CHAR_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("Could not load characters", e);
      return [];
    }
  }

  function saveCharacters(list) {
    localStorage.setItem(CHAR_KEY, JSON.stringify(list));
  }

  function getCharacter(id) {
    return loadCharacters().find((c) => c.id === id) || null;
  }

  function upsertCharacter(character) {
    const list = loadCharacters();
    const idx = list.findIndex((c) => c.id === character.id);
    character.updatedAt = Date.now();
    if (idx === -1) {
      character.createdAt = character.createdAt || Date.now();
      list.push(character);
    } else {
      list[idx] = character;
    }
    saveCharacters(list);
    return character;
  }

  function deleteCharacter(id) {
    saveCharacters(loadCharacters().filter((c) => c.id !== id));
  }

  // ---- Merged content lookups (SRD + homebrew) ----
  function withSource(list, source) {
    return list.map((item) => ({ ...item, source }));
  }

  function getRaces() {
    const hb = loadHomebrew();
    return [...withSource(SRD_RACES, "srd"), ...withSource(hb.races, "homebrew")];
  }
  function getClasses() {
    const hb = loadHomebrew();
    return [...withSource(SRD_CLASSES, "srd"), ...withSource(hb.classes, "homebrew")];
  }
  function getBackgrounds() {
    const hb = loadHomebrew();
    return [...withSource(SRD_BACKGROUNDS, "srd"), ...withSource(hb.backgrounds, "homebrew")];
  }
  function getFeats() {
    const hb = loadHomebrew();
    return [...withSource(SRD_FEATS, "srd"), ...withSource(hb.feats, "homebrew")];
  }
  function getSpells() {
    const hb = loadHomebrew();
    return [...withSource(SRD_SPELLS, "srd"), ...withSource(hb.spells, "homebrew")];
  }
  function getItems() {
    const hb = loadHomebrew();
    return withSource(hb.items, "homebrew");
  }
  function findById(list, id) {
    return list.find((x) => x.id === id) || null;
  }

  // ---- Homebrew CRUD ----
  function addHomebrewEntry(category, entry) {
    const hb = loadHomebrew();
    if (!entry.id) entry.id = uid("hb-" + category.slice(0, -1));
    entry.createdAt = Date.now();
    hb[category].push(entry);
    saveHomebrew(hb);
    return entry;
  }

  function updateHomebrewEntry(category, id, updater) {
    const hb = loadHomebrew();
    const idx = hb[category].findIndex((x) => x.id === id);
    if (idx === -1) return null;
    hb[category][idx] = { ...hb[category][idx], ...updater };
    saveHomebrew(hb);
    return hb[category][idx];
  }

  function deleteHomebrewEntry(category, id) {
    const hb = loadHomebrew();
    hb[category] = hb[category].filter((x) => x.id !== id);
    saveHomebrew(hb);
  }

  function exportHomebrew() {
    return JSON.stringify(loadHomebrew(), null, 2);
  }

  function exportHomebrewEntry(category, id) {
    const hb = loadHomebrew();
    const entry = findById(hb[category], id);
    return entry ? JSON.stringify({ [category]: [entry] }, null, 2) : null;
  }

  function importHomebrew(jsonText, { merge = true } = {}) {
    const incoming = JSON.parse(jsonText);
    const hb = merge ? loadHomebrew() : emptyHomebrew();
    let added = 0;
    for (const category of ["races", "classes", "backgrounds", "feats", "spells", "items"]) {
      if (!Array.isArray(incoming[category])) continue;
      for (const entry of incoming[category]) {
        if (!entry.id) entry.id = uid("hb-" + category.slice(0, -1));
        // Avoid id collisions by renaming on conflict rather than overwriting.
        if (hb[category].some((x) => x.id === entry.id)) {
          entry.id = uid("hb-" + category.slice(0, -1));
        }
        hb[category].push(entry);
        added++;
      }
    }
    saveHomebrew(hb);
    return added;
  }

  return {
    uid,
    loadCharacters, saveCharacters, getCharacter, upsertCharacter, deleteCharacter,
    loadHomebrew, saveHomebrew,
    getRaces, getClasses, getBackgrounds, getFeats, getSpells, getItems, findById,
    addHomebrewEntry, updateHomebrewEntry, deleteHomebrewEntry,
    exportHomebrew, exportHomebrewEntry, importHomebrew,
  };
})();
