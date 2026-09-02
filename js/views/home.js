const HomeView = (() => {
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function render(container) {
    const characters = DND_STORE.loadCharacters().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    container.innerHTML = `
      <div class="home-wrap">
        <div class="home-hero">
          <h1>Your Characters</h1>
          <p>Build a D&amp;D 5e character, track it in play, and add your own homebrew races, classes, feats, spells, and items.</p>
          <div class="home-actions">
            <a href="#/new" class="btn">+ New Character</a>
            <a href="#/homebrew" class="btn btn-ghost">Manage Homebrew Content</a>
          </div>
        </div>
        <div class="char-grid" id="char-grid"></div>
      </div>`;

    const grid = document.getElementById("char-grid");
    if (!characters.length) {
      grid.innerHTML = `<div class="empty-state">No characters yet. <a href="#/new">Create your first one</a>.</div>`;
      return;
    }
    characters.forEach((c) => {
      const cls = DND_STORE.findById(DND_STORE.getClasses(), c.classId);
      const race = DND_STORE.findById(DND_STORE.getRaces(), c.raceId);
      const card = document.createElement("a");
      card.href = `#/character/${c.id}`;
      card.className = "char-card";
      card.innerHTML = `
        <h3>${escapeHtml(c.name || "Unnamed")}</h3>
        <p class="char-card-sub">Level ${c.level || 1} ${escapeHtml(cls ? cls.name : "—")}</p>
        <p class="char-card-sub">${escapeHtml(race ? race.name : "—")}</p>`;
      grid.appendChild(card);
    });
  }

  return { render };
})();
