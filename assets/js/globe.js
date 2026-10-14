// "Globe of me": cards spread over a sphere (Fibonacci layout), auto-spin, drag/swipe to spin.
// Each card always faces the viewer; depth drives scale, opacity and stacking.
(() => {
  const globe = document.getElementById("globe");
  const inner = document.getElementById("globe-inner");
  if (!globe || !inner) return;
  const cards = [...inner.children];
  const n = cards.length;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return; // CSS shows a static grid instead

  // Points on a unit sphere. Squash the poles a little so cards don't pile up at top/bottom.
  const pts = cards.map((_, i) => {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = i * Math.PI * (3 - Math.sqrt(5));
    return { x: Math.cos(theta) * r, y: y * 0.82, z: Math.sin(theta) * r };
  });

  let rotY = 0, rotX = -0.18, velY = reduce ? 0 : 0.0035, velX = 0;
  let dragging = false, lastX = 0, lastY = 0, visible = true, radius = 0;
  const auto = reduce ? 0 : 0.0035;

  const measure = () => { radius = globe.clientWidth * 0.38; };
  new ResizeObserver(measure).observe(globe);
  measure();

  function frame() {
    if (visible && !document.hidden) {
      if (!dragging) {
        velY += (auto - velY) * 0.02; // ease back to cruising speed after a flick
        velX *= 0.94;
        rotX += velX;
        rotX += (-0.18 - rotX) * 0.02;
      }
      rotY += velY;
      const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
      for (let i = 0; i < n; i++) {
        const p = pts[i];
        const x1 = p.x * cy + p.z * sy;
        const z1 = -p.x * sy + p.z * cy;
        const y2 = p.y * cx - z1 * sx;
        const z2 = p.y * sx + z1 * cx;
        const depth = (z2 + 1) / 2; // 0 back, 1 front
        const s = 0.55 + depth * 0.6;
        const el = cards[i];
        el.style.transform = `translate3d(${x1 * radius}px, ${y2 * radius}px, 0) scale(${s})`;
        el.style.opacity = (0.25 + depth * 0.75).toFixed(3);
        const z = Math.round(depth * 100);
        if (el._z !== z) { el.style.zIndex = String(z); el._z = z; } // only restack when the order changes
        // no per-frame blur: it forced every back card to repaint 60 times a second
      }
    }
    requestAnimationFrame(frame);
  }

  globe.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    globe.setPointerCapture(e.pointerId);
  });
  globe.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    velY = dx * 0.006; rotY += dx * 0.006;
    velX = dy * 0.002; rotX = Math.max(-0.7, Math.min(0.7, rotX + dy * 0.004));
  });
  const end = () => { dragging = false; };
  globe.addEventListener("pointerup", end);
  globe.addEventListener("pointercancel", end);

  // Keyboard: arrows spin it too.
  globe.tabIndex = 0;
  globe.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { velY = -0.06; e.preventDefault(); }
    if (e.key === "ArrowRight") { velY = 0.06; e.preventDefault(); }
  });

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(globe);
  requestAnimationFrame(frame);
})();
