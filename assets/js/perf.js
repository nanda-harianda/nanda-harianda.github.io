// Pause looping CSS animations (phone mockups, sticker sparkles) while their section is off screen.
(() => {
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle("is-offscreen", !e.isIntersecting));
  }, { rootMargin: "200px 0px" });
  document.querySelectorAll(".case, .sticker").forEach((el) => io.observe(el));
})();
