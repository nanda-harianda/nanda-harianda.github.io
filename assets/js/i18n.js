// EN / ID switcher. English is written in the markup; Indonesian comes from #i18n-id.
// Choice order: saved choice, then browser language, then English.
(() => {
  const read = (id) => {
    const el = document.getElementById(id);
    try { return el ? JSON.parse(el.textContent) : {}; } catch { return {}; }
  };
  const dict = { en: read("i18n-en-extra"), id: read("i18n-id") };
  const nodes = [...document.querySelectorAll("[data-i18n]")];
  nodes.forEach((el) => { el.dataset.en = el.innerHTML; });
  const enTitle = document.title;
  const alts = [...document.querySelectorAll("[data-i18n-alt]")];
  alts.forEach((el) => { el.dataset.enAlt = el.alt; });
  const arias = [...document.querySelectorAll("[data-i18n-aria]")];
  arias.forEach((el) => { el.dataset.enAria = el.getAttribute("aria-label"); });

  const store = {
    get() { try { return localStorage.getItem("lang"); } catch { return null; } },
    set(v) { try { localStorage.setItem("lang", v); } catch { /* private mode */ } },
  };
  const browserLang = (navigator.languages || [navigator.language || "en"])
    .some((l) => /^(id|in)\b/i.test(l)) ? "id" : "en";

  const api = {
    lang: "en",
    t(key) {
      return (api.lang === "id" && dict.id[key]) || dict.en[key] || "";
    },
    set(lang) {
      api.lang = lang === "id" ? "id" : "en";
      document.documentElement.lang = api.lang;
      nodes.forEach((el) => {
        const v = api.lang === "id" ? dict.id[el.dataset.i18n] : null;
        el.innerHTML = v || el.dataset.en;
      });
      alts.forEach((el) => { el.alt = (api.lang === "id" && dict.id[el.dataset.i18nAlt]) || el.dataset.enAlt; });
      arias.forEach((el) => el.setAttribute("aria-label", (api.lang === "id" && dict.id[el.dataset.i18nAria]) || el.dataset.enAria));
      document.title = (api.lang === "id" && dict.id["doc.title"]) || enTitle;
      document.querySelectorAll("[data-lang]").forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.lang === api.lang))
      );
      document.dispatchEvent(new CustomEvent("langchange", { detail: api.lang }));
    },
  };
  window.NAND_I18N = api;

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]");
    if (!b) return;
    store.set(b.dataset.lang);
    api.set(b.dataset.lang);
  });

  api.set(store.get() || browserLang);
})();
