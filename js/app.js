(() => {
  "use strict";

  const STORAGE_KEY = "mpmb-sheet-state:" + CHARACTER.name;

  const ABILITY_LABELS = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };

  function abilityMod(score) {
    return Math.floor((score - 10) / 2);
  }

  function fmtMod(mod) {
    return (mod >= 0 ? "+" : "") + mod;
  }

  function defaultState() {
    return {
      hp: { current: CHARACTER.hp.max, temp: 0 },
      hitDiceUsed: 0,
      deathSaves: { success: [false, false, false], fail: [false, false, false] },
      spellSlotsUsed: Object.fromEntries(CHARACTER.spellcasting.slots.map((s) => [s.level, 0])),
      limitedUsed: Object.fromEntries(
        CHARACTER.limitedFeatures.filter((f) => !f.isPool).map((f) => [f.id, 0])
      ),
      layOnHandsRemaining: (CHARACTER.limitedFeatures.find((f) => f.isPool) || {}).max || 0,
      personalDetails: {
        alignment: CHARACTER.alignment, faith: CHARACTER.faith, gender: CHARACTER.gender,
        age: CHARACTER.age, height: CHARACTER.height, weight: CHARACTER.weight,
        hair: CHARACTER.hair, eyes: CHARACTER.eyes, skin: CHARACTER.skin,
      },
      personality: { ...CHARACTER.personality },
      appearance: CHARACTER.appearance,
      alliesOrganizations: CHARACTER.alliesOrganizations,
      enemies: CHARACTER.enemies,
      notes: CHARACTER.notes,
      equipment: [...CHARACTER.equipment],
      feats: [...CHARACTER.feats],
      magicItems: [...CHARACTER.magicItems],
      coins: { ...CHARACTER.coins },
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const saved = JSON.parse(raw);
      return deepMerge(defaultState(), saved);
    } catch (e) {
      console.warn("Could not load saved sheet state, using defaults.", e);
      return defaultState();
    }
  }

  function deepMerge(base, override) {
    if (Array.isArray(base)) return Array.isArray(override) ? override : base;
    if (typeof base === "object" && base !== null) {
      const out = { ...base };
      for (const k of Object.keys(override || {})) {
        out[k] = k in base ? deepMerge(base[k], override[k]) : override[k];
      }
      return out;
    }
    return override === undefined ? base : override;
  }

  let state = loadState();
  let saveTimer = null;
  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 150);
  }

  function getPath(obj, path) {
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  }
  function setPath(obj, path, value) {
    const keys = path.split(".");
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
    o[keys[keys.length - 1]] = value;
  }

  // ---------- Dice roller ----------
  function rollD20(mod, label) {
    const roll = 1 + Math.floor(Math.random() * 20);
    const total = roll + mod;
    showToast(label, roll, mod, total);
    return total;
  }

  function showToast(label, roll, mod, total) {
    const log = document.getElementById("roll-log");
    const toast = document.createElement("div");
    toast.className = "roll-toast";
    const critNote = roll === 20 ? " ✦ nat 20!" : roll === 1 ? " ✦ nat 1" : "";
    toast.innerHTML = `${escapeHtml(label)} <span class="roll-total">${total}</span>
      <div style="font-size:0.7rem;opacity:0.75;">(d20: ${roll} ${fmtMod(mod)}${critNote})</div>`;
    log.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Rendering ----------
  function renderHeader() {
    document.getElementById("char-name").textContent = CHARACTER.name;
    document.getElementById("char-class-level").textContent = `${CHARACTER.level} ${CHARACTER.classLevel}`;
    document.getElementById("char-background").textContent = CHARACTER.background;
    document.getElementById("char-race").textContent = CHARACTER.race;
    document.getElementById("char-xp").textContent = CHARACTER.xp;
    document.getElementById("char-xp-next").textContent = CHARACTER.xpNext;
  }

  function renderAbilities() {
    const wrap = document.getElementById("abilities");
    wrap.innerHTML = "";
    for (const [key, score] of Object.entries(CHARACTER.abilities)) {
      const mod = abilityMod(score);
      const box = document.createElement("div");
      box.className = "ability-box";
      box.innerHTML = `<div class="ability-name">${ABILITY_LABELS[key]}</div>
        <div class="ability-mod">${fmtMod(mod)}</div>
        <div class="ability-score">${score}</div>`;
      box.addEventListener("click", () => rollD20(mod, `${ABILITY_LABELS[key]} Check`));
      wrap.appendChild(box);
    }
  }

  function renderSaves() {
    const wrap = document.getElementById("saves");
    wrap.innerHTML = "";
    for (const [key, score] of Object.entries(CHARACTER.abilities)) {
      const prof = CHARACTER.saves[key].prof;
      const mod = abilityMod(score) + (prof ? CHARACTER.proficiencyBonus : 0);
      const row = document.createElement("div");
      row.className = "row-item";
      row.innerHTML = `<span class="prof-dot ${prof ? "filled" : ""}"></span>
        <span class="row-name">${ABILITY_LABELS[key]} Save</span>
        <span class="row-mod">${fmtMod(mod)}</span>`;
      row.addEventListener("click", () => rollD20(mod, `${ABILITY_LABELS[key]} Save`));
      wrap.appendChild(row);
    }
    document.getElementById("save-notes").textContent = CHARACTER.saveNotes || "";
  }

  function renderSkills() {
    const wrap = document.getElementById("skills");
    wrap.innerHTML = "";
    for (const skill of CHARACTER.skills) {
      const score = CHARACTER.abilities[skill.ability];
      const mod = abilityMod(score) + (skill.prof ? CHARACTER.proficiencyBonus : 0);
      const row = document.createElement("div");
      row.className = "row-item";
      row.innerHTML = `<span class="prof-dot ${skill.prof ? "filled" : ""}"></span>
        <span class="row-name">${skill.name} <span class="row-tag">(${ABILITY_LABELS[skill.ability]})</span></span>
        ${skill.disadvantage ? '<span class="row-tag">disadv.</span>' : ""}
        <span class="row-mod">${fmtMod(mod)}</span>`;
      row.addEventListener("click", () => rollD20(mod, skill.name));
      wrap.appendChild(row);
    }
    document.getElementById("passive-perception").textContent = CHARACTER.passivePerception;
  }

  function renderCombatStatic() {
    document.getElementById("ac").textContent = CHARACTER.ac;
    document.getElementById("ac-note").textContent = CHARACTER.acNote;
    document.getElementById("initiative").textContent = fmtMod(CHARACTER.initiative);
    document.getElementById("speed").textContent = `${CHARACTER.speed} ft`;
    document.getElementById("speed-encumbered").textContent = `${CHARACTER.speedEncumbered} ft encumbered`;
    document.getElementById("prof-bonus").textContent = fmtMod(CHARACTER.proficiencyBonus);
    document.getElementById("hp-max").textContent = CHARACTER.hp.max;
    document.getElementById("hd-die").textContent = CHARACTER.hitDice.die;
    document.getElementById("senses").textContent = CHARACTER.senses.join(", ") || "—";
    document.getElementById("resistances").textContent = CHARACTER.resistances.join(", ") || "—";
    document.getElementById("armor-prof").textContent = CHARACTER.armorProf.join(", ");
    document.getElementById("weapon-prof").textContent = CHARACTER.weaponProf.join(", ");
    document.getElementById("tool-prof").textContent = CHARACTER.tools.join(", ") || "—";
    document.getElementById("languages").textContent = CHARACTER.languages.join(", ") || "—";
    document.getElementById("lifestyle").textContent = CHARACTER.lifestyle || "—";
    document.getElementById("lifestyle-cost").textContent = CHARACTER.lifestyleCost || "—";
  }

  function clampHp() {
    state.hp.current = Math.max(0, Math.min(CHARACTER.hp.max, state.hp.current));
    state.hp.temp = Math.max(0, state.hp.temp || 0);
  }

  function renderHp() {
    clampHp();
    document.getElementById("hp-current").value = state.hp.current;
    document.getElementById("hp-temp").value = state.hp.temp;
    const pct = Math.round((state.hp.current / CHARACTER.hp.max) * 100);
    const bar = document.getElementById("hp-bar");
    bar.style.width = pct + "%";
    if (pct <= 25) bar.style.background = "linear-gradient(90deg, #a8283a, #c25a68)";
    else if (pct <= 50) bar.style.background = "linear-gradient(90deg, #b8860b, #d4a017)";
    else bar.style.background = "linear-gradient(90deg, #3f7d4f, #6fa877)";
  }

  function applyDamage(amount) {
    let dmg = amount;
    if (state.hp.temp > 0) {
      const absorbed = Math.min(state.hp.temp, dmg);
      state.hp.temp -= absorbed;
      dmg -= absorbed;
    }
    state.hp.current -= dmg;
    clampHp();
    renderHp();
    saveState();
  }

  function applyHeal(amount) {
    state.hp.current += amount;
    clampHp();
    renderHp();
    saveState();
  }

  function renderHitDice() {
    const wrap = document.getElementById("hit-dice");
    wrap.innerHTML = "";
    for (let i = 0; i < CHARACTER.hitDice.total; i++) {
      const pip = document.createElement("div");
      const used = i < state.hitDiceUsed;
      pip.className = "pip hd" + (used ? " filled" : "");
      pip.title = used ? "Spent" : "Available — click to spend";
      pip.addEventListener("click", () => {
        state.hitDiceUsed = used ? state.hitDiceUsed - 1 : Math.min(CHARACTER.hitDice.total, state.hitDiceUsed + 1);
        renderHitDice();
        saveState();
      });
      wrap.appendChild(pip);
    }
  }

  function renderDeathSaves() {
    const successWrap = document.getElementById("death-success");
    const failWrap = document.getElementById("death-fail");
    successWrap.innerHTML = "";
    failWrap.innerHTML = "";
    state.deathSaves.success.forEach((filled, i) => {
      const pip = document.createElement("div");
      pip.className = "pip" + (filled ? " filled success" : "");
      pip.addEventListener("click", () => {
        state.deathSaves.success[i] = !state.deathSaves.success[i];
        renderDeathSaves();
        saveState();
      });
      successWrap.appendChild(pip);
    });
    state.deathSaves.fail.forEach((filled, i) => {
      const pip = document.createElement("div");
      pip.className = "pip" + (filled ? " filled failure" : "");
      pip.addEventListener("click", () => {
        state.deathSaves.fail[i] = !state.deathSaves.fail[i];
        renderDeathSaves();
        saveState();
      });
      failWrap.appendChild(pip);
    });
  }

  function renderAttacks() {
    const body = document.getElementById("attacks-body");
    body.innerHTML = "";
    for (const atk of CHARACTER.attacks) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${atk.name}</td><td>${atk.range}</td>
        <td class="clickable" data-roll="hit">${atk.toHit}</td>
        <td class="clickable" data-roll="dmg">${atk.damage}</td>
        <td>${atk.damageType}</td><td>${atk.desc || ""}</td>`;
      tr.querySelector('[data-roll="hit"]').addEventListener("click", () => {
        const mod = parseInt(atk.toHit, 10);
        rollD20(mod, `${atk.name} — Attack`);
      });
      tr.querySelector('[data-roll="dmg"]').addEventListener("click", () => {
        rollDamage(atk.damage, `${atk.name} — Damage`);
      });
      body.appendChild(tr);
    }
    if (CHARACTER.spellcasting.cantrips.includes("Light")) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>Light (cantrip)</td><td>Touch</td><td>—</td><td>—</td><td>—</td><td>20 ft radius, 1 hour</td>`;
      body.appendChild(tr);
    }
  }

  function rollDamage(diceExpr, label) {
    const m = diceExpr.match(/^(\d+)d(\d+)\s*([+-]\s*\d+)?$/i);
    if (!m) return;
    const count = parseInt(m[1], 10);
    const die = parseInt(m[2], 10);
    const bonus = m[3] ? parseInt(m[3].replace(/\s/g, ""), 10) : 0;
    let total = 0;
    const rolls = [];
    for (let i = 0; i < count; i++) {
      const r = 1 + Math.floor(Math.random() * die);
      rolls.push(r);
      total += r;
    }
    total += bonus;
    const log = document.getElementById("roll-log");
    const toast = document.createElement("div");
    toast.className = "roll-toast";
    toast.innerHTML = `${escapeHtml(label)} <span class="roll-total">${total}</span>
      <div style="font-size:0.7rem;opacity:0.75;">(${rolls.join(", ")} ${bonus ? fmtMod(bonus) : ""})</div>`;
    log.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
  }

  function renderSpells() {
    const sc = CHARACTER.spellcasting;
    document.getElementById("spell-ability").textContent = ABILITY_LABELS[sc.ability];
    document.getElementById("spell-dc").textContent = sc.saveDC;
    document.getElementById("spell-atk").textContent = fmtMod(sc.attackMod);
    document.getElementById("spell-cantrips").textContent = sc.cantrips.join(", ") || "—";
    document.getElementById("spell-prepared").textContent = sc.alwaysPrepared.join(", ") || "—";

    const wrap = document.getElementById("spell-slots");
    wrap.innerHTML = "";
    for (const slot of sc.slots) {
      const row = document.createElement("div");
      row.className = "spell-slot-level";
      const used = state.spellSlotsUsed[slot.level] || 0;
      row.innerHTML = `<span class="lvl-label">Level ${slot.level}</span>`;
      const pipRow = document.createElement("div");
      pipRow.className = "pip-row";
      for (let i = 0; i < slot.total; i++) {
        const pip = document.createElement("div");
        const filled = i < used;
        pip.className = "pip" + (filled ? " filled hd" : "");
        pip.title = filled ? "Expended" : "Available — click to expend";
        pip.addEventListener("click", () => {
          const cur = state.spellSlotsUsed[slot.level] || 0;
          state.spellSlotsUsed[slot.level] = filled ? cur - 1 : Math.min(slot.total, cur + 1);
          renderSpells();
          saveState();
        });
        pipRow.appendChild(pip);
      }
      row.appendChild(pipRow);
      wrap.appendChild(row);
    }
  }

  function renderLimitedFeatures() {
    const wrap = document.getElementById("limited-features");
    wrap.innerHTML = "";
    for (const feat of CHARACTER.limitedFeatures) {
      const row = document.createElement("div");
      row.className = "limited-feature";
      const info = document.createElement("div");
      info.className = "lf-info";
      info.innerHTML = `<span class="lf-name">${feat.name}${feat.note ? ` <span class="row-tag">(${feat.note})</span>` : ""}</span>
        <span class="lf-recovery">Recharges: ${feat.recovery}${feat.maxLabel ? ` · max ${feat.maxLabel}` : ""}</span>`;
      row.appendChild(info);

      if (feat.isPool) {
        const poolWrap = document.createElement("div");
        poolWrap.className = "lf-pool";
        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.max = String(feat.max);
        input.value = state.layOnHandsRemaining;
        input.addEventListener("change", () => {
          let v = parseInt(input.value, 10);
          if (isNaN(v)) v = 0;
          v = Math.max(0, Math.min(feat.max, v));
          state.layOnHandsRemaining = v;
          input.value = v;
          saveState();
        });
        poolWrap.appendChild(input);
        const span = document.createElement("span");
        span.textContent = "/ " + feat.max;
        poolWrap.appendChild(span);
        row.appendChild(poolWrap);
      } else {
        const pipRow = document.createElement("div");
        pipRow.className = "pip-row";
        const used = state.limitedUsed[feat.id] || 0;
        for (let i = 0; i < feat.max; i++) {
          const pip = document.createElement("div");
          const filled = i < used;
          pip.className = "pip" + (filled ? " filled failure" : "");
          pip.title = filled ? "Used" : "Available — click to use";
          pip.addEventListener("click", () => {
            const cur = state.limitedUsed[feat.id] || 0;
            state.limitedUsed[feat.id] = filled ? cur - 1 : Math.min(feat.max, cur + 1);
            renderLimitedFeatures();
            saveState();
          });
          pipRow.appendChild(pip);
        }
        row.appendChild(pipRow);
      }
      wrap.appendChild(row);
    }
  }

  function featureDetails(f) {
    const el = document.createElement("details");
    el.className = "feature-item";
    el.innerHTML = `<summary>${f.name}${f.src ? `<span class="feature-src">(${f.src})</span>` : ""}</summary>
      ${f.limit ? `<div class="feature-limit">${f.limit}</div>` : ""}
      ${f.lines && f.lines.length ? `<ul>${f.lines.map((l) => `<li>${l}</li>`).join("")}</ul>` : ""}`;
    return el;
  }

  function renderFeatures() {
    const cf = document.getElementById("class-features");
    cf.innerHTML = "";
    CHARACTER.classFeatures.forEach((f) => cf.appendChild(featureDetails(f)));

    const rt = document.getElementById("racial-traits");
    rt.innerHTML = "";
    CHARACTER.racialTraits.forEach((f) => rt.appendChild(featureDetails(f)));

    const bf = document.getElementById("background-feature");
    bf.innerHTML = "";
    bf.appendChild(featureDetails({ name: CHARACTER.backgroundFeature.name, lines: [CHARACTER.backgroundFeature.text] }));
  }

  function renderBackgroundHistory() {
    document.getElementById("background-history").textContent = CHARACTER.background_history || "—";
  }

  // ---------- Editable sections ----------
  const PERSONAL_DETAIL_FIELDS = [
    ["alignment", "Alignment"], ["faith", "Faith"], ["gender", "Gender"],
    ["age", "Age"], ["height", "Height"], ["weight", "Weight"],
    ["hair", "Hair"], ["eyes", "Eyes"], ["skin", "Skin"],
  ];

  function renderPersonalDetails() {
    const wrap = document.getElementById("personal-details");
    wrap.innerHTML = "";
    for (const [key, label] of PERSONAL_DETAIL_FIELDS) {
      const l = document.createElement("label");
      l.innerHTML = `${label}`;
      const input = document.createElement("input");
      input.type = "text";
      input.value = state.personalDetails[key] || "";
      input.addEventListener("input", () => {
        state.personalDetails[key] = input.value;
        saveState();
      });
      l.appendChild(input);
      wrap.appendChild(l);
    }
    const sizeLabel = document.createElement("label");
    sizeLabel.innerHTML = "Size";
    const sizeVal = document.createElement("input");
    sizeVal.type = "text";
    sizeVal.value = CHARACTER.size;
    sizeVal.disabled = true;
    sizeLabel.appendChild(sizeVal);
    wrap.appendChild(sizeLabel);
  }

  function bindTextFields() {
    document.querySelectorAll("[data-field]").forEach((el) => {
      const path = el.dataset.field;
      el.value = getPath(state, path) || "";
      el.addEventListener("input", () => {
        setPath(state, path, el.value);
        saveState();
      });
    });
  }

  function renderCoins() {
    const wrap = document.getElementById("coins-row");
    wrap.innerHTML = "";
    const labels = { pp: "Platinum", gp: "Gold", ep: "Electrum", sp: "Silver", cp: "Copper" };
    for (const key of ["pp", "gp", "ep", "sp", "cp"]) {
      const box = document.createElement("div");
      box.className = "coin-box";
      box.innerHTML = `<span>${labels[key]}</span>`;
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.value = state.coins[key] || 0;
      input.addEventListener("input", () => {
        state.coins[key] = parseInt(input.value, 10) || 0;
        saveState();
      });
      box.appendChild(input);
      wrap.appendChild(box);
    }
  }

  function renderEquipment() {
    const body = document.getElementById("equipment-body");
    body.innerHTML = "";
    state.equipment.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="text" value="${escapeAttr(item.name)}" data-key="name"></td>
        <td><input type="text" value="${escapeAttr(item.qty)}" data-key="qty"></td>
        <td><input type="text" value="${escapeAttr(item.weight)}" data-key="weight"></td>
        <td><button class="row-remove" title="Remove">✕</button></td>`;
      tr.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", () => {
          state.equipment[idx][input.dataset.key] = input.value;
          saveState();
        });
      });
      tr.querySelector(".row-remove").addEventListener("click", () => {
        state.equipment.splice(idx, 1);
        renderEquipment();
        saveState();
      });
      body.appendChild(tr);
    });
  }

  function escapeAttr(v) {
    return String(v == null ? "" : v).replace(/"/g, "&quot;");
  }

  function renderNamedList(containerId, stateKey, placeholder) {
    const ul = document.getElementById(containerId);
    ul.innerHTML = "";
    state[stateKey].forEach((val, idx) => {
      const li = document.createElement("li");
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = placeholder;
      input.value = val;
      input.addEventListener("input", () => {
        state[stateKey][idx] = input.value;
        saveState();
      });
      const removeBtn = document.createElement("button");
      removeBtn.className = "row-remove";
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", () => {
        state[stateKey].splice(idx, 1);
        renderNamedList(containerId, stateKey, placeholder);
        saveState();
      });
      li.appendChild(input);
      li.appendChild(removeBtn);
      ul.appendChild(li);
    });
  }

  // ---------- Rest actions ----------
  function shortRest() {
    CHARACTER.limitedFeatures.forEach((f) => {
      if (f.recovery === "short rest" && !f.isPool) state.limitedUsed[f.id] = 0;
    });
    renderLimitedFeatures();
    saveState();
    showToast("Short Rest", 0, 0, "✓");
  }

  function longRest() {
    CHARACTER.limitedFeatures.forEach((f) => {
      if (!f.isPool) state.limitedUsed[f.id] = 0;
    });
    state.layOnHandsRemaining = (CHARACTER.limitedFeatures.find((f) => f.isPool) || {}).max || 0;
    Object.keys(state.spellSlotsUsed).forEach((lvl) => (state.spellSlotsUsed[lvl] = 0));
    state.hitDiceUsed = Math.max(0, state.hitDiceUsed - Math.max(1, Math.ceil(CHARACTER.hitDice.total / 2)));
    state.hp.current = CHARACTER.hp.max;
    state.deathSaves = { success: [false, false, false], fail: [false, false, false] };
    renderAll();
    saveState();
    showToast("Long Rest", 0, 0, "✓");
  }

  // ---------- Wire up static controls ----------
  function wireControls() {
    document.getElementById("hp-minus").addEventListener("click", () => applyDamage(1));
    document.getElementById("hp-minus-5").addEventListener("click", () => applyDamage(5));
    document.getElementById("hp-plus").addEventListener("click", () => applyHeal(1));
    document.getElementById("hp-plus-5").addEventListener("click", () => applyHeal(5));
    document.getElementById("hp-current").addEventListener("change", (e) => {
      let v = parseInt(e.target.value, 10);
      if (isNaN(v)) v = 0;
      state.hp.current = v;
      renderHp();
      saveState();
    });
    document.getElementById("hp-temp").addEventListener("change", (e) => {
      let v = parseInt(e.target.value, 10);
      if (isNaN(v)) v = 0;
      state.hp.temp = Math.max(0, v);
      renderHp();
      saveState();
    });

    document.getElementById("short-rest-btn").addEventListener("click", shortRest);
    document.getElementById("long-rest-btn").addEventListener("click", longRest);

    document.getElementById("add-equipment").addEventListener("click", () => {
      state.equipment.push({ name: "", qty: "1", weight: "" });
      renderEquipment();
      saveState();
    });

    document.getElementById("add-feat").addEventListener("click", () => {
      state.feats.push("");
      renderNamedList("feats-list", "feats", "Feat name");
      saveState();
    });

    document.getElementById("add-magic-item").addEventListener("click", () => {
      state.magicItems.push("");
      renderNamedList("magic-items-list", "magicItems", "Magic item");
      saveState();
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
      if (!confirm("Reset all tracked HP, resources, and edited notes back to the sheet defaults?")) return;
      state = defaultState();
      saveState();
      renderAll();
      bindTextFields();
      renderPersonalDetails();
      renderCoins();
      renderEquipment();
      renderNamedList("feats-list", "feats", "Feat name");
      renderNamedList("magic-items-list", "magicItems", "Magic item");
    });
  }

  function renderAll() {
    renderHeader();
    renderAbilities();
    renderSaves();
    renderSkills();
    renderCombatStatic();
    renderHp();
    renderHitDice();
    renderDeathSaves();
    renderAttacks();
    renderSpells();
    renderLimitedFeatures();
    renderFeatures();
    renderBackgroundHistory();
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderAll();
    renderPersonalDetails();
    bindTextFields();
    renderCoins();
    renderEquipment();
    renderNamedList("feats-list", "feats", "Feat name");
    renderNamedList("magic-items-list", "magicItems", "Magic item");
    wireControls();
  });
})();
