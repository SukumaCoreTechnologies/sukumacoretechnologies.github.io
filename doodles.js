(() => {
  const cv = document.getElementById("bg");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COLORS = ["#2ee66b", "#7dffa8", "#b6ff3c", "#19f0c3"];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ptr = { x: -999, y: -999 };
  let W = 300, H = 300, items = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function size() {
    W = document.documentElement.clientWidth || 300;
    H = Math.max(document.documentElement.clientHeight, window.innerHeight, 300);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function make(x, y, burst) {
    const a = Math.random() * 6.283;
    const it = {
      x: x, y: y, kind: Math.floor(Math.random() * 7), color: pick(COLORS),
      r: rnd(9, 20), rot: rnd(0, 6.28), vr: rnd(-0.015, 0.015),
      bx: rnd(-0.25, 0.25), by: rnd(-0.25, 0.25), px: 0, py: 0,
      life: burst ? rnd(60, 100) : Infinity, age: 0,
      alpha: burst ? 0.9 : rnd(0.35, 0.65)
    };
    if (burst) {
      const s = rnd(2, 5);
      it.px = Math.cos(a) * s; it.py = Math.sin(a) * s;
      it.bx = 0; it.by = 0; it.vr = rnd(-0.12, 0.12);
    }
    return it;
  }

  function path(it) {
    const r = it.r;
    ctx.beginPath();
    switch (it.kind) {
      case 0:
        for (let i = 0; i < 10; i++) {
          const rad = i % 2 ? r * 0.45 : r, t = -Math.PI / 2 + i * Math.PI / 5;
          ctx[i ? "lineTo" : "moveTo"](Math.cos(t) * rad, Math.sin(t) * rad);
        }
        ctx.closePath(); break;
      case 1: ctx.arc(0, 0, r * 0.8, 0, 6.283); break;
      case 2:
        for (let i = 0; i <= 20; i++) {
          ctx[i ? "lineTo" : "moveTo"](-r + (i / 20) * 2 * r, Math.sin(i / 20 * 9.42) * r * 0.4);
        }
        break;
      case 3:
        ctx.moveTo(-r * 0.6, -r * 0.8); ctx.lineTo(r * 0.8, 0); ctx.lineTo(-r * 0.6, r * 0.8); ctx.closePath(); break;
      case 4:
        ctx.moveTo(0, -r); ctx.lineTo(0, r * 0.8);
        ctx.moveTo(-r * 0.6, r * 0.2); ctx.lineTo(0, r * 0.85); ctx.lineTo(r * 0.6, r * 0.2); break;
      case 5:
        ctx.moveTo(-r * 0.8, 0); ctx.lineTo(r * 0.8, 0);
        ctx.moveTo(0, -r * 0.8); ctx.lineTo(0, r * 0.8); break;
      default:
        ctx.moveTo(-r, r * 0.5); ctx.lineTo(-r * 0.5, -r * 0.5); ctx.lineTo(0, r * 0.5);
        ctx.lineTo(r * 0.5, -r * 0.5); ctx.lineTo(r, r * 0.5);
    }
  }

  function step() {
    ctx.clearRect(0, 0, W, H);
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.age++;
      if (it.age > it.life) { items.splice(i, 1); continue; }
      const dx = it.x - ptr.x, dy = it.y - ptr.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 90 && d > 0.1) { const f = (90 - d) / 90 * 0.9; it.px += dx / d * f; it.py += dy / d * f; }
      it.px *= 0.95; it.py *= 0.95;
      it.x += it.bx + it.px; it.y += it.by + it.py; it.rot += it.vr;
      if (it.life === Infinity) {
        if (it.x < -30) it.x = W + 30;
        if (it.x > W + 30) it.x = -30;
        if (it.y < -30) it.y = H + 30;
        if (it.y > H + 30) it.y = -30;
      }
      const fade = it.life === Infinity ? 1 : Math.max(0, 1 - it.age / it.life);
      ctx.save();
      ctx.translate(it.x, it.y); ctx.rotate(it.rot);
      ctx.globalAlpha = it.alpha * fade;
      ctx.strokeStyle = it.color; ctx.shadowColor = it.color; ctx.shadowBlur = 8;
      ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
      path(it); ctx.stroke(); ctx.restore();
    }
    if (!reduce) requestAnimationFrame(step);
  }

  document.addEventListener("pointermove", (e) => { ptr.x = e.clientX; ptr.y = e.clientY; });
  document.addEventListener("pointerdown", (e) => {
    ptr.x = e.clientX; ptr.y = e.clientY;
    for (let i = 0; i < 9; i++) items.push(make(e.clientX, e.clientY, true));
    while (items.length > 100) {
      const k = items.findIndex((o) => o.life !== Infinity);
      if (k < 0) break;
      items.splice(k, 1);
    }
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((n) =>
    document.addEventListener(n, () => { ptr.x = -999; ptr.y = -999; }));
  window.addEventListener("resize", size);

  size();
  const count = Math.max(14, Math.min(34, Math.round(W * H / 9000)));
  for (let i = 0; i < count; i++) items.push(make(rnd(0, W), rnd(0, H), false));
  setTimeout(size, 200);
  requestAnimationFrame(step);
})();
