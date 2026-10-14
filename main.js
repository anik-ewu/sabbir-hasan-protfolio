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
    setTimeout(() => li.classList.add('in'), reduce ? 0 : 500 + i * 380);
  });

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
