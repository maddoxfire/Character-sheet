const Router = (() => {
  function parse(hash) {
    const path = (hash || "#/").replace(/^#/, "");
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 0) return { view: "home" };
    if (parts[0] === "new") return { view: "builder", params: {} };
    if (parts[0] === "homebrew") return { view: "homebrew" };
    if (parts[0] === "character" && parts[1]) {
      if (parts[2] === "edit") return { view: "builder", params: { id: parts[1] } };
      return { view: "sheet", params: { id: parts[1] } };
    }
    return { view: "home" };
  }

  function resolve() {
    const container = document.getElementById("app");
    const { view, params } = parse(window.location.hash);
    window.scrollTo(0, 0);
    if (view === "home") return HomeView.render(container);
    if (view === "builder") return BuilderView.render(container, params);
    if (view === "sheet") return SheetView.render(container, params);
    if (view === "homebrew") return HomebrewView.render(container);
  }

  function start() {
    window.addEventListener("hashchange", resolve);
    resolve();
  }

  return { start };
})();
