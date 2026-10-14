(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Theme toggle
  document.getElementById('theme').addEventListener('click', () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  });

  // Nav border on scroll
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Judge rows come in one at a time, like verdicts
  document.querySelectorAll('#judge li').forEach((li, i) => {
    setTimeout(() => li.classList.add('in'), reduce ? 0 : 1200 + i * 320);
  });

  // Hero dot field: dots drift gently, part around the cursor and spring back.
  // Without a mouse (touch, or before the first move) a ghost cursor wanders instead.
  const canvas = document.getElementById('field');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const hero = canvas.parentElement;
    const GAP = 28, R = 150, PUSH = 34;
    let w, h, dpr, dots = [], ink, ac, running = false, raf, t0 = performance.now();
    const ptr = { x: -9999, y: -9999, active: false, last: 0 };
    const cur = { x: -9999, y: -9999 };

    const readColors = () => {
      const s = getComputedStyle(root);
      ink = s.getPropertyValue('--ink').trim();
      ac = s.getPropertyValue('--ac').trim();
    };
    const build = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const ox = (w % GAP) / 2, oy = (h % GAP) / 2;
      for (let y = oy; y <= h; y += GAP)
        for (let x = ox; x <= w; x += GAP) dots.push({ bx: x, by: y, x, y });
    };

    const frame = (now) => {
      const t = (now - t0) / 1000;
      // ghost cursor when the pointer is idle
      if (!ptr.active || now - ptr.last > 2500) {
        const gx = w * (0.62 + 0.26 * Math.sin(t * 0.37));
        const gy = h * (0.42 + 0.22 * Math.sin(t * 0.53 + 1));
        cur.x += (gx - cur.x) * 0.03; cur.y += (gy - cur.y) * 0.03;
        if (cur.x < -1000) { cur.x = gx; cur.y = gy; }
      } else {
        cur.x += (ptr.x - cur.x) * 0.18; cur.y += (ptr.y - cur.y) * 0.18;
      }
      ctx.clearRect(0, 0, w, h);
      const intro = Math.min(1, t / 1.6);
      const cx = w * 0.7, cy = h * 0.4, maxD = Math.hypot(w, h) * 0.7;
      for (const d of dots) {
        const wave = Math.sin(t * 0.8 + d.bx * 0.012 + d.by * 0.017) * 1.6;
        let tx = d.bx, ty = d.by + wave, k = 0;
        const dx = d.bx - cur.x, dy = d.by - cur.y, dist = Math.hypot(dx, dy);
        if (dist < R && dist > 0.01) {
          k = 1 - dist / R; k *= k;
          tx += (dx / dist) * PUSH * k; ty += (dy / dist) * PUSH * k;
        }
        d.x += (tx - d.x) * 0.14; d.y += (ty - d.y) * 0.14;
        // fade in outward from the focal point
        const reveal = Math.max(0, Math.min(1, intro * 1.8 - Math.hypot(d.bx - cx, d.by - cy) / maxD));
        if (!reveal) continue;
        ctx.globalAlpha = reveal * (0.22 + 0.7 * k);
        ctx.fillStyle = k > 0.08 ? ac : ink;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.1 + 1.9 * k, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (running) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!running && !reduce) { running = true; raf = requestAnimationFrame(frame); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    readColors(); build();
    if (reduce) frame(t0 + 5000); else start();
    new ResizeObserver(() => { build(); if (reduce) frame(t0 + 5000); }).observe(hero);
    new MutationObserver(readColors).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColors);
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(hero);
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = canvas.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
      ptr.active = true; ptr.last = performance.now();
    }, { passive: true });
    document.addEventListener('pointerleave', () => { ptr.active = false; });
  }

  // Magnetic buttons: lean toward the cursor a little
  if (!reduce && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // Active nav link
  const links = [...document.querySelectorAll('.nav__links a')];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });

  // Feature-flag toggles
  document.querySelectorAll('.flag').forEach((flag) => {
    const input = flag.querySelector('input');
    const pct = flag.querySelector('.muted');
    const bar = flag.querySelector('.bar b');
    const set = () => {
      flag.classList.toggle('off', !input.checked);
      if (input.checked && bar.style.getPropertyValue('--p') === '0%') bar.style.setProperty('--p', '10%');
      pct.textContent = input.checked ? bar.style.getPropertyValue('--p') : '0%';
    };
    input.addEventListener('change', set);
    set();
  });

  // Lightbox
  const lb = document.getElementById('lightbox');
  const lbImg = lb.querySelector('img');
  const lbCap = lb.querySelector('p');
  document.querySelectorAll('.g').forEach((fig) => {
    fig.addEventListener('click', () => {
      const img = fig.querySelector('img');
      lbImg.src = img.src; lbImg.alt = img.alt;
      lbCap.textContent = fig.querySelector('figcaption').textContent;
      lb.hidden = false;
    });
  });
  const close = () => { lb.hidden = true; };
  lb.addEventListener('click', (e) => { if (e.target !== lbImg) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
