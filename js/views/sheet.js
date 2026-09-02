const SheetView = (() => {
  const ABILITY_LABELS = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };
  let character = null;
  let computed = null;
  let saveTimer = null;

  function fmtMod(n) { return (n >= 0 ? "+" : "") + n; }
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => DND_STORE.upsertCharacter(character), 150);
  }

  function recompute() {
    computed = DND_CALC.computeSheet(character);
  }

  function ensureTracker() {
    character.tracker = character.tracker || {};
    const t = character.tracker;
    if (t.hp === undefined) t.hp = { current: computed.hp, temp: 0 };
    if (t.hitDiceUsed === undefined) t.hitDiceUsed = 0;
    if (!t.deathSaves) t.deathSaves = { success: [false, false, false], fail: [false, false, false] };
    if (!t.spellSlotsUsed) t.spellSlotsUsed = {};
    if (!t.resourceUsed) t.resourceUsed = {};
    if (!t.resourcePool) t.resourcePool = {};
    character.trackedResources = character.trackedResources || [];
    character.trackedResources.forEach((r) => {
      if (r.isPool && t.resourcePool[r.id] === undefined) t.resourcePool[r.id] = r.max;
      if (!r.isPool && t.resourceUsed[r.id] === undefined) t.resourceUsed[r.id] = 0;
    });
    character.weapons = character.weapons || [];
    character.feats = character.feats || [];
    character.equipment = character.equipment || [];
    character.magicItems = character.magicItems || [];
    character.coins = character.coins || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
    character.cantripsKnown = character.cantripsKnown || [];
    character.spellsKnown = character.spellsKnown || [];
    character.personalDetails = character.personalDetails || {};
    character.personality = character.personality || { traits: "", ideals: "", bonds: "", flaws: "" };
  }

  function rollD20(mod, label) {
    const roll = 1 + Math.floor(Math.random() * 20);
    const total = roll + mod;
    toast(label, `${total}`, `(d20: ${roll} ${fmtMod(mod)}${roll === 20 ? " ✦ nat 20!" : roll === 1 ? " ✦ nat 1" : ""})`);
  }
  function rollDamage(diceExpr, label) {
    const m = String(diceExpr).match(/(\d+)d(\d+)\s*([+-]\s*\d+)?/i);
    if (!m) return;
    const count = parseInt(m[1], 10), die = parseInt(m[2], 10);
    const bonus = m[3] ? parseInt(m[3].replace(/\s/g, ""), 10) : 0;
    const rolls = [];
    let total = bonus;
    for (let i = 0; i < count; i++) { const r = 1 + Math.floor(Math.random() * die); rolls.push(r); total += r; }
    toast(label, `${total}`, `(${rolls.join(", ")}${bonus ? " " + fmtMod(bonus) : ""})`);
  }
  function toast(label, total, detail) {
    const log = document.getElementById("roll-log");
    if (!log) return;
    const el = document.createElement("div");
    el.className = "roll-toast";
    el.innerHTML = `${escapeHtml(label)} <span class="roll-total">${total}</span><div style="font-size:0.7rem;opacity:0.75;">${detail}</div>`;
    log.appendChild(el);
    setTimeout(() => el.remove(), 4500);
  }

  function render(container, params) {
    character = DND_STORE.getCharacter(params.id);
    if (!character) {
      container.innerHTML = `<div class="card"><p>Character not found.</p><a href="#/" class="btn">Back to characters</a></div>`;
      return;
    }
    recompute();
    ensureTracker();
    container.innerHTML = template();
    wire();
  }

  function template() {
    const c = computed;
    const raceName = c.race ? c.race.name + (c.subrace ? ` (${c.subrace.name})` : "") : "No race chosen";
    const className = c.cls ? `${c.cls.name}${c.subclass ? ` (${c.subclass.name})` : ""}` : "No class chosen";
    return `
    <div id="roll-log" class="roll-log" aria-live="polite"></div>
    <header class="sheet-header">
      <div class="header-main">
        <a href="#/" class="btn btn-ghost btn-small back-link">&larr; Characters</a>
        <h1 id="char-name-display">${escapeHtml(character.name || "Unnamed")}</h1>
        <div class="header-sub">
          <span class="pill pill-accent">${c.level} ${escapeHtml(className)}</span>
          <span class="pill">${escapeHtml(character.backgroundLabel || (c.background ? c.background.name : ""))}</span>
          <span class="pill">${escapeHtml(raceName)}</span>
        </div>
      </div>
      <div class="header-xp">
        <div class="xp-box">
          <label>Experience</label>
          <div><input type="number" id="xp" class="xp-input" value="${character.xp || 0}"> / <input type="number" id="xp-next" class="xp-input" value="${character.xpNext || 300}"></div>
        </div>
        <div class="header-actions">
          <a href="#/character/${character.id}/edit" class="btn btn-ghost">Edit Build</a>
          <button id="short-rest-btn" class="btn btn-ghost">Short Rest</button>
          <button id="long-rest-btn" class="btn btn-ghost">Long Rest</button>
        </div>
      </div>
    </header>

    <main class="sheet-grid">
      <section class="col col-left">
        <div class="card">
          <h2>Ability Scores</h2>
          <div id="abilities" class="abilities-grid"></div>
        </div>
        <div class="card">
          <h2>Saving Throws</h2>
          <div id="saves" class="saves-list"></div>
        </div>
        <div class="card">
          <h2>Skills</h2>
          <div id="skills" class="skills-list"></div>
          <p class="note-line">Passive Perception: <strong>${c.passivePerception}</strong></p>
        </div>
        <div class="card">
          <h2>Senses &amp; Proficiencies</h2>
          <p><strong>Darkvision:</strong> ${c.darkvision ? c.darkvision + " ft" : "—"}</p>
          <p><strong>Armor:</strong> ${(c.cls ? c.cls.armorProf : []).join(", ") || "—"}</p>
          <p><strong>Weapons:</strong> ${(c.cls ? c.cls.weaponProf : []).join(", ") || "—"}</p>
          <p><strong>Tools:</strong> ${[c.cls ? (c.cls.toolProf || []).join(", ") : "", c.background ? c.background.tools : ""].filter(Boolean).join(", ") || "—"}</p>
          <p><strong>Languages:</strong> ${(c.race ? c.race.languages : []).join(", ") || "—"}${c.background && c.background.languages ? ` (+${c.background.languages} of choice)` : ""}</p>
        </div>
      </section>

      <section class="col col-center">
        <div class="card combat-card">
          <h2>Combat</h2>
          <div class="combat-stats">
            <div class="stat-box"><label>Armor Class</label><div class="stat-value">${c.ac.value}</div><div class="stat-note">${escapeHtml(c.ac.note)}</div></div>
            <div class="stat-box"><label>Initiative</label><div class="stat-value">${fmtMod(c.initiative)}</div></div>
            <div class="stat-box"><label>Speed</label><div class="stat-value">${c.speed} ft</div></div>
            <div class="stat-box"><label>Proficiency</label><div class="stat-value">${fmtMod(c.prof)}</div></div>
          </div>
          <div class="hp-tracker">
            <div class="hp-row">
              <label>Hit Points</label>
              <div class="hp-controls">
                <button class="btn btn-small" id="hp-minus-5">-5</button>
                <button class="btn btn-small" id="hp-minus">-1</button>
                <input type="number" id="hp-current" class="hp-input">
                <span class="hp-slash">/</span>
                <span id="hp-max" class="hp-max">${c.hp}</span>
                <button class="btn btn-small" id="hp-plus">+1</button>
                <button class="btn btn-small" id="hp-plus-5">+5</button>
              </div>
              <div class="hp-bar-wrap"><div id="hp-bar" class="hp-bar"></div></div>
            </div>
            <div class="hp-row"><label for="hp-temp">Temp HP</label><input type="number" id="hp-temp" class="hp-input hp-input-temp" min="0"></div>
            <div class="hp-row"><label>Hit Dice (d${c.cls ? c.cls.hitDie : 8})</label><div id="hit-dice" class="pip-row"></div></div>
            <div class="hp-row">
              <label>Death Saves</label>
              <div class="death-saves">
                <div class="death-save-group"><span class="death-label success">Successes</span><div id="death-success" class="pip-row"></div></div>
                <div class="death-save-group"><span class="death-label failure">Failures</span><div id="death-fail" class="pip-row"></div></div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h2>Attacks</h2>
          <table class="attacks-table">
            <thead><tr><th>Name</th><th>Range</th><th>To Hit</th><th>Damage</th><th>Type</th><th>Notes</th><th></th></tr></thead>
            <tbody id="attacks-body"></tbody>
          </table>
          <button class="btn btn-ghost" id="add-weapon">+ Add Weapon</button>
        </div>

        ${c.spellcasting ? `
        <div class="card">
          <h2>Spellcasting</h2>
          <div class="spell-stats">
            <div class="stat-box small"><label>Ability</label><div class="stat-value">${ABILITY_LABELS[c.spellcasting.ability]}</div></div>
            <div class="stat-box small"><label>Save DC</label><div class="stat-value">${c.spellcasting.saveDC}</div></div>
            <div class="stat-box small"><label>Attack Mod</label><div class="stat-value">${fmtMod(c.spellcasting.attackMod)}</div></div>
          </div>
          <div id="cantrips-known"></div>
          <div id="spells-known"></div>
          <div id="spell-slots"></div>
        </div>` : ""}

        <div class="card">
          <h2>Tracked Resources</h2>
          <div id="tracked-resources"></div>
          <button class="btn btn-ghost" id="add-resource">+ Add Resource</button>
        </div>
      </section>

      <section class="col col-right">
        <div class="card"><h2>Class Features</h2><div id="class-features" class="feature-list"></div></div>
        ${c.subclassFeatures.length ? `<div class="card"><h2>${escapeHtml((c.subclass && c.subclass.name) || "Subclass")} Features</h2><div id="subclass-features" class="feature-list"></div></div>` : ""}
        <div class="card"><h2>Racial Traits</h2><div id="racial-traits" class="feature-list"></div></div>
        ${c.background ? `<div class="card"><h2>Background Feature</h2><div id="background-feature" class="feature-list"></div></div>` : ""}
      </section>
    </main>

    <main class="sheet-grid-full">
      <section class="card">
        <h2>Personal Details</h2>
        <div class="details-grid" id="personal-details"></div>
      </section>
      <section class="card">
        <h2>Personality</h2>
        <div class="personality-grid">
          <label>Personality Traits<textarea id="pt-traits" rows="3"></textarea></label>
          <label>Ideals<textarea id="pt-ideals" rows="3"></textarea></label>
          <label>Bonds<textarea id="pt-bonds" rows="3"></textarea></label>
          <label>Flaws<textarea id="pt-flaws" rows="3"></textarea></label>
        </div>
      </section>
      <section class="card">
        <h2>Background &amp; History</h2>
        <textarea id="background-history" rows="6" class="prose-input"></textarea>
      </section>
      <section class="card">
        <h2>Appearance, Allies &amp; Enemies</h2>
        <label>Appearance<textarea id="appearance" rows="2"></textarea></label>
        <label>Allies &amp; Organizations<textarea id="allies" rows="2"></textarea></label>
        <label>Enemies<textarea id="enemies" rows="2"></textarea></label>
      </section>
      <section class="card">
        <h2>Equipment &amp; Coins</h2>
        <div class="coins-row" id="coins-row"></div>
        <table class="equipment-table"><thead><tr><th>Item</th><th>Qty</th><th>Weight</th><th></th></tr></thead><tbody id="equipment-body"></tbody></table>
        <button class="btn btn-ghost" id="add-equipment">+ Add Item</button>
      </section>
      <section class="card">
        <h2>Feats &amp; Magic Items</h2>
        <div class="two-col">
          <div><h3>Feats</h3><ul id="feats-list" class="editable-list"></ul><button class="btn btn-ghost" id="add-feat">+ Add Feat</button></div>
          <div><h3>Magic Items</h3><ul id="magic-items-list" class="editable-list"></ul><button class="btn btn-ghost" id="add-magic-item">+ Add Item</button></div>
        </div>
      </section>
      <section class="card">
        <h2>Notes</h2>
        <textarea id="notes" rows="4"></textarea>
      </section>
    </main>
    <footer class="sheet-footer">
      <p>Character data stored locally in your browser.</p>
      <button id="delete-btn" class="btn btn-danger-ghost">Delete Character</button>
    </footer>`;
  }

  function renderAbilities() {
    const wrap = document.getElementById("abilities");
    wrap.innerHTML = "";
    DND_CALC.ABILITY_KEYS.forEach((k) => {
      const score = computed.abilities.final[k];
      const mod = DND_CALC.abilityMod(score);
      const box = document.createElement("div");
      box.className = "ability-box";
      box.innerHTML = `<div class="ability-name">${ABILITY_LABELS[k]}</div><div class="ability-mod">${fmtMod(mod)}</div><div class="ability-score">${score}</div>`;
      box.addEventListener("click", () => rollD20(mod, `${ABILITY_LABELS[k]} Check`));
      wrap.appendChild(box);
    });
  }

  function renderSaves() {
    const wrap = document.getElementById("saves");
    wrap.innerHTML = "";
    DND_CALC.ABILITY_KEYS.forEach((k) => {
      const s = computed.saves[k];
      const row = document.createElement("div");
      row.className = "row-item";
      row.innerHTML = `<span class="prof-dot ${s.prof ? "filled" : ""}"></span><span class="row-name">${ABILITY_LABELS[k]} Save</span><span class="row-mod">${fmtMod(s.mod)}</span>`;
      row.addEventListener("click", () => rollD20(s.mod, `${ABILITY_LABELS[k]} Save`));
      wrap.appendChild(row);
    });
  }

  function renderSkills() {
    const wrap = document.getElementById("skills");
    wrap.innerHTML = "";
    computed.skills.forEach((s) => {
      const row = document.createElement("div");
      row.className = "row-item";
      row.innerHTML = `<span class="prof-dot ${s.prof ? "filled" : ""}"></span><span class="row-name">${s.name} <span class="row-tag">(${ABILITY_LABELS[s.ability]})</span></span><span class="row-mod">${fmtMod(s.mod)}</span>`;
      row.addEventListener("click", () => rollD20(s.mod, s.name));
      wrap.appendChild(row);
    });
  }

  function clampHp() {
    const t = character.tracker;
    t.hp.current = Math.max(0, Math.min(computed.hp, t.hp.current));
    t.hp.temp = Math.max(0, t.hp.temp || 0);
  }

  function renderHp() {
    clampHp();
    document.getElementById("hp-current").value = character.tracker.hp.current;
    document.getElementById("hp-temp").value = character.tracker.hp.temp;
    const pct = Math.round((character.tracker.hp.current / computed.hp) * 100);
    const bar = document.getElementById("hp-bar");
    bar.style.width = pct + "%";
    bar.style.background = pct <= 25 ? "linear-gradient(90deg,#a8283a,#c25a68)" : pct <= 50 ? "linear-gradient(90deg,#b8860b,#d4a017)" : "linear-gradient(90deg,#3f7d4f,#6fa877)";
  }

  function renderHitDice() {
    const wrap = document.getElementById("hit-dice");
    wrap.innerHTML = "";
    for (let i = 0; i < computed.level; i++) {
      const used = i < character.tracker.hitDiceUsed;
      const pip = document.createElement("div");
      pip.className = "pip hd" + (used ? " filled" : "");
      pip.addEventListener("click", () => {
        character.tracker.hitDiceUsed = used ? character.tracker.hitDiceUsed - 1 : Math.min(computed.level, character.tracker.hitDiceUsed + 1);
        renderHitDice(); persist();
      });
      wrap.appendChild(pip);
    }
  }

  function renderDeathSaves() {
    const sWrap = document.getElementById("death-success");
    const fWrap = document.getElementById("death-fail");
    sWrap.innerHTML = ""; fWrap.innerHTML = "";
    character.tracker.deathSaves.success.forEach((filled, i) => {
      const pip = document.createElement("div");
      pip.className = "pip" + (filled ? " filled success" : "");
      pip.addEventListener("click", () => { character.tracker.deathSaves.success[i] = !filled; renderDeathSaves(); persist(); });
      sWrap.appendChild(pip);
    });
    character.tracker.deathSaves.fail.forEach((filled, i) => {
      const pip = document.createElement("div");
      pip.className = "pip" + (filled ? " filled failure" : "");
      pip.addEventListener("click", () => { character.tracker.deathSaves.fail[i] = !filled; renderDeathSaves(); persist(); });
      fWrap.appendChild(pip);
    });
  }

  function renderAttacks() {
    const body = document.getElementById("attacks-body");
    body.innerHTML = "";
    computed.attacks.forEach((atk, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(atk.name)}</td><td>${atk.range}</td>
        <td class="clickable">${atk.toHit}</td><td class="clickable">${escapeHtml(atk.damage)}</td>
        <td>${escapeHtml(atk.damageType || "")}</td><td>${escapeHtml(atk.desc || "")}</td>
        <td><button class="row-remove">✕</button></td>`;
      tr.children[2].addEventListener("click", () => rollD20(parseInt(atk.toHit, 10), `${atk.name} — Attack`));
      tr.children[3].addEventListener("click", () => rollDamage(atk.damage, `${atk.name} — Damage`));
      tr.querySelector(".row-remove").addEventListener("click", () => {
        character.weapons.splice(idx, 1); recompute(); renderAttacks(); persist();
      });
      body.appendChild(tr);
    });
  }

  function renderSpells() {
    if (!computed.spellcasting) return;
    const cantripWrap = document.getElementById("cantrips-known");
    const spellWrap = document.getElementById("spells-known");
    cantripWrap.innerHTML = `<p><strong>Cantrips:</strong> <span id="cantrip-tags"></span> <button class="btn btn-small" id="add-cantrip">+</button></p>`;
    spellWrap.innerHTML = `<p><strong>Spells Known / Prepared:</strong> <span id="spell-tags"></span> <button class="btn btn-small" id="add-spell">+</button></p>`;
    renderTagList("cantrip-tags", character.cantripsKnown, (i) => { character.cantripsKnown.splice(i, 1); renderSpells(); persist(); });
    renderTagList("spell-tags", character.spellsKnown, (i) => { character.spellsKnown.splice(i, 1); renderSpells(); persist(); });
    document.getElementById("add-cantrip").addEventListener("click", () => {
      const name = prompt("Cantrip name:");
      if (name) { character.cantripsKnown.push(name); renderSpells(); persist(); }
    });
    document.getElementById("add-spell").addEventListener("click", () => {
      const name = prompt("Spell name:");
      if (name) { character.spellsKnown.push(name); renderSpells(); persist(); }
    });

    const slotsWrap = document.getElementById("spell-slots");
    slotsWrap.innerHTML = "";
    computed.spellcasting.slots.forEach((slot) => {
      character.tracker.spellSlotsUsed[slot.level] = character.tracker.spellSlotsUsed[slot.level] || 0;
      const row = document.createElement("div");
      row.className = "spell-slot-level";
      row.innerHTML = `<span class="lvl-label">Level ${slot.level}</span>`;
      const pipRow = document.createElement("div");
      pipRow.className = "pip-row";
      const used = character.tracker.spellSlotsUsed[slot.level];
      for (let i = 0; i < slot.total; i++) {
        const filled = i < used;
        const pip = document.createElement("div");
        pip.className = "pip" + (filled ? " filled hd" : "");
        pip.addEventListener("click", () => {
          const cur = character.tracker.spellSlotsUsed[slot.level];
          character.tracker.spellSlotsUsed[slot.level] = filled ? cur - 1 : Math.min(slot.total, cur + 1);
          renderSpells(); persist();
        });
        pipRow.appendChild(pip);
      }
      row.appendChild(pipRow);
      slotsWrap.appendChild(row);
    });
  }

  function renderTagList(containerId, arr, onRemove) {
    const wrap = document.getElementById(containerId);
    if (!arr.length) { wrap.textContent = "—"; return; }
    wrap.innerHTML = "";
    arr.forEach((name, i) => {
      const span = document.createElement("span");
      span.className = "pill";
      span.style.marginRight = "0.3rem";
      span.innerHTML = `${escapeHtml(name)} <button class="row-remove" style="margin-left:0.2rem;">✕</button>`;
      span.querySelector("button").addEventListener("click", () => onRemove(i));
      wrap.appendChild(span);
    });
  }

  function renderResources() {
    const wrap = document.getElementById("tracked-resources");
    wrap.innerHTML = "";
    character.trackedResources.forEach((res, idx) => {
      const row = document.createElement("div");
      row.className = "limited-feature";
      const info = document.createElement("div");
      info.className = "lf-info";
      info.innerHTML = `<span class="lf-name">${escapeHtml(res.name)}${res.note ? ` <span class="row-tag">(${escapeHtml(res.note)})</span>` : ""}</span><span class="lf-recovery">Recharges: ${escapeHtml(res.recovery)}</span>`;
      row.appendChild(info);
      if (res.isPool) {
        const poolWrap = document.createElement("div");
        poolWrap.className = "lf-pool";
        const input = document.createElement("input");
        input.type = "number"; input.min = "0"; input.max = String(res.max);
        input.value = character.tracker.resourcePool[res.id];
        input.addEventListener("change", () => {
          let v = parseInt(input.value, 10); if (isNaN(v)) v = 0;
          character.tracker.resourcePool[res.id] = Math.max(0, Math.min(res.max, v));
          input.value = character.tracker.resourcePool[res.id]; persist();
        });
        poolWrap.appendChild(input);
        const span = document.createElement("span"); span.textContent = "/ " + res.max;
        poolWrap.appendChild(span);
        row.appendChild(poolWrap);
      } else {
        const pipRow = document.createElement("div");
        pipRow.className = "pip-row";
        const used = character.tracker.resourceUsed[res.id] || 0;
        for (let i = 0; i < res.max; i++) {
          const filled = i < used;
          const pip = document.createElement("div");
          pip.className = "pip" + (filled ? " filled failure" : "");
          pip.addEventListener("click", () => {
            const cur = character.tracker.resourceUsed[res.id] || 0;
            character.tracker.resourceUsed[res.id] = filled ? cur - 1 : Math.min(res.max, cur + 1);
            renderResources(); persist();
          });
          pipRow.appendChild(pip);
        }
        row.appendChild(pipRow);
      }
      const rm = document.createElement("button");
      rm.className = "row-remove"; rm.textContent = "✕"; rm.title = "Remove resource";
      rm.addEventListener("click", () => { character.trackedResources.splice(idx, 1); renderResources(); persist(); });
      row.appendChild(rm);
      wrap.appendChild(row);
    });
  }

  function featureDetails(f) {
    const el = document.createElement("details");
    el.className = "feature-item";
    el.innerHTML = `<summary>${escapeHtml(f.name)}${f.level ? `<span class="feature-src">(level ${f.level})</span>` : ""}</summary>${f.text ? `<div class="feature-limit"></div><ul><li>${escapeHtml(f.text)}</li></ul>` : ""}`;
    return el;
  }

  function renderFeatures() {
    const cf = document.getElementById("class-features");
    cf.innerHTML = "";
    computed.classFeatures.forEach((f) => cf.appendChild(featureDetails(f)));
    const sf = document.getElementById("subclass-features");
    if (sf) { sf.innerHTML = ""; computed.subclassFeatures.forEach((f) => sf.appendChild(featureDetails(f))); }
    const rt = document.getElementById("racial-traits");
    rt.innerHTML = "";
    computed.raceTraits.forEach((f) => rt.appendChild(featureDetails(f)));
    const bf = document.getElementById("background-feature");
    if (bf && computed.background) bf.appendChild(featureDetails(computed.background.feature));
  }

  const PERSONAL_DETAIL_FIELDS = [["alignment", "Alignment"], ["faith", "Faith"], ["gender", "Gender"], ["age", "Age"], ["height", "Height"], ["weight", "Weight"], ["hair", "Hair"], ["eyes", "Eyes"], ["skin", "Skin"]];

  function renderPersonalDetails() {
    const wrap = document.getElementById("personal-details");
    wrap.innerHTML = "";
    PERSONAL_DETAIL_FIELDS.forEach(([key, label]) => {
      const l = document.createElement("label");
      l.textContent = label;
      const input = document.createElement("input");
      input.type = "text";
      input.value = character.personalDetails[key] || "";
      input.addEventListener("input", () => { character.personalDetails[key] = input.value; persist(); });
      l.appendChild(input);
      wrap.appendChild(l);
    });
  }

  function bindSimpleTextFields() {
    const map = [
      ["pt-traits", () => character.personality.traits, (v) => (character.personality.traits = v)],
      ["pt-ideals", () => character.personality.ideals, (v) => (character.personality.ideals = v)],
      ["pt-bonds", () => character.personality.bonds, (v) => (character.personality.bonds = v)],
      ["pt-flaws", () => character.personality.flaws, (v) => (character.personality.flaws = v)],
      ["background-history", () => character.background_history, (v) => (character.background_history = v)],
      ["appearance", () => character.appearance, (v) => (character.appearance = v)],
      ["allies", () => character.alliesOrganizations, (v) => (character.alliesOrganizations = v)],
      ["enemies", () => character.enemies, (v) => (character.enemies = v)],
      ["notes", () => character.notes, (v) => (character.notes = v)],
    ];
    map.forEach(([id, getter, setter]) => {
      const el = document.getElementById(id);
      el.value = getter() || "";
      el.addEventListener("input", () => { setter(el.value); persist(); });
    });
  }

  function renderCoins() {
    const wrap = document.getElementById("coins-row");
    wrap.innerHTML = "";
    const labels = { pp: "Platinum", gp: "Gold", ep: "Electrum", sp: "Silver", cp: "Copper" };
    Object.keys(labels).forEach((key) => {
      const box = document.createElement("div");
      box.className = "coin-box";
      box.innerHTML = `<span>${labels[key]}</span>`;
      const input = document.createElement("input");
      input.type = "number"; input.min = "0"; input.value = character.coins[key] || 0;
      input.addEventListener("input", () => { character.coins[key] = parseInt(input.value, 10) || 0; persist(); });
      box.appendChild(input);
      wrap.appendChild(box);
    });
  }

  function renderEquipment() {
    const body = document.getElementById("equipment-body");
    body.innerHTML = "";
    character.equipment.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td><input type="text" value="${escapeHtml(item.name)}"></td><td><input type="text" value="${escapeHtml(item.qty)}"></td><td><input type="text" value="${escapeHtml(item.weight)}"></td><td><button class="row-remove">✕</button></td>`;
      const [nameI, qtyI, wtI] = tr.querySelectorAll("input");
      nameI.addEventListener("input", () => { item.name = nameI.value; persist(); });
      qtyI.addEventListener("input", () => { item.qty = qtyI.value; persist(); });
      wtI.addEventListener("input", () => { item.weight = wtI.value; persist(); });
      tr.querySelector(".row-remove").addEventListener("click", () => { character.equipment.splice(idx, 1); renderEquipment(); persist(); });
      body.appendChild(tr);
    });
  }

  function renderNamedList(containerId, arr, placeholder) {
    const ul = document.getElementById(containerId);
    ul.innerHTML = "";
    arr.forEach((val, idx) => {
      const li = document.createElement("li");
      const input = document.createElement("input");
      input.type = "text"; input.placeholder = placeholder; input.value = val;
      input.addEventListener("input", () => { arr[idx] = input.value; persist(); });
      const rm = document.createElement("button");
      rm.className = "row-remove"; rm.textContent = "✕";
      rm.addEventListener("click", () => { arr.splice(idx, 1); renderNamedList(containerId, arr, placeholder); persist(); });
      li.appendChild(input); li.appendChild(rm);
      ul.appendChild(li);
    });
  }

  function shortRest() {
    (character.trackedResources || []).forEach((r) => {
      if (r.recovery === "short rest" && !r.isPool) character.tracker.resourceUsed[r.id] = 0;
    });
    renderResources(); persist();
    toast("Short Rest", "✓", "");
  }
  function longRest() {
    (character.trackedResources || []).forEach((r) => {
      if (!r.isPool) character.tracker.resourceUsed[r.id] = 0;
      else character.tracker.resourcePool[r.id] = r.max;
    });
    Object.keys(character.tracker.spellSlotsUsed).forEach((l) => (character.tracker.spellSlotsUsed[l] = 0));
    character.tracker.hitDiceUsed = Math.max(0, character.tracker.hitDiceUsed - Math.max(1, Math.ceil(computed.level / 2)));
    character.tracker.hp.current = computed.hp;
    character.tracker.deathSaves = { success: [false, false, false], fail: [false, false, false] };
    renderResources(); renderSpells(); renderHp(); renderHitDice(); renderDeathSaves(); persist();
    toast("Long Rest", "✓", "");
  }

  function applyDamage(amount) {
    let dmg = amount;
    const hp = character.tracker.hp;
    if (hp.temp > 0) { const absorbed = Math.min(hp.temp, dmg); hp.temp -= absorbed; dmg -= absorbed; }
    hp.current -= dmg; clampHp(); renderHp(); persist();
  }
  function applyHeal(amount) {
    character.tracker.hp.current += amount; clampHp(); renderHp(); persist();
  }

  function wire() {
    renderAbilities(); renderSaves(); renderSkills(); renderHp(); renderHitDice(); renderDeathSaves();
    renderAttacks(); renderSpells(); renderResources(); renderFeatures();
    renderPersonalDetails(); bindSimpleTextFields(); renderCoins(); renderEquipment();
    renderNamedList("feats-list", character.feats, "Feat name");
    renderNamedList("magic-items-list", character.magicItems, "Magic item");

    document.getElementById("hp-minus").addEventListener("click", () => applyDamage(1));
    document.getElementById("hp-minus-5").addEventListener("click", () => applyDamage(5));
    document.getElementById("hp-plus").addEventListener("click", () => applyHeal(1));
    document.getElementById("hp-plus-5").addEventListener("click", () => applyHeal(5));
    document.getElementById("hp-current").addEventListener("change", (e) => {
      character.tracker.hp.current = parseInt(e.target.value, 10) || 0; renderHp(); persist();
    });
    document.getElementById("hp-temp").addEventListener("change", (e) => {
      character.tracker.hp.temp = Math.max(0, parseInt(e.target.value, 10) || 0); renderHp(); persist();
    });
    document.getElementById("xp").addEventListener("input", (e) => { character.xp = parseInt(e.target.value, 10) || 0; persist(); });
    document.getElementById("xp-next").addEventListener("input", (e) => { character.xpNext = parseInt(e.target.value, 10) || 0; persist(); });
    document.getElementById("short-rest-btn").addEventListener("click", shortRest);
    document.getElementById("long-rest-btn").addEventListener("click", longRest);

    document.getElementById("add-weapon").addEventListener("click", () => {
      const names = SRD_WEAPONS.map((w) => w.name).join(", ");
      const name = prompt(`Weapon name (examples: ${names}):`);
      if (!name) return;
      const match = SRD_WEAPONS.find((w) => w.name.toLowerCase() === name.trim().toLowerCase());
      if (match) character.weapons.push({ weaponId: match.id });
      else character.weapons.push({ custom: true, name, damage: "1d6", type: "Bludgeoning", kind: "Melee", properties: "" });
      recompute(); renderAttacks(); persist();
    });

    document.getElementById("add-resource").addEventListener("click", () => {
      const name = prompt("Resource name (e.g. Rage, Ki Points):");
      if (!name) return;
      const max = parseInt(prompt("Max uses:", "1"), 10) || 1;
      const recovery = prompt("Recharges on (short rest / long rest):", "long rest") || "long rest";
      const isPool = confirm("Is this a point pool (like Lay on Hands) rather than individual uses?");
      character.trackedResources.push({ id: DND_STORE.uid("res"), name, max, recovery, isPool });
      if (isPool) character.tracker.resourcePool[character.trackedResources[character.trackedResources.length - 1].id] = max;
      renderResources(); persist();
    });

    document.getElementById("add-equipment").addEventListener("click", () => {
      character.equipment.push({ name: "", qty: "1", weight: "" }); renderEquipment(); persist();
    });
    document.getElementById("add-feat").addEventListener("click", () => {
      character.feats.push(""); renderNamedList("feats-list", character.feats, "Feat name"); persist();
    });
    document.getElementById("add-magic-item").addEventListener("click", () => {
      character.magicItems.push(""); renderNamedList("magic-items-list", character.magicItems, "Magic item"); persist();
    });

    document.getElementById("delete-btn").addEventListener("click", () => {
      if (!confirm(`Delete ${character.name}? This can't be undone.`)) return;
      DND_STORE.deleteCharacter(character.id);
      window.location.hash = "#/";
    });
  }

  return { render };
})();
