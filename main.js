(() => {
  const root = document.documentElement;
  const ide = document.getElementById('ide');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => matchMedia('(max-width: 820px)').matches;

  // ───────── Files ─────────
  const FILES = {
    program:     { name: 'Program.cs',            lang: 'C#',       icon: 'cs' },
    about:       { name: 'About.md',              lang: 'Markdown', icon: 'md' },
    experience:  { name: 'Experience.cs',         lang: 'C#',       icon: 'cs' },
    projects:    { name: 'README.md',             lang: 'Markdown', icon: 'md',   dir: 'Projects' },
    opendxp:     { name: 'OpenDXP.csproj',        lang: 'MSBuild',  icon: 'proj', dir: 'Projects' },
    feemanager:  { name: 'FeeManager.csproj',     lang: 'MSBuild',  icon: 'proj', dir: 'Projects' },
    flagmaster:  { name: 'FlagMaster.csproj',     lang: 'MSBuild',  icon: 'proj', dir: 'Projects' },
    devforabuck: { name: 'DevForABuck.csproj',    lang: 'MSBuild',  icon: 'proj', dir: 'Projects' },
    diagnostic:  { name: 'DiagnosticCenter.html', lang: 'HTML',     icon: 'html', dir: 'Projects' },
    skills:      { name: 'appsettings.json',      lang: 'JSON',     icon: 'json' },
    contests:    { name: 'Contests.log',          lang: 'Log',      icon: 'log' },
    contact:     { name: 'Contact.http',          lang: 'HTTP',     icon: 'http' },
    resume:      { name: 'Resume.pdf',            lang: 'PDF',      icon: 'pdf' },
  };
  const ids = Object.keys(FILES);
  const findFile = (q) => {
    q = (q || '').toLowerCase().replace(/^projects\//, '');
    return ids.find((id) => id === q || FILES[id].name.toLowerCase() === q || FILES[id].name.toLowerCase().split('.')[0] === q);
  };

  const tabsEl = $('#tabs'), crumbs = $('#crumbs'), scroll = $('#scroll'), stLang = $('#stLang');
  let openTabs = [], active = null;

  function renderTabs() {
    tabsEl.innerHTML = '';
    openTabs.forEach((id) => {
      const f = FILES[id];
      const tab = document.createElement('div');
      tab.className = 'tab' + (id === active ? ' is-active' : '');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', id === active);
      tab.tabIndex = 0;
      tab.innerHTML = `<i class="ic ic-${f.icon}"></i><span>${f.name}</span><button class="tab__x" aria-label="Close ${f.name}">×</button>`;
      tab.addEventListener('click', (e) => {
        if (e.target.closest('.tab__x')) { e.stopPropagation(); closeFile(id); } else openFile(id);
      });
      tab.addEventListener('auxclick', (e) => { if (e.button === 1) closeFile(id); });
      tab.addEventListener('keydown', (e) => { if (e.key === 'Enter') openFile(id); });
      tabsEl.appendChild(tab);
    });
    const cur = tabsEl.querySelector('.is-active');
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function showPane(id) {
    $$('.pane').forEach((p) => { p.hidden = true; });
    const pane = $('#pane-' + (id || 'empty'));
    pane.hidden = false;
    scroll.scrollTop = 0;
    requestAnimationFrame(() => drawGutter(pane));
  }

  function openFile(id, { push = true } = {}) {
    if (!FILES[id]) return;
    if (!openTabs.includes(id)) openTabs.push(id);
    active = id;
    renderTabs();
    showPane(id);
    const f = FILES[id];
    crumbs.innerHTML = ['sabbir-hasan', f.dir, `<b>${f.name}</b>`].filter(Boolean).join('<i>›</i>');
    stLang.textContent = f.lang;
    $$('.file').forEach((b) => b.classList.toggle('is-active', b.dataset.file === id));
    document.title = id === 'program' ? 'Sabbir Hasan — Software Engineer' : `${f.name} · Sabbir Hasan — Software Engineer`;
    if (push && location.hash !== '#/' + id) history.replaceState(null, '', '#/' + id);
    ide.classList.remove('nav-open');
    onOpen[id] && onOpen[id]();
  }

  function closeFile(id) {
    const i = openTabs.indexOf(id);
    if (i < 0) return;
    openTabs.splice(i, 1);
    if (active === id) {
      const next = openTabs[i] || openTabs[i - 1];
      if (next) return openFile(next);
      active = null;
      renderTabs(); showPane(null);
      crumbs.innerHTML = 'sabbir-hasan';
      $$('.file').forEach((b) => b.classList.remove('is-active'));
      history.replaceState(null, '', location.pathname);
      document.title = 'Sabbir Hasan — Software Engineer';
    } else renderTabs();
  }

  // Line-number gutter, sized to the pane
  function drawGutter(pane) {
    pane.querySelector(':scope > .gutter')?.remove();
    if (pane.id === 'pane-empty' || isMobile()) return;
    const n = Math.ceil(pane.scrollHeight / 22);
    const g = document.createElement('div');
    g.className = 'gutter';
    g.setAttribute('aria-hidden', 'true');
    g.textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n');
    pane.prepend(g);
  }
  addEventListener('resize', () => { const p = $('.pane:not([hidden])'); if (p) drawGutter(p); });

  // Clicks that open files
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-file], [data-open]');
    if (!t) return;
    openFile(t.dataset.file || t.dataset.open);
  });
  $$('.folder__btn').forEach((b) => b.addEventListener('click', () => {
    const li = b.parentElement;
    li.classList.toggle('is-open');
    b.setAttribute('aria-expanded', li.classList.contains('is-open'));
  }));

  // ───────── Per-file effects ─────────
  const onOpen = {
    about() {
      const words = $$('#scrub .w');
      words.forEach((w) => w.classList.remove('lit'));
      words.forEach((w, i) => setTimeout(() => w.classList.add('lit'), reduce ? 0 : 250 + i * 55));
    },
    feemanager() {
      const b = $('.dues__bar b');
      b.classList.remove('go');
      requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add('go')));
    },
  };
  // Split the About intro into words for the reveal
  const scrub = $('#scrub');
  scrub.innerHTML = scrub.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');

  // Feature-flag switches
  $$('.flag').forEach((flag) => {
    const input = $('input', flag), bar = $('.bar b', flag), pct = $('.pct', flag);
    const set = () => {
      const p = input.checked ? flag.dataset.p : 0;
      bar.style.width = p + '%';
      pct.textContent = p + '%';
    };
    input.addEventListener('change', set);
    set();
  });

  // Bangla / English demo
  const lang = $('.lang');
  $$('.lang__switch button').forEach((btn) => btn.addEventListener('click', () => {
    $$('.lang__switch button').forEach((b) => b.classList.toggle('is-on', b === btn));
    lang.classList.add('swap');
    setTimeout(() => {
      $$('[data-bn]', lang).forEach((el) => { el.textContent = el.dataset[btn.dataset.lang]; });
      lang.classList.remove('swap');
    }, 200);
  }));

  // Lightbox
  const lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('p', lb);
  $$('.g').forEach((fig) => fig.addEventListener('click', () => {
    const img = $('img', fig);
    lbImg.src = img.src; lbImg.alt = img.alt;
    lbCap.textContent = $('figcaption', fig).textContent;
    lb.hidden = false;
  }));
  lb.addEventListener('click', (e) => { if (e.target !== lbImg) lb.hidden = true; });

  // ───────── Theme ─────────
  const toggleTheme = () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
    return root.dataset.theme;
  };
  $('#themeBtn').addEventListener('click', toggleTheme);

  // ───────── Explorer / activity bar ─────────
  $('#burger').addEventListener('click', () => ide.classList.toggle('nav-open'));
  $('#scrim').addEventListener('click', () => ide.classList.remove('nav-open'));
  $$('.act[data-act]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.act;
    if (a === 'explorer') {
      const hidden = ide.classList.toggle('no-exp');
      $('#explorer').style.display = hidden ? 'none' : '';
      ide.style.gridTemplateColumns = hidden ? '48px 0 minmax(0, 1fr)' : '';
      b.classList.toggle('is-on', !hidden);
      const p = $('.pane:not([hidden])'); if (p) drawGutter(p);
    }
    if (a === 'search') openPalette();
    if (a === 'terminal') toggleTerminal();
    if (a === 'run') { toggleTerminal(true); runCommand('dotnet run'); }
  }));

  // ───────── Command palette ─────────
  const pal = $('#palette'), palIn = $('#palIn'), palList = $('#palList');
  let palSel = 0, palItems = [];
  function renderPalette() {
    const q = palIn.value.trim().toLowerCase();
    palItems = ids.filter((id) => !q || FILES[id].name.toLowerCase().includes(q) || id.includes(q) || (FILES[id].dir || '').toLowerCase().includes(q));
    palSel = Math.min(palSel, Math.max(0, palItems.length - 1));
    palList.innerHTML = palItems.map((id, i) =>
      `<li role="option" data-id="${id}" class="${i === palSel ? 'is-sel' : ''}"><i class="ic ic-${FILES[id].icon}"></i>${FILES[id].name}<small>${FILES[id].dir || 'sabbir-hasan'}</small></li>`
    ).join('') || '<li class="muted">No matching files</li>';
  }
  function openPalette() { pal.hidden = false; palIn.value = ''; palSel = 0; renderPalette(); palIn.focus(); }
  function closePalette() { pal.hidden = true; }
  $('#omnibox').addEventListener('click', openPalette);
  palIn.addEventListener('input', () => { palSel = 0; renderPalette(); });
  palIn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { palSel = (palSel + 1) % palItems.length; renderPalette(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { palSel = (palSel - 1 + palItems.length) % palItems.length; renderPalette(); e.preventDefault(); }
    if (e.key === 'Enter' && palItems[palSel]) { closePalette(); openFile(palItems[palSel]); }
  });
  palList.addEventListener('click', (e) => { const li = e.target.closest('[data-id]'); if (li) { closePalette(); openFile(li.dataset.id); } });
  pal.addEventListener('click', (e) => { if (e.target === pal) closePalette(); });

  // ───────── Terminal ─────────
  const term = $('#terminal'), out = $('#termOut'), tin = $('#termIn'), tbody = $('#termBody');
  const hist = []; let hIdx = 0;
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function print(html, cls = '') {
    const d = document.createElement('div');
    if (cls) d.className = cls;
    d.innerHTML = html;
    out.appendChild(d);
    tbody.scrollTop = tbody.scrollHeight;
  }
  function toggleTerminal(force) {
    const open = force ?? term.classList.contains('is-closed');
    term.classList.toggle('is-closed', !open);
    $('.act[data-act="terminal"]').classList.toggle('is-on', open);
    if (open && !isMobile()) tin.focus({ preventScroll: true });
  }
  $('#termClose').addEventListener('click', () => toggleTerminal());
  $('.terminal__bar').addEventListener('click', (e) => {
    if (!e.target.closest('#termClose') && term.classList.contains('is-closed')) toggleTerminal(true);
  });
  tbody.addEventListener('click', (e) => { if (!e.target.closest('.term-link') && !getSelection().toString()) tin.focus(); });
  out.addEventListener('click', (e) => { const l = e.target.closest('.term-link'); if (l) openFile(l.dataset.id); });

  const fileLink = (id) => `<span class="term-link" data-id="${id}">${FILES[id].name}</span>`;
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  let busy = false;
  async function build() {
    busy = true;
    print('  Determining projects to restore...', 'term-dim'); await sleep(380);
    print('  Restored SabbirHasan.csproj (in 412 ms).', 'term-dim'); await sleep(320);
    print('  SabbirHasan -> bin/Release/net10.0/SabbirHasan.dll', 'term-dim'); await sleep(420);
    print('<span class="ok">Build succeeded.</span> <span class="term-dim">0 Warning(s), 0 Error(s)</span>'); await sleep(220);
    print('Verdict: <span class="ok">Accepted ✓</span>  <span class="term-dim">— type</span> <span class="k">help</span> <span class="term-dim">to look around</span>');
    busy = false;
  }

  const COMMANDS = {
    help: () => {
      print([
        '<span class="k">ls</span>                 list files',
        '<span class="k">open</span> <span class="s">&lt;file&gt;</span>        open a file (also: cat, code)',
        '<span class="k">about</span> · <span class="k">experience</span> · <span class="k">projects</span> · <span class="k">skills</span> · <span class="k">contests</span> · <span class="k">contact</span> · <span class="k">resume</span>',
        '<span class="k">whoami</span>             who is this?',
        '<span class="k">dotnet run</span>         build and run me',
        '<span class="k">submit</span>             submit a solution',
        '<span class="k">github</span> · <span class="k">linkedin</span> · <span class="k">codeforces</span> · <span class="k">email</span>',
        '<span class="k">theme</span>              toggle light / dark',
        '<span class="k">date</span> · <span class="k">clear</span> · <span class="k">exit</span>',
      ].join('\n'));
    },
    ls: () => print(ids.map((id) => (FILES[id].dir ? FILES[id].dir + '/' : '') + fileLink(id)).join('\n')),
    open: (arg) => {
      const id = findFile(arg);
      if (!arg) return print('usage: open &lt;file&gt;   e.g. <span class="k">open About.md</span>');
      if (!id) return print(`open: ${esc(arg)}: No such file. Try <span class="k">ls</span>`, 'term-err');
      openFile(id); print(`<span class="term-dim">opened</span> ${fileLink(id)}`);
    },
    whoami: () => print('Sabbir Hasan — backend engineer in Dhaka.\nC# / .NET, CQRS, event-driven systems on Azure. Competitive programmer, 2000+ problems.'),
    dotnet: async (arg) => {
      if (!/^(run|build)\b/.test(arg)) return print('usage: dotnet run | dotnet build', 'term-dim');
      await build();
      if (arg.startsWith('run')) openFile('program');
    },
    submit: async () => {
      busy = true;
      for (const n of [1, 4, 9, 17, 32]) { print(`<span class="term-dim">Running on test ${n}...</span>`); await sleep(260); }
      print('Verdict: <span class="ok">Accepted ✓</span>  <span class="term-dim">46 ms · 2.1 MB</span>');
      busy = false;
    },
    theme: () => print(`theme → ${toggleTheme()}`),
    date: () => print(new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'full', timeStyle: 'short' }) + ' (Dhaka)'),
    clear: () => { out.innerHTML = ''; },
    exit: () => toggleTerminal(false),
    github: () => { window.open('https://github.com/anik-ewu', '_blank', 'noopener'); print('opening github.com/anik-ewu ↗', 'term-dim'); },
    linkedin: () => { window.open('https://www.linkedin.com/in/sabbir-hasan-anik-2433a614b/', '_blank', 'noopener'); print('opening linkedin ↗', 'term-dim'); },
    codeforces: () => { window.open('https://codeforces.com/profile/sabbir-hasan-anik', '_blank', 'noopener'); print('opening codeforces ↗', 'term-dim'); },
    email: () => print('<a class="term-link" href="mailto:sabbirhasananik@gmail.com">sabbirhasananik@gmail.com</a>'),
    sudo: () => print('sabbir is not in the sudoers file. This incident will be reported. 🙂', 'term-err'),
  };
  COMMANDS.cat = COMMANDS.code = COMMANDS.open;
  COMMANDS.mail = COMMANDS.email;
  ['about', 'experience', 'projects', 'skills', 'contests', 'contact', 'resume'].forEach((c) => {
    COMMANDS[c] = () => { openFile(c); print(`<span class="term-dim">opened</span> ${fileLink(c)}`); };
  });
  COMMANDS.cv = COMMANDS.resume;

  async function runCommand(raw) {
    const line = raw.trim();
    print(`<span class="ok">sabbir</span>@<span class="k">portfolio</span> <span class="muted">~</span> $ <span class="term-cmd">${esc(line)}</span>`);
    if (!line) return;
    hist.push(line); hIdx = hist.length;
    const [cmd, ...rest] = line.split(/\s+/);
    const fn = COMMANDS[cmd.toLowerCase()];
    if (fn) await fn(rest.join(' '));
    else print(`${esc(cmd)}: command not found. Type <span class="k">help</span>`, 'term-err');
  }
  tin.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { if (busy) return; const v = tin.value; tin.value = ''; runCommand(v); }
    if (e.key === 'ArrowUp' && hist.length) { hIdx = Math.max(0, hIdx - 1); tin.value = hist[hIdx]; e.preventDefault(); }
    if (e.key === 'ArrowDown' && hist.length) { hIdx = Math.min(hist.length, hIdx + 1); tin.value = hist[hIdx] || ''; e.preventDefault(); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const v = tin.value.toLowerCase();
      const m = Object.keys(COMMANDS).filter((c) => c.startsWith(v));
      if (v && m.length === 1) tin.value = m[0] + ' ';
      else if (m.length > 1 && v) print(m.join('  '), 'term-dim');
    }
    if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.innerHTML = ''; }
  });

  // ───────── Global keys ─────────
  addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'p') { e.preventDefault(); pal.hidden ? openPalette() : closePalette(); }
    if (e.ctrlKey && e.key === '`') { e.preventDefault(); toggleTerminal(); }
    if (e.key === 'Escape') { closePalette(); lb.hidden = true; ide.classList.remove('nav-open'); }
  });

  // ───────── Status bar clock ─────────
  const clock = $('#stClock');
  const tick = () => { clock.textContent = 'Dhaka ' + new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' }); };
  tick(); setInterval(tick, 30000);

  // ───────── Typing line on Program.cs ─────────
  const typed = $('#typed');
  const phrases = ['building distributed services on Azure', 'designing CQRS + event-driven systems', 'on call for Swiss insurers', 'solving one more Codeforces problem'];
  if (!typed) {}
  else if (reduce) typed.textContent = phrases[0];
  else (async function loop() {
    for (let i = 0; ; i = (i + 1) % phrases.length) {
      const p = phrases[i];
      for (let k = 1; k <= p.length; k++) { typed.textContent = p.slice(0, k); await sleep(42); }
      await sleep(1800);
      for (let k = p.length; k >= 0; k--) { typed.textContent = p.slice(0, k); await sleep(18); }
      await sleep(300);
    }
  })();

  // ───────── Dot field on Program.cs ─────────
  // Dots drift gently and part around the cursor. With no mouse, a ghost cursor wanders.
  const canvas = $('#field');
  (function field() {
    const ctx = canvas.getContext('2d');
    const host = canvas.parentElement;
    const GAP = 26, R = 140, PUSH = 30;
    let w = 0, h = 0, dots = [], dotC, acC, running = false, raf, t0 = performance.now();
    const ptr = { x: 0, y: 0, last: -1e9 }, cur = { x: -1, y: -1 };
    const colors = () => { const s = getComputedStyle(root); dotC = s.getPropertyValue('--muted').trim(); acC = s.getPropertyValue('--ac').trim(); };
    const build = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = host.clientWidth; h = host.clientHeight;
      if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = (h % GAP) / 2; y <= h; y += GAP)
        for (let x = (w % GAP) / 2; x <= w; x += GAP) dots.push({ bx: x, by: y, x, y });
    };
    const frame = (now) => {
      const t = (now - t0) / 1000;
      if (now - ptr.last > 2500) {
        const gx = w * (0.72 + 0.2 * Math.sin(t * 0.37)), gy = h * (0.4 + 0.25 * Math.sin(t * 0.53 + 1));
        if (cur.x < 0) { cur.x = gx; cur.y = gy; }
        cur.x += (gx - cur.x) * 0.03; cur.y += (gy - cur.y) * 0.03;
      } else { cur.x += (ptr.x - cur.x) * 0.18; cur.y += (ptr.y - cur.y) * 0.18; }
      ctx.clearRect(0, 0, w, h);
      const intro = Math.min(1, t / 1.6), fx = w * 0.78, fy = h * 0.42, maxD = Math.hypot(w, h) * 0.7;
      for (const d of dots) {
        let tx = d.bx, ty = d.by + Math.sin(t * 0.8 + d.bx * 0.012 + d.by * 0.017) * 1.6, k = 0;
        const dx = d.bx - cur.x, dy = d.by - cur.y, dist = Math.hypot(dx, dy);
        if (dist < R && dist > 0.01) { k = (1 - dist / R) ** 2; tx += (dx / dist) * PUSH * k; ty += (dy / dist) * PUSH * k; }
        d.x += (tx - d.x) * 0.14; d.y += (ty - d.y) * 0.14;
        const rv = Math.max(0, Math.min(1, intro * 1.8 - Math.hypot(d.bx - fx, d.by - fy) / maxD));
        if (!rv) continue;
        ctx.globalAlpha = rv * (0.32 + 0.68 * k);
        ctx.fillStyle = k > 0.08 ? acC : dotC;
        ctx.beginPath(); ctx.arc(d.x, d.y, 1.1 + 2 * k, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (running) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!running && !reduce && w) { running = true; raf = requestAnimationFrame(frame); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    colors();
    new ResizeObserver(() => { build(); if (reduce && w) frame(t0 + 5000); else start(); }).observe(host);
    new MutationObserver(colors).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(host);
    host.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = canvas.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.last = performance.now();
    }, { passive: true });
    host.addEventListener('pointerleave', () => { ptr.last = -1e9; });
  })();

  // ───────── Boot ─────────
  const fromHash = location.hash.replace(/^#\/?/, '');
  openFile('program', { push: false });
  if (FILES[fromHash] && fromHash !== 'program') openFile(fromHash);
  addEventListener('hashchange', () => { const id = location.hash.replace(/^#\/?/, ''); if (FILES[id] && id !== active) openFile(id, { push: false }); });

  (async () => {
    print('<span class="ok">sabbir</span>@<span class="k">portfolio</span> <span class="muted">~</span> $ <span class="term-cmd">dotnet run --project SabbirHasan</span>');
    await sleep(300);
    await build();
    if (isMobile()) { await sleep(2500); toggleTerminal(false); }
  })();
})();
