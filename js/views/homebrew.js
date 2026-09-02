const HomebrewView = (() => {
  const CATEGORIES = [
    { id: "races", label: "Races" },
    { id: "classes", label: "Classes" },
    { id: "backgrounds", label: "Backgrounds" },
    { id: "feats", label: "Feats" },
    { id: "spells", label: "Spells" },
    { id: "items", label: "Items" },
  ];
  let activeTab = "races";

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function render(container) {
    container.innerHTML = `
      <div class="builder-wrap">
        <a href="#/" class="btn btn-ghost btn-small back-link">&larr; Characters</a>
        <h1>Homebrew Content</h1>
        <p class="note-line">Custom content you add here shows up alongside official content in the character builder. Export to share a JSON file with others, or import someone else's.</p>
        <div class="homebrew-toolbar">
          <button class="btn btn-ghost" id="export-all">Export All (JSON)</button>
          <label class="btn btn-ghost file-btn">Import JSON<input type="file" id="import-file" accept="application/json" hidden></label>
        </div>
        <div class="tabs" id="tabs"></div>
        <div id="tab-content"></div>
      </div>`;
    renderTabs();
    renderTab();
    document.getElementById("export-all").addEventListener("click", exportAll);
    document.getElementById("import-file").addEventListener("change", importFile);
  }

  function renderTabs() {
    const wrap = document.getElementById("tabs");
    wrap.innerHTML = CATEGORIES.map((c) => `<button class="tab-btn ${c.id === activeTab ? "active" : ""}" data-cat="${c.id}">${c.label}</button>`).join("");
    wrap.querySelectorAll(".tab-btn").forEach((btn) => btn.addEventListener("click", () => { activeTab = btn.dataset.cat; renderTabs(); renderTab(); }));
  }

  function exportAll() {
    const json = DND_STORE.exportHomebrew();
    downloadFile("homebrew-content.json", json);
  }
  function downloadFile(filename, content) {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  function importFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const added = DND_STORE.importHomebrew(reader.result, { merge: true });
        alert(`Imported ${added} homebrew entries.`);
        renderTab();
      } catch (err) {
        alert("Could not import that file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function renderTab() {
    const content = document.getElementById("tab-content");
    const hb = DND_STORE.loadHomebrew();
    const list = hb[activeTab] || [];
    content.innerHTML = `
      <div class="homebrew-list-wrap">
        <div class="homebrew-list" id="hb-list"></div>
        <div class="card" id="hb-form-card">
          <h2>Add ${labelSingular(activeTab)}</h2>
          <div id="hb-form"></div>
        </div>
      </div>`;
    const listEl = document.getElementById("hb-list");
    if (!list.length) {
      listEl.innerHTML = `<p class="note-line">No custom ${activeTab} yet.</p>`;
    } else {
      list.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "homebrew-row";
        row.innerHTML = `<div><strong>${escapeHtml(entry.name)}</strong>${summaryFor(activeTab, entry)}</div>
          <div class="homebrew-row-actions">
            <button class="btn btn-small btn-ghost" data-act="export">Export</button>
            <button class="btn btn-small btn-danger-ghost" data-act="delete">Delete</button>
          </div>`;
        row.querySelector('[data-act="export"]').addEventListener("click", () => {
          downloadFile(`${entry.name.replace(/\s+/g, "-").toLowerCase()}.json`, DND_STORE.exportHomebrewEntry(activeTab, entry.id));
        });
        row.querySelector('[data-act="delete"]').addEventListener("click", () => {
          if (confirm(`Delete ${entry.name}?`)) { DND_STORE.deleteHomebrewEntry(activeTab, entry.id); renderTab(); }
        });
        listEl.appendChild(row);
      });
    }
    renderForm();
  }

  function labelSingular(cat) { return CATEGORIES.find((c) => c.id === cat).label.replace(/s$/, ""); }

  function summaryFor(cat, e) {
    if (cat === "spells") return ` <span class="row-tag">Level ${e.level} ${escapeHtml(e.school || "")}</span>`;
    if (cat === "feats" || cat === "items") return ` <span class="row-tag">${escapeHtml((e.text || "").slice(0, 60))}</span>`;
    if (cat === "classes") return ` <span class="row-tag">d${e.hitDie}</span>`;
    if (cat === "backgrounds") return ` <span class="row-tag">${(e.skills || []).join(", ")}</span>`;
    return "";
  }

  // ---- Repeatable name/text list editor (traits, features) ----
  function traitListEditor(container, items, opts = {}) {
    const withLevel = !!opts.withLevel;
    function draw() {
      container.innerHTML = "";
      items.forEach((item, idx) => {
        const row = document.createElement("div");
        row.className = "trait-row";
        row.innerHTML = `
          ${withLevel ? `<input type="number" min="1" max="20" value="${item.level || 1}" class="trait-level" style="width:3.5rem;">` : ""}
          <input type="text" placeholder="Name" value="${escapeHtml(item.name || "")}" class="trait-name">
          <input type="text" placeholder="Description" value="${escapeHtml(item.text || "")}" class="trait-text">
          <button type="button" class="row-remove">✕</button>`;
        if (withLevel) row.querySelector(".trait-level").addEventListener("input", (e) => (item.level = parseInt(e.target.value, 10) || 1));
        row.querySelector(".trait-name").addEventListener("input", (e) => (item.name = e.target.value));
        row.querySelector(".trait-text").addEventListener("input", (e) => (item.text = e.target.value));
        row.querySelector(".row-remove").addEventListener("click", () => { items.splice(idx, 1); draw(); });
        container.appendChild(row);
      });
      const addBtn = document.createElement("button");
      addBtn.type = "button"; addBtn.className = "btn btn-ghost btn-small";
      addBtn.textContent = "+ Add";
      addBtn.addEventListener("click", () => { items.push(withLevel ? { level: 1, name: "", text: "" } : { name: "", text: "" }); draw(); });
      container.appendChild(addBtn);
    }
    draw();
  }

  function renderForm() {
    const form = document.getElementById("hb-form");
    if (activeTab === "races") return raceForm(form);
    if (activeTab === "classes") return classForm(form);
    if (activeTab === "backgrounds") return backgroundForm(form);
    if (activeTab === "feats") return featForm(form);
    if (activeTab === "spells") return spellForm(form);
    if (activeTab === "items") return itemForm(form);
  }

  function abilityCheckboxRow(idPrefix, selected = []) {
    return `<div class="checkbox-row">${DND_CALC.ABILITY_KEYS.map((k) => `<label class="checkbox-label"><input type="checkbox" id="${idPrefix}-${k}" value="${k}" ${selected.includes(k) ? "checked" : ""}> ${k.toUpperCase()}</label>`).join("")}</div>`;
  }
  function checkedAbilities(idPrefix) {
    return DND_CALC.ABILITY_KEYS.filter((k) => document.getElementById(`${idPrefix}-${k}`).checked);
  }

  function raceForm(form) {
    form.innerHTML = `
      <label>Name<input type="text" id="rf-name"></label>
      <label>Ability Bonuses<div id="rf-bonuses" class="ability-input-grid"></div></label>
      <div class="form-row">
        <label>Size<select id="rf-size">${["Small", "Medium", "Large"].map((s) => `<option>${s}</option>`).join("")}</select></label>
        <label>Speed (ft)<input type="number" id="rf-speed" value="30"></label>
        <label>Darkvision (ft)<input type="number" id="rf-darkvision" value="0"></label>
      </div>
      <label>Languages (comma separated)<input type="text" id="rf-languages" placeholder="Common, Elvish"></label>
      <label>Traits</label>
      <div id="rf-traits"></div>
      <button class="btn" id="rf-save">Save Race</button>`;
    const bonusWrap = document.getElementById("rf-bonuses");
    bonusWrap.innerHTML = DND_CALC.ABILITY_KEYS.map((k) => `<label>${k.toUpperCase()}<input type="number" id="rf-bonus-${k}" value="0"></label>`).join("");
    const traits = [];
    traitListEditor(document.getElementById("rf-traits"), traits);
    document.getElementById("rf-save").addEventListener("click", () => {
      const name = document.getElementById("rf-name").value.trim();
      if (!name) return alert("Name required.");
      const abilityBonuses = {};
      DND_CALC.ABILITY_KEYS.forEach((k) => {
        const v = parseInt(document.getElementById(`rf-bonus-${k}`).value, 10) || 0;
        if (v) abilityBonuses[k] = v;
      });
      const entry = {
        name, abilityBonuses, size: document.getElementById("rf-size").value,
        speed: parseInt(document.getElementById("rf-speed").value, 10) || 30,
        darkvision: parseInt(document.getElementById("rf-darkvision").value, 10) || 0,
        languages: document.getElementById("rf-languages").value.split(",").map((s) => s.trim()).filter(Boolean),
        traits: traits.filter((t) => t.name), subraces: [],
      };
      DND_STORE.addHomebrewEntry("races", entry);
      renderTab();
    });
  }

  function classForm(form) {
    form.innerHTML = `
      <label>Name<input type="text" id="cf-name"></label>
      <div class="form-row">
        <label>Hit Die<select id="cf-hitdie">${[6, 8, 10, 12].map((d) => `<option value="${d}">d${d}</option>`).join("")}</select></label>
      </div>
      <label>Saving Throw Proficiencies (choose 2)</label>
      ${abilityCheckboxRow("cf-save")}
      <div class="form-row">
        <label>Armor Proficiencies (comma separated)<input type="text" id="cf-armor" placeholder="Light Armor, Shields"></label>
        <label>Weapon Proficiencies (comma separated)<input type="text" id="cf-weapon" placeholder="Simple Weapons"></label>
      </div>
      <label>Tool Proficiencies (comma separated)<input type="text" id="cf-tools"></label>
      <div class="form-row">
        <label>Skill Choices — count<input type="number" id="cf-skill-count" value="2" min="0" max="10"></label>
        <label>Skill Options (comma separated)<input type="text" id="cf-skill-options" placeholder="Athletics, Insight, ..."></label>
      </div>
      <label class="checkbox-label"><input type="checkbox" id="cf-has-spells"> Spellcaster</label>
      <div class="form-row" id="cf-spell-row" hidden>
        <label>Spellcasting Ability<select id="cf-spell-ability">${DND_CALC.ABILITY_KEYS.map((k) => `<option value="${k}">${k.toUpperCase()}</option>`).join("")}</select></label>
        <label>Caster Type<select id="cf-spell-type">${["full", "half", "pact"].map((t) => `<option value="${t}">${t}</option>`).join("")}</select></label>
      </div>
      <label>Base Class Features (by level)</label>
      <div id="cf-features"></div>
      <button class="btn" id="cf-save">Save Class</button>`;
    document.getElementById("cf-has-spells").addEventListener("change", (e) => {
      document.getElementById("cf-spell-row").hidden = !e.target.checked;
    });
    const features = [];
    traitListEditor(document.getElementById("cf-features"), features, { withLevel: true });
    document.getElementById("cf-save").addEventListener("click", () => {
      const name = document.getElementById("cf-name").value.trim();
      if (!name) return alert("Name required.");
      const featuresByLevel = {};
      features.filter((f) => f.name).forEach((f) => {
        const lvl = f.level || 1;
        featuresByLevel[lvl] = featuresByLevel[lvl] || [];
        featuresByLevel[lvl].push({ name: f.name, text: f.text });
      });
      const entry = {
        name, hitDie: parseInt(document.getElementById("cf-hitdie").value, 10),
        saveProficiencies: checkedAbilities("cf-save"),
        armorProf: document.getElementById("cf-armor").value.split(",").map((s) => s.trim()).filter(Boolean),
        weaponProf: document.getElementById("cf-weapon").value.split(",").map((s) => s.trim()).filter(Boolean),
        toolProf: document.getElementById("cf-tools").value.split(",").map((s) => s.trim()).filter(Boolean),
        skillChoice: {
          count: parseInt(document.getElementById("cf-skill-count").value, 10) || 0,
          options: document.getElementById("cf-skill-options").value.split(",").map((s) => s.trim()).filter(Boolean),
        },
        spellcasting: document.getElementById("cf-has-spells").checked ? {
          ability: document.getElementById("cf-spell-ability").value,
          type: document.getElementById("cf-spell-type").value,
        } : null,
        subclassLevel: 3, subclasses: [],
        featuresByLevel,
      };
      DND_STORE.addHomebrewEntry("classes", entry);
      renderTab();
    });
  }

  function backgroundForm(form) {
    form.innerHTML = `
      <label>Name<input type="text" id="bf-name"></label>
      <label>Skill Proficiencies (choose 2)</label>
      <div class="checkbox-row" id="bf-skills">${DND_SKILLS.map((s) => `<label class="checkbox-label"><input type="checkbox" value="${escapeHtml(s.name)}"> ${s.name}</label>`).join("")}</div>
      <div class="form-row">
        <label>Tool/Language Proficiencies (text)<input type="text" id="bf-tools"></label>
        <label>Bonus Languages<input type="number" id="bf-languages" value="0"></label>
      </div>
      <label>Equipment<input type="text" id="bf-equipment"></label>
      <div class="form-row">
        <label>Feature Name<input type="text" id="bf-feature-name"></label>
      </div>
      <label>Feature Text<textarea id="bf-feature-text" rows="2"></textarea></label>
      <button class="btn" id="bf-save">Save Background</button>`;
    document.getElementById("bf-save").addEventListener("click", () => {
      const name = document.getElementById("bf-name").value.trim();
      if (!name) return alert("Name required.");
      const skills = [...form.querySelectorAll("#bf-skills input:checked")].map((c) => c.value);
      const entry = {
        name, skills, tools: document.getElementById("bf-tools").value,
        languages: parseInt(document.getElementById("bf-languages").value, 10) || 0,
        equipment: document.getElementById("bf-equipment").value,
        feature: { name: document.getElementById("bf-feature-name").value, text: document.getElementById("bf-feature-text").value },
      };
      DND_STORE.addHomebrewEntry("backgrounds", entry);
      renderTab();
    });
  }

  function featForm(form) {
    form.innerHTML = `
      <label>Name<input type="text" id="ff-name"></label>
      <label>Description<textarea id="ff-text" rows="3"></textarea></label>
      <button class="btn" id="ff-save">Save Feat</button>`;
    document.getElementById("ff-save").addEventListener("click", () => {
      const name = document.getElementById("ff-name").value.trim();
      if (!name) return alert("Name required.");
      DND_STORE.addHomebrewEntry("feats", { name, text: document.getElementById("ff-text").value });
      renderTab();
    });
  }

  function spellForm(form) {
    form.innerHTML = `
      <label>Name<input type="text" id="sf-name"></label>
      <div class="form-row">
        <label>Level<select id="sf-level">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => `<option value="${l}">${l === 0 ? "Cantrip" : l}</option>`).join("")}</select></label>
        <label>School<select id="sf-school">${["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"].map((s) => `<option>${s}</option>`).join("")}</select></label>
      </div>
      <label>Classes (comma separated ids: bard, cleric, druid, paladin, ranger, sorcerer, warlock, wizard)<input type="text" id="sf-classes"></label>
      <label>Description<textarea id="sf-text" rows="2"></textarea></label>
      <button class="btn" id="sf-save">Save Spell</button>`;
    document.getElementById("sf-save").addEventListener("click", () => {
      const name = document.getElementById("sf-name").value.trim();
      if (!name) return alert("Name required.");
      const entry = {
        name, level: parseInt(document.getElementById("sf-level").value, 10),
        school: document.getElementById("sf-school").value,
        classes: document.getElementById("sf-classes").value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
        text: document.getElementById("sf-text").value,
      };
      DND_STORE.addHomebrewEntry("spells", entry);
      renderTab();
    });
  }

  function itemForm(form) {
    form.innerHTML = `
      <label>Name<input type="text" id="if-name"></label>
      <div class="form-row">
        <label>Type<input type="text" id="if-type" placeholder="Wondrous Item, Weapon, Armor…"></label>
        <label>Rarity<select id="if-rarity">${["Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact"].map((r) => `<option>${r}</option>`).join("")}</select></label>
      </div>
      <label>Description<textarea id="if-text" rows="3"></textarea></label>
      <button class="btn" id="if-save">Save Item</button>`;
    document.getElementById("if-save").addEventListener("click", () => {
      const name = document.getElementById("if-name").value.trim();
      if (!name) return alert("Name required.");
      const entry = { name, type: document.getElementById("if-type").value, rarity: document.getElementById("if-rarity").value, text: document.getElementById("if-text").value };
      DND_STORE.addHomebrewEntry("items", entry);
      renderTab();
    });
  }

  return { render };
})();
