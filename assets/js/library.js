// Project library: category filter chips.
(() => {
  const btns = document.querySelectorAll(".mw-f");
  const rows = document.querySelectorAll(".mw-row");
  btns.forEach((b) => b.addEventListener("click", () => {
    btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    rows.forEach((r) => { r.hidden = b.dataset.f !== "all" && r.dataset.cat !== b.dataset.f; });
  }));
})();
