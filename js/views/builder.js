const BuilderView = (() => {
  const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"];
  const ABILITY_LABELS = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };
  const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
  const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  const ALIGNMENTS = ["Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "True Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil"];

  let draft = null;
  let editing = false;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }
  function opt(value, label, selected) {
    return `<option value="${escapeHtml(value)}"${selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
  }

  function newDraft() {
    return {
      id: DND_STORE.uid("char"),
      name: "", playerName: "", level: 1, alignment: "",
      raceId: "", subraceId: "", abilityChoiceAssignments: [],
      classId: "", subclassId: "",
      backgroundId: "",
      abilityMethod: "standard",
      abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      standardArrayAssignment: {},
      skillProficiencies: [],
      armorId: "", hasShield: false,
      weapons: [], feats: [], equipment: [], magicItems: [],
      coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      cantripsKnown: [], spellsKnown: [], trackedResources: [],
      personalDetails: {}, personality: { traits: "", ideals: "", bonds: "", flaws: "" },
      appearance: "", alliesOrganizations: "", enemies: "", notes: "",
      background_history: "", xp: 0, xpNext: 300,
    };
  }

  function render(container, params) {
    editing = !!(params && params.id);
    if (editing) {
      const existing = DND_STORE.getCharacter(params.id);
      if (!existing) { container.innerHTML = `<div class="card"><p>Character not found.</p></div>`; return; }
      draft = JSON.parse(JSON.stringify(existing));
      draft.abilityMethod = draft.abilityMethod || "manual";
    } else {
      draft = newDraft();
    }
    container.innerHTML = template();
    wire();
    updatePreview();
  }

  function template() {
    const races = DND_STORE.getRaces();
    const classes = DND_STORE.getClasses();
    const backgrounds = DND_STORE.getBackgrounds();
    return `
    <div class="builder-wrap">
      <a href="#/" class="btn btn-ghost btn-small back-link">&larr; Characters</a>
      <h1>${editing ? "Edit Character" : "Create a Character"}</h1>
      <div class="builder-grid">
        <div class="builder-form">
          <div class="card">
            <h2>Basics</h2>
            <div class="form-row">
              <label>Character Name<input type="text" id="f-name" value="${escapeHtml(draft.name)}"></label>
              <label>Player Name<input type="text" id="f-player" value="${escapeHtml(draft.playerName)}"></label>
            </div>
            <div class="form-row">
              <label>Level<input type="number" id="f-level" min="1" max="20" value="${draft.level}"></label>
              <label>Alignment<select id="f-alignment">${opt("", "—")}${ALIGNMENTS.map((a) => opt(a, a, draft.alignment === a)).join("")}</select></label>
            </div>
          </div>

          <div class="card">
            <h2>Race</h2>
            <div class="form-row">
              <label>Race<select id="f-race">${opt("", "Choose a race…")}${races.map((r) => opt(r.id, `${r.name}${r.source === "homebrew" ? " (homebrew)" : ""}`, draft.raceId === r.id)).join("")}</select></label>
              <label id="subrace-wrap" hidden>Subrace<select id="f-subrace"></select></label>
            </div>
            <div id="race-ability-choice"></div>
            <div id="race-preview" class="preview-text"></div>
          </div>

          <div class="card">
            <h2>Class</h2>
            <div class="form-row">
              <label>Class<select id="f-class">${opt("", "Choose a class…")}${classes.map((c) => opt(c.id, `${c.name}${c.source === "homebrew" ? " (homebrew)" : ""}`, draft.classId === c.id)).join("")}</select></label>
              <label id="subclass-wrap" hidden>Subclass<select id="f-subclass"></select></label>
            </div>
            <div id="class-preview" class="preview-text"></div>
          </div>

          <div class="card">
            <h2>Background</h2>
            <select id="f-background">${opt("", "Choose a background…")}${backgrounds.map((b) => opt(b.id, `${b.name}${b.source === "homebrew" ? " (homebrew)" : ""}`, draft.backgroundId === b.id)).join("")}</select>
            <div id="background-preview" class="preview-text"></div>
          </div>

          <div class="card">
            <h2>Ability Scores</h2>
            <div class="form-row">
              <label>Method
                <select id="f-ability-method">
                  ${opt("standard", "Standard Array (15,14,13,12,10,8)", draft.abilityMethod === "standard")}
                  ${opt("pointbuy", "Point Buy (27 points)", draft.abilityMethod === "pointbuy")}
                  ${opt("manual", "Manual Entry", draft.abilityMethod === "manual")}
                </select>
              </label>
            </div>
            <div id="ability-inputs" class="ability-input-grid"></div>
            <p id="ability-method-note" class="note-line"></p>
          </div>

          <div class="card">
            <h2>Skills</h2>
            <p class="note-line">Background skills are granted automatically. Choose your class skills below.</p>
            <div id="skill-choice"></div>
          </div>

          <div class="card">
            <h2>Armor</h2>
            <div class="form-row">
              <label>Armor<select id="f-armor">${opt("", "Unarmored")}${SRD_ARMOR.map((a) => opt(a.id, `${a.name} (AC ${a.baseAC}, ${a.category})`, draft.armorId === a.id)).join("")}</select></label>
              <label class="checkbox-label"><input type="checkbox" id="f-shield" ${draft.hasShield ? "checked" : ""}> Shield (+2 AC)</label>
            </div>
            <p class="note-line">Weapons, equipment, spells, and feats can be added on the character sheet after creation.</p>
          </div>

          <button class="btn btn-large" id="create-btn">${editing ? "Save Changes" : "Create Character"}</button>
        </div>

        <aside class="builder-preview">
          <div class="card sticky-card">
            <h2>Preview</h2>
            <div id="preview-body"></div>
          </div>
        </aside>
      </div>
    </div>`;
  }

  function currentRace() { return draft.raceId ? DND_STORE.findById(DND_STORE.getRaces(), draft.raceId) : null; }
  function currentSubrace() {
    const r = currentRace();
    return r && draft.subraceId ? (r.subraces || []).find((s) => s.id === draft.subraceId) : null;
  }
  function currentClass() { return draft.classId ? DND_STORE.findById(DND_STORE.getClasses(), draft.classId) : null; }
  function currentSubclass() {
    const c = currentClass();
    return c && draft.subclassId ? (c.subclasses || []).find((s) => s.id === draft.subclassId) : null;
  }
  function currentBackground() { return draft.backgroundId ? DND_STORE.findById(DND_STORE.getBackgrounds(), draft.backgroundId) : null; }

  function renderRaceExtras() {
    const race = currentRace();
    const subraceWrap = document.getElementById("subrace-wrap");
    const subraceSel = document.getElementById("f-subrace");
    const choiceWrap = document.getElementById("race-ability-choice");
    const preview = document.getElementById("race-preview");
    choiceWrap.innerHTML = "";
    if (!race) { subraceWrap.hidden = true; preview.innerHTML = ""; return; }

    if (race.subraces && race.subraces.length) {
      subraceWrap.hidden = false;
      subraceSel.innerHTML = opt("", "Choose…") + race.subraces.map((s) => opt(s.id, s.name, draft.subraceId === s.id)).join("");
    } else {
      subraceWrap.hidden = true;
      draft.subraceId = "";
    }

    if (race.abilityChoice) {
      const count = race.abilityChoice.count;
      const excluded = race.abilityChoice.exclude || [];
      const options = ABILITY_KEYS.filter((k) => !excluded.includes(k));
      choiceWrap.innerHTML = `<p class="note-line">Choose ${count} abilities to increase by ${race.abilityChoice.amount}:</p>
        <div class="checkbox-row">${options.map((k) => `<label class="checkbox-label"><input type="checkbox" class="race-ability-pick" value="${k}" ${draft.abilityChoiceAssignments.includes(k) ? "checked" : ""}> ${ABILITY_LABELS[k]}</label>`).join("")}</div>`;
      choiceWrap.querySelectorAll(".race-ability-pick").forEach((cb) => {
        cb.addEventListener("change", () => {
          const picked = [...choiceWrap.querySelectorAll(".race-ability-pick:checked")].map((c) => c.value);
          if (picked.length > count) { cb.checked = false; return; }
          draft.abilityChoiceAssignments = picked;
          updatePreview();
        });
      });
    }

    const traits = [...(race.traits || []), ...((currentSubrace() && currentSubrace().traits) || [])];
    preview.innerHTML = `<p>${escapeHtml(traits.map((t) => t.name).join(", "))}</p>`;
  }

  function renderClassExtras() {
    const cls = currentClass();
    const subclassWrap = document.getElementById("subclass-wrap");
    const subclassSel = document.getElementById("f-subclass");
    const preview = document.getElementById("class-preview");
    if (!cls) { subclassWrap.hidden = true; preview.innerHTML = ""; renderSkillChoice(); return; }
    const showSubclass = cls.subclasses && cls.subclasses.length && draft.level >= (cls.subclassLevel || 1);
    subclassWrap.hidden = !showSubclass;
    if (showSubclass) {
      subclassSel.innerHTML = opt("", "Choose…") + cls.subclasses.map((s) => opt(s.id, s.name, draft.subclassId === s.id)).join("");
    } else {
      draft.subclassId = "";
    }
    preview.innerHTML = `<p>Hit Die: d${cls.hitDie} · Saves: ${cls.saveProficiencies.map((k) => k.toUpperCase()).join(", ")}${cls.spellcasting ? ` · Spellcasting: ${ABILITY_LABELS[cls.spellcasting.ability]} (${cls.spellcasting.type} caster)` : ""}</p>`;
    renderSkillChoice();
  }

  function renderBackgroundExtras() {
    const bg = currentBackground();
    document.getElementById("background-preview").innerHTML = bg ? `<p>Skills: ${bg.skills.join(", ")} · Feature: ${escapeHtml(bg.feature.name)}</p>` : "";
    renderSkillChoice();
  }

  function renderSkillChoice() {
    const wrap = document.getElementById("skill-choice");
    const cls = currentClass();
    const bg = currentBackground();
    const bgSkills = bg ? bg.skills : [];
    if (!cls) { wrap.innerHTML = `<p class="note-line">Choose a class first.</p>`; return; }
    const count = cls.skillChoice.count;
    draft.skillProficiencies = (draft.skillProficiencies || []).filter((s) => cls.skillChoice.options.includes(s));
    wrap.innerHTML = `<p class="note-line">Choose ${count}:</p><div class="checkbox-row">
      ${cls.skillChoice.options.map((s) => {
        const lockedByBg = bgSkills.includes(s);
        return `<label class="checkbox-label"><input type="checkbox" class="class-skill-pick" value="${escapeHtml(s)}" ${lockedByBg ? "checked disabled" : draft.skillProficiencies.includes(s) ? "checked" : ""}> ${escapeHtml(s)}${lockedByBg ? " (background)" : ""}</label>`;
      }).join("")}
    </div>`;
    wrap.querySelectorAll(".class-skill-pick:not(:disabled)").forEach((cb) => {
      cb.addEventListener("change", () => {
        const picked = [...wrap.querySelectorAll(".class-skill-pick:checked:not(:disabled)")].map((c) => c.value);
        if (picked.length > count) { cb.checked = false; return; }
        draft.skillProficiencies = picked;
        updatePreview();
      });
    });
  }

  function renderAbilityInputs() {
    const wrap = document.getElementById("ability-inputs");
    const note = document.getElementById("ability-method-note");
    wrap.innerHTML = "";
    if (draft.abilityMethod === "standard") {
      note.textContent = "Assign each value to a different ability.";
      ABILITY_KEYS.forEach((k) => {
        const used = Object.entries(draft.standardArrayAssignment).filter(([kk]) => kk !== k).map(([, v]) => v);
        const label = document.createElement("label");
        label.textContent = ABILITY_LABELS[k];
        const sel = document.createElement("select");
        sel.innerHTML = opt("", "—") + STANDARD_ARRAY.map((v) => opt(v, v, draft.standardArrayAssignment[k] === v)).join("");
        [...sel.options].forEach((o) => { if (o.value && used.includes(Number(o.value))) o.disabled = true; });
        sel.addEventListener("change", () => {
          draft.standardArrayAssignment[k] = sel.value ? Number(sel.value) : undefined;
          draft.abilityScores[k] = sel.value ? Number(sel.value) : 8;
          renderAbilityInputs(); updatePreview();
        });
        label.appendChild(sel);
        wrap.appendChild(label);
      });
    } else if (draft.abilityMethod === "pointbuy") {
      let spent = 0;
      ABILITY_KEYS.forEach((k) => { spent += POINT_BUY_COST[draft.abilityScores[k]] ?? 0; });
      note.textContent = `Points spent: ${spent} / 27`;
      ABILITY_KEYS.forEach((k) => {
        const label = document.createElement("label");
        label.textContent = ABILITY_LABELS[k];
        const sel = document.createElement("select");
        sel.innerHTML = Object.keys(POINT_BUY_COST).map((v) => opt(v, v, draft.abilityScores[k] === Number(v))).join("");
        sel.addEventListener("change", () => {
          draft.abilityScores[k] = Number(sel.value);
          renderAbilityInputs(); updatePreview();
        });
        label.appendChild(sel);
        wrap.appendChild(label);
      });
    } else {
      note.textContent = "Enter scores directly (3-20).";
      ABILITY_KEYS.forEach((k) => {
        const label = document.createElement("label");
        label.textContent = ABILITY_LABELS[k];
        const input = document.createElement("input");
        input.type = "number"; input.min = "1"; input.max = "30";
        input.value = draft.abilityScores[k];
        input.addEventListener("input", () => { draft.abilityScores[k] = parseInt(input.value, 10) || 10; updatePreview(); });
        label.appendChild(input);
        wrap.appendChild(label);
      });
    }
  }

  function updatePreview() {
    const computed = DND_CALC.computeSheet(draft);
    const wrap = document.getElementById("preview-body");
    wrap.innerHTML = `
      <div class="preview-grid">
        ${ABILITY_KEYS.map((k) => `<div class="preview-ability"><span>${k.toUpperCase()}</span><strong>${computed.abilities.final[k]}</strong><em>${DND_CALC.fmtMod(DND_CALC.abilityMod(computed.abilities.final[k]))}</em></div>`).join("")}
      </div>
      <p><strong>AC:</strong> ${computed.ac.value} (${escapeHtml(computed.ac.note)})</p>
      <p><strong>HP:</strong> ${computed.hp}</p>
      <p><strong>Speed:</strong> ${computed.speed} ft</p>
      <p><strong>Proficiency Bonus:</strong> ${DND_CALC.fmtMod(computed.prof)}</p>
      ${computed.spellcasting ? `<p><strong>Spell Save DC:</strong> ${computed.spellcasting.saveDC}</p>` : ""}`;
  }

  function wire() {
    document.getElementById("f-name").addEventListener("input", (e) => (draft.name = e.target.value));
    document.getElementById("f-player").addEventListener("input", (e) => (draft.playerName = e.target.value));
    document.getElementById("f-level").addEventListener("input", (e) => { draft.level = Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)); renderClassExtras(); updatePreview(); });
    document.getElementById("f-alignment").addEventListener("change", (e) => (draft.alignment = e.target.value));

    document.getElementById("f-race").addEventListener("change", (e) => { draft.raceId = e.target.value; draft.subraceId = ""; draft.abilityChoiceAssignments = []; renderRaceExtras(); updatePreview(); });
    document.getElementById("f-subrace").addEventListener("change", (e) => { draft.subraceId = e.target.value; updatePreview(); });

    document.getElementById("f-class").addEventListener("change", (e) => { draft.classId = e.target.value; draft.subclassId = ""; renderClassExtras(); updatePreview(); });
    document.getElementById("f-subclass").addEventListener("change", (e) => { draft.subclassId = e.target.value; updatePreview(); });

    document.getElementById("f-background").addEventListener("change", (e) => { draft.backgroundId = e.target.value; renderBackgroundExtras(); updatePreview(); });

    document.getElementById("f-ability-method").addEventListener("change", (e) => {
      draft.abilityMethod = e.target.value;
      draft.abilityScores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
      draft.standardArrayAssignment = {};
      renderAbilityInputs(); updatePreview();
    });

    document.getElementById("f-armor").addEventListener("change", (e) => { draft.armorId = e.target.value; updatePreview(); });
    document.getElementById("f-shield").addEventListener("change", (e) => { draft.hasShield = e.target.checked; updatePreview(); });

    document.getElementById("create-btn").addEventListener("click", () => {
      if (!draft.name.trim()) { alert("Give your character a name first."); return; }
      DND_STORE.upsertCharacter(draft);
      window.location.hash = `#/character/${draft.id}`;
    });

    renderRaceExtras();
    renderClassExtras();
    renderBackgroundExtras();
    renderAbilityInputs();
  }

  return { render };
})();
