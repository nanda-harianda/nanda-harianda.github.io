// Framer-style motion: smooth scroll (Lenis), hero intro, word-by-word scrub, reveals,
// pinned horizontal work rail, parallax images, scroll-reactive marquee, giant contact text.
// Everything degrades to a static page if GSAP is missing or the user prefers reduced motion.
(() => {
  const html = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = document.getElementById("nav");

  // Nav: solid after the hero, hides when scrolling down, returns when scrolling up.
  let lastY = 0;
  function navOnScroll(y) {
    nav.classList.toggle("is-stuck", y > 40);
    nav.classList.toggle("is-hidden", y > 400 && y > lastY + 2);
    if (y < lastY - 2) nav.classList.remove("is-hidden");
    lastY = y;
  }

  if (reduce || !window.gsap || !window.ScrollTrigger) {
    html.classList.remove("motion");
    addEventListener("scroll", () => navOnScroll(scrollY), { passive: true });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  try {

  // Smooth scroll, synced with ScrollTrigger.
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", (e) => { ScrollTrigger.update(); navOnScroll(e.scroll); });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) =>
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        const target = id === "#top" ? 0 : document.querySelector(id);
        if (target === null) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -70 });
      })
    );
  } else {
    addEventListener("scroll", () => navOnScroll(scrollY), { passive: true });
  }

  const ease = "expo.out";

  // Hero intro.
  function heroIn() {
    gsap.fromTo(".hero h1 .line > span", { yPercent: 105, y: 0 }, { yPercent: 0, y: 0, duration: 1.3, ease, stagger: 0.12, delay: 0.1, onStart: () => html.classList.add("hero-done") });
    gsap.fromTo(".hero .sub", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, ease, delay: 0.45 });
    gsap.fromTo(".hero .ctas", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, ease, delay: 0.6 });
    gsap.fromTo(".globe-wrap", { opacity: 0, scale: 0.8, rotate: -8 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.8, ease, delay: 0.3 });
  }
  heroIn();
  // Hero drifts away as you scroll past it.
  gsap.to(".hero .wrap", { yPercent: -12, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  // Generic reveals.
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 88%",
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease, stagger: 0.08, overwrite: "auto" }),
  });

  // Word-by-word scrub on the About statement (rebuilt when the language changes).
  let wordTween = null;
  function splitWords() {
    const el = document.querySelector(".split-words");
    if (!el) return;
    if (wordTween) { wordTween.scrollTrigger && wordTween.scrollTrigger.kill(); wordTween.kill(); }
    const walk = (node) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && !c.classList.contains("w")) walk(c);
      });
    };
    walk(el);
    wordTween = gsap.to(el.querySelectorAll(".w"), {
      opacity: 1, stagger: 0.08, ease: "none",
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
    });
  }
  splitWords();

  // Parallax inside image frames.
  gsap.utils.toArray("[data-parallax]").forEach((img) => {
    const amt = parseFloat(img.dataset.parallax) || -10;
    gsap.fromTo(img, { yPercent: 0 }, { yPercent: amt, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });

  // Life cards: open up from a smaller rounded window while the image settles from a zoom.
  gsap.utils.toArray(".lcard").forEach((card, i) => {
    const img = card.querySelector(".img img");
    const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 95%", end: "top 45%", scrub: 0.6 } });
    tl.fromTo(card, { clipPath: "inset(14% 10% 14% 10% round 40px)", y: 60 }, { clipPath: "inset(0% 0% 0% 0% round 22px)", y: 0, ease: "none" }, 0);
    if (img) tl.fromTo(img, { scale: 1.3 }, { scale: 1, ease: "none" }, 0);
    const txt = card.querySelector(".txt");
    if (txt) tl.fromTo(txt, { opacity: 0, x: i % 2 ? 30 : -30 }, { opacity: 1, x: 0, ease: "none" }, 0.35);
  });

  // Work: pinned horizontal rail on wide screens, simple stagger on small ones.
  const mm = gsap.matchMedia();
  mm.add("(min-width: 901px)", () => {
    const track = document.getElementById("work-track");
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: "#work-pin", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
    });
    // Cards slide in from the right as the rail arrives (horizontal, like the rail itself).
    gsap.fromTo(".case", { x: 220, opacity: 0 }, { x: 0, opacity: 1, ease, duration: 1.2, stagger: 0.12, clearProps: "transform", scrollTrigger: { trigger: "#work-pin", start: "top 75%" } });
  });
  mm.add("(max-width: 900px)", () => {
    // Phones: the rail is a swipeable carousel; cards just slide in from the right once.
    gsap.fromTo(".case", { x: 120, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease, stagger: 0.1, clearProps: "transform", scrollTrigger: { trigger: "#work-pin", start: "top 85%" } });
  });

  // Marquee: always drifting, faster (and reversing) with scroll velocity.
  const mq = document.getElementById("marquee");
  if (mq) {
    mq.innerHTML += mq.innerHTML; // seamless loop
    let x = 0, dir = 1, boost = 0;
    let held = false;
    const strip = mq.parentElement;
    ["mouseenter", "focusin"].forEach((ev) => strip.addEventListener(ev, () => (held = true)));
    ["mouseleave", "focusout"].forEach((ev) => strip.addEventListener(ev, () => (held = false)));
    ScrollTrigger.create({ onUpdate: (self) => { dir = self.direction; boost = Math.min(Math.abs(self.getVelocity()) / 120, 12); } });
    gsap.ticker.add(() => {
      if (held) return;
      const half = mq.scrollWidth / 2;
      x -= (0.6 + boost) * dir;
      boost *= 0.92;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      mq.style.transform = `translate3d(${x}px,0,0)`;
    });
  }

  // Contact: giant text grows into place.
  gsap.fromTo(".contact-big", { scale: 0.6, opacity: 0.2 }, { scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: ".contact", start: "top bottom", end: "top 30%", scrub: true } });

  // Principles: stack in from alternating sides.
  gsap.utils.toArray(".principle").forEach((p, i) =>
    gsap.fromTo(p, { x: i % 2 ? 40 : -40 }, { x: 0, ease, duration: 1.2, scrollTrigger: { trigger: p, start: "top 90%" } })
  );

  document.addEventListener("langchange", () => {
    splitWords();
    ScrollTrigger.refresh();
  });
  addEventListener("load", () => ScrollTrigger.refresh());
  html.classList.add("motion-ready");
  } catch (err) {
    // Anything goes wrong: drop the hidden-until-animated state so all content shows.
    html.classList.remove("motion");
    gsap.set("[data-reveal], .hero .sub, .hero .ctas, .globe-wrap", { clearProps: "all" });
    console.error(err);
  }
})();
