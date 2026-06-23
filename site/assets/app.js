/* ============================================================
   Claude Orchestration — site behavior
   Loads generated data, renders the catalog, wires up search,
   category filters, progressive-disclosure cards, animated
   counters, scroll reveals, copy buttons and nav state.
   ============================================================ */

const CATEGORY_ACCENT = {
  'AI & Claude Code': 'var(--c-ai)',
  'Infrastructure & DevOps': 'var(--c-infra)',
  'Frontend & Design': 'var(--c-frontend)',
  'Backend & APIs': 'var(--c-backend)',
  'Project Management': 'var(--c-pm)',
  'Lobbi Domain': 'var(--c-lobbi)',
  'Microsoft & Enterprise': 'var(--c-ms)',
  'Marketplace & Platform': 'var(--c-market)',
  Other: 'var(--ember)',
};

const state = { data: null, query: '', category: 'All', sort: 'name', stack: null };

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let lastFocused = null;
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
function trapTab(container, e) {
  if (e.key !== 'Tab') return;
  const f = $$(FOCUSABLE, container).filter((el) => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
function restoreFocus() { try { lastFocused?.focus(); } catch { /* gone */ } lastFocused = null; }
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ── boot ──────────────────────────────────────────────────── */
init();

async function init() {
  initTheme();
  wireNav();
  wireScrollReveal();
  wireCopyButtons();
  wireBackToTop();
  wireShortcuts();
  renderSkeletons();

  try {
    const res = await fetch('./data/plugins.json', { cache: 'no-cache' });
    state.data = await res.json();
  } catch (err) {
    console.error('Failed to load catalog data', err);
    renderError();
    return;
  }

  readUrlState();
  bindData(state.data);
  renderSubplugins(state.data.subplugins);
  renderStacks(state.data.stacks);
  buildFilters(state.data);
  wireSort();
  renderGrid();
  wireSearch();
  observeStats();
  injectJsonLd(state.data);
  wireModal();
  wirePalette();
  wireScrollspy();
  syncHash();
}

/* ── loading skeletons ─────────────────────────────────────── */
function renderSkeletons(n = 6) {
  const grid = $('#pluginGrid');
  if (grid) grid.innerHTML = Array.from({ length: n }, () => '<div class="skeleton" aria-hidden="true"></div>').join('');
}

/* ── scrollspy (active nav link) ───────────────────────────── */
function wireScrollspy() {
  const links = $$('.nav__links a[href^="#"]');
  const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const sections = [...map.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.remove('is-current'));
        map.get(e.target.id)?.classList.add('is-current');
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => io.observe(s));
}

/* ── command palette (⌘K) ──────────────────────────────────── */
function wirePalette() {
  const pal = $('#palette');
  const input = $('#paletteInput');
  const results = $('#paletteResults');
  let items = [];
  let active = 0;

  const sections = [
    { type: 'section', icon: '◳', name: 'Catalog', sub: 'Browse plugins', href: '#catalog' },
    { type: 'section', icon: '✦', name: 'Curated stacks', sub: 'Bundles', href: '#stacks' },
    { type: 'section', icon: '①', name: 'How it works', sub: 'Get started', href: '#how' },
    { type: 'section', icon: '◎', name: 'Architecture', sub: 'Anatomy', href: '#architecture' },
    { type: 'section', icon: '⬇', name: 'Install', sub: 'Setup', href: '#install' },
  ];

  function build(q) {
    const query = q.trim().toLowerCase();
    const plugins = state.data.plugins
      .filter((p) => !query || p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) || (p.keywords || []).some((k) => k.includes(query)))
      .slice(0, 8)
      .map((p) => ({ type: 'plugin', icon: '◆', name: p.name, sub: p.category, plugin: p.name }));
    const secs = sections.filter((s) => !query || s.name.toLowerCase().includes(query));
    items = query ? [...plugins, ...secs] : [...secs, ...plugins];
    active = 0;
    paint();
  }

  function paint() {
    if (!items.length) { results.innerHTML = '<li class="palette__empty">No matches</li>'; return; }
    results.innerHTML = items
      .map((it, i) => `<li class="palette__item${i === active ? ' is-active' : ''}" role="option" data-i="${i}"><span class="pi-icon">${esc(it.icon)}</span><span class="pi-name">${esc(it.name)}</span><span class="pi-sub">${esc(it.sub)}</span></li>`)
      .join('');
  }

  function choose(it) {
    if (!it) return;
    close();
    if (it.type === 'plugin') openPlugin(it.plugin);
    else document.querySelector(it.href)?.scrollIntoView({ behavior: 'smooth' });
  }

  function open() {
    if (pal.hidden) lastFocused = document.activeElement;
    pal.hidden = false;
    document.body.style.overflow = 'hidden';
    input.value = '';
    build('');
    setTimeout(() => input.focus(), 30);
  }
  function close() {
    if (pal.hidden) return;
    pal.hidden = true;
    document.body.style.overflow = '';
    restoreFocus();
  }

  $('#paletteOpen')?.addEventListener('click', open);
  pal.addEventListener('click', (e) => { if (e.target.closest('[data-palette-close]')) close(); });
  $('.palette__panel', pal).addEventListener('keydown', (e) => trapTab($('.palette__panel', pal), e));
  results.addEventListener('mousemove', (e) => { const li = e.target.closest('.palette__item'); if (li) { active = +li.dataset.i; paint(); } });
  results.addEventListener('click', (e) => { const li = e.target.closest('.palette__item'); if (li) choose(items[+li.dataset.i]); });
  input.addEventListener('input', () => build(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % items.length; paint(); scrollActive(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + items.length) % items.length; paint(); scrollActive(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(items[active]); }
    else if (e.key === 'Escape') { close(); }
  });
  function scrollActive() { results.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' }); }
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.hidden ? open() : close(); }
  });
}

/* ── theme ─────────────────────────────────────────────────── */
function initTheme() {
  const stored = localStorage.getItem('co-theme');
  const sys = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.dataset.theme = stored || sys;
  $('#themeToggle')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('co-theme', next);
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.content = next === 'light' ? '#f6f7fb' : '#0a0a12';
  });
}

/* ── url state (?q=&cat=&sort=) ────────────────────────────── */
function readUrlState() {
  const p = new URLSearchParams(location.search);
  if (p.get('q')) { state.query = p.get('q').toLowerCase(); const i = $('#search'); if (i) i.value = p.get('q'); }
  if (p.get('cat') && state.data.categories.includes(p.get('cat'))) state.category = p.get('cat');
  if (['name', 'agents', 'skills', 'commands', 'category'].includes(p.get('sort'))) state.sort = p.get('sort');
}

function writeUrlState() {
  const p = new URLSearchParams();
  if (state.query) p.set('q', state.query);
  if (state.category !== 'All') p.set('cat', state.category);
  if (state.sort !== 'name') p.set('sort', state.sort);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

/* ── data binding ([data-bind="path.to.value"]) ───────────── */
function bindData(data) {
  $$('[data-bind]').forEach((el) => {
    const val = el.getAttribute('data-bind').split('.').reduce((o, k) => (o == null ? o : o[k]), data);
    if (val == null) return;
    if (el.hasAttribute('data-count')) el.dataset.target = val;
    else el.textContent = val;
  });
  const t = $('#genTime');
  if (t && data.meta.generatedAt) {
    const d = new Date(data.meta.generatedAt);
    t.dateTime = data.meta.generatedAt;
    t.textContent = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}

/* ── animated counters ─────────────────────────────────────── */
function observeStats() {
  const els = $$('[data-count]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      animateCount(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  els.forEach((el) => io.observe(el));
}

function animateCount(el) {
  const target = Number(el.dataset.target || el.textContent) || 0;
  const dur = 1400;
  const start = performance.now();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { el.textContent = target.toLocaleString(); return; }
  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ── category filters ──────────────────────────────────────── */
function buildFilters(data) {
  const wrap = $('#filters');
  const counts = data.plugins.reduce((m, p) => ((m[p.category] = (m[p.category] || 0) + 1), m), {});
  const cats = ['All', ...data.categories];
  wrap.innerHTML = cats
    .map((c) => {
      const n = c === 'All' ? data.plugins.length : counts[c] || 0;
      const active = c === state.category || (state.category === 'All' && c === 'All');
      return `<button class="pill${active ? ' is-active' : ''}" role="tab" aria-selected="${active}" data-cat="${esc(c)}">${esc(c)}<span class="pill__count">${n}</span></button>`;
    })
    .join('');
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    state.category = btn.dataset.cat;
    state.stack = null;
    $$('.pill', wrap).forEach((p) => { const on = p === btn; p.classList.toggle('is-active', on); p.setAttribute('aria-selected', String(on)); });
    renderGrid();
  });
}

/* ── sort ──────────────────────────────────────────────────── */
function wireSort() {
  const sel = $('#sort');
  if (!sel) return;
  sel.value = state.sort;
  sel.addEventListener('change', () => { state.sort = sel.value; renderGrid(); });
}

function sortPlugins(list) {
  const by = state.sort;
  const arr = [...list];
  if (by === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
  else if (by === 'category') arr.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  else arr.sort((a, b) => (b.counts[by] || 0) - (a.counts[by] || 0) || a.name.localeCompare(b.name));
  return arr;
}

/* ── search ────────────────────────────────────────────────── */
function wireSearch() {
  const input = $('#search');
  let t;
  input.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.query = input.value.trim().toLowerCase();
      renderGrid();
    }, 110);
  });
  $('#clearSearch')?.addEventListener('click', clearAll);
}

function clearAll() {
  const input = $('#search');
  if (input) input.value = '';
  state.query = '';
  state.category = 'All';
  state.stack = null;
  $$('.pill').forEach((p) => { const on = p.dataset.cat === 'All'; p.classList.toggle('is-active', on); p.setAttribute('aria-selected', String(on)); });
  renderGrid();
}

/* ── grid render ───────────────────────────────────────────── */
function filtered() {
  const { plugins } = state.data;
  return plugins.filter((p) => {
    if (state.stack && !state.stack.set.has(p.name)) return false;
    if (state.category !== 'All' && p.category !== state.category) return false;
    if (!state.query) return true;
    const hay = `${p.name} ${p.description} ${p.category} ${p.author} ${(p.keywords || []).join(' ')}`.toLowerCase();
    return hay.includes(state.query);
  });
}

function renderGrid() {
  const grid = $('#pluginGrid');
  const list = sortPlugins(filtered());
  const countEl = $('#resultCount');
  const empty = $('#emptyState');

  empty.hidden = list.length !== 0;
  const banner = state.stack ? `<span class="resultchip">Stack: ${esc(state.stack.title)} <button class="linklike" id="clearStack">clear</button></span> ` : '';
  countEl.innerHTML = list.length
    ? `${banner}Showing ${list.length} of ${state.data.plugins.length} plugins`
    : banner;
  $('#clearStack')?.addEventListener('click', clearAll);

  grid.innerHTML = list.map((p, i) => cardHtml(p, i)).join('');
  wireCards(grid);
  writeUrlState();
}

function metric(label, n) {
  return n > 0 ? `<span class="metric"><strong>${n}</strong> ${label}</span>` : '';
}

function cardHtml(p, i) {
  const accent = CATEGORY_ACCENT[p.category] || 'var(--ember)';
  const c = p.counts;
  const metrics = [
    metric('cmd', c.commands),
    metric('agents', c.agents),
    metric('skills', c.skills),
    metric('hooks', c.hooks),
    p.mcp ? '<span class="metric metric--mcp">◆ MCP</span>' : '',
  ].join('');

  return `
  <article class="card" data-plugin="${esc(p.name)}" tabindex="0" role="button" aria-label="${esc(p.name)} — view details" style="--accent:${accent};animation-delay:${Math.min(i * 30, 450)}ms">
    <div class="card__body">
      <div class="card__top">
        <span class="card__cat">${esc(p.category)}</span>
        <span class="card__ver">v${esc(p.version)}</span>
      </div>
      <h3 class="card__name">${esc(p.name)}</h3>
      <p class="card__desc">${esc(p.description)}</p>
      <div class="card__metrics">${metrics}</div>
    </div>
    <div class="card__foot">
      <span class="card__author">by ${esc(p.author)}</span>
      <button class="card__toggle" data-card-copy="/plugin install ${esc(p.name)}" aria-label="Copy install command">
        Copy install
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
      </button>
    </div>
  </article>`;
}

function wireCards(grid) {
  $$('.card', grid).forEach((card) => {
    const open = () => openPlugin(card.dataset.plugin);
    card.addEventListener('click', (e) => { if (!e.target.closest('[data-card-copy]')) open(); });
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  $$('[data-card-copy]', grid).forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(btn.dataset.cardCopy);
        btn.classList.add('is-copied');
        setTimeout(() => btn.classList.remove('is-copied'), 1500);
      } catch { /* clipboard unavailable */ }
    });
  });
}

/* ── plugin detail modal ───────────────────────────────────── */
function openPlugin(name) {
  const p = state.data.plugins.find((x) => x.name === name);
  if (!p) return;
  const accent = CATEGORY_ACCENT[p.category] || 'var(--ember)';
  const c = p.counts;
  const repoUrl = `${state.data.meta.repo}/tree/main/${p.source.replace(/^\.\//, '')}`;
  const author = p.authorUrl
    ? `<a href="${esc(p.authorUrl)}" target="_blank" rel="noopener">${esc(p.author)}</a>`
    : esc(p.author);
  const statCell = (n, label) => (n > 0 ? `<div class="modal__stat"><strong>${n}</strong><span>${label}</span></div>` : '');
  const stats = [
    statCell(c.commands, 'commands'),
    statCell(c.agents, 'agents'),
    statCell(c.skills, 'skills'),
    statCell(c.hooks, 'hooks'),
    p.mcp ? '<div class="modal__stat"><strong>◆</strong><span>MCP</span></div>' : '',
  ].join('');
  const tags = (p.keywords || []).map((k) => `<span class="tag">${esc(k)}</span>`).join('');

  $('#modalContent').innerHTML = `
    <div class="modal__bar" style="background:${accent}"></div>
    <span class="modal__cat" style="color:${accent}">${esc(p.category)}</span>
    <h2 class="modal__title" id="modalTitle">${esc(p.name)}</h2>
    <div class="modal__meta">
      <span>v${esc(p.version)}</span><span>by ${author}</span><span>${esc(p.license)} license</span>
    </div>
    <p class="modal__desc">${esc(p.description)}</p>
    ${stats ? `<div class="modal__grid">${stats}</div>` : ''}
    ${tags ? `<p class="modal__h">Keywords</p><div class="tags">${tags}</div>` : ''}
    <p class="modal__h">Install</p>
    <div class="card__install">
      <code>/plugin install ${esc(p.name)}</code>
      <button class="card__copy" data-card-copy="/plugin install ${esc(p.name)}" aria-label="Copy install command">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
      </button>
    </div>
    <div class="modal__actions">
      <a class="btn btn--primary" href="${esc(repoUrl)}" target="_blank" rel="noopener">View source on GitHub</a>
      <button class="btn btn--ghost" data-close>Close</button>
    </div>`;

  const modal = $('#pluginModal');
  if (modal.hidden && !lastFocused) lastFocused = document.activeElement;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  $('.modal__dialog', modal).focus();
  if (location.hash !== `#plugin/${name}`) history.pushState(null, '', `#plugin/${name}`);
  $$('[data-card-copy]', modal).forEach((btn) =>
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(btn.dataset.cardCopy); btn.classList.add('is-copied'); setTimeout(() => btn.classList.remove('is-copied'), 1500); } catch {}
    }),
  );
}

function closeModal(clearHash = true) {
  const modal = $('#pluginModal');
  if (modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  if (clearHash && location.hash.startsWith('#plugin/')) history.pushState(null, '', location.pathname + location.search);
  restoreFocus();
}

function wireModal() {
  const modal = $('#pluginModal');
  const dialog = $('.modal__dialog', modal);
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
  dialog.addEventListener('keydown', (e) => trapTab(dialog, e));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
  window.addEventListener('hashchange', syncHash);
}

function syncHash() {
  const m = location.hash.match(/^#plugin\/(.+)$/);
  if (m) openPlugin(decodeURIComponent(m[1]));
  else closeModal(false);
}

/* ── curated stacks ────────────────────────────────────────── */
function renderStacks(stacks) {
  const wrap = $('#stackGrid');
  if (!wrap || !stacks) return;
  wrap.innerHTML = stacks
    .map((s) => {
      const members = s.plugins.map((n) => `<span class="stack__member">${esc(n)}</span>`).join('');
      const c = s.counts;
      const totals = [c.commands && `${c.commands} cmd`, c.agents && `${c.agents} agents`, c.skills && `${c.skills} skills`].filter(Boolean).join(' · ');
      return `
      <button class="stack" data-stack="${esc(s.id)}">
        <span class="stack__icon">${esc(s.icon)}</span>
        <h3>${esc(s.title)}</h3>
        <p class="stack__blurb">${esc(s.blurb)}</p>
        <div class="stack__members">${members}</div>
        <span class="stack__foot"><span>${totals}</span><span class="stack__cta">Filter catalog →</span></span>
      </button>`;
    })
    .join('');
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('.stack');
    if (!btn) return;
    const stack = stacks.find((s) => s.id === btn.dataset.stack);
    if (!stack) return;
    state.stack = { title: stack.title, set: new Set(stack.plugins) };
    state.category = 'All';
    state.query = '';
    const input = $('#search'); if (input) input.value = '';
    $$('.pill').forEach((p) => { const on = p.dataset.cat === 'All'; p.classList.toggle('is-active', on); p.setAttribute('aria-selected', String(on)); });
    renderGrid();
    $('#catalog')?.scrollIntoView({ behavior: 'smooth' });
  });
}

/* ── sub-plugins ───────────────────────────────────────────── */
function renderSubplugins(list) {
  const el = $('#subpluginList');
  if (el && list) el.innerHTML = list.map((s) => `<li>${esc(s)}</li>`).join('');
}

/* ── keyboard shortcuts ────────────────────────────────────── */
function wireShortcuts() {
  document.addEventListener('keydown', (e) => {
    const input = $('#search');
    const typing = /^(input|textarea|select)$/i.test(document.activeElement?.tagName || '');
    if (e.key === '/' && !typing) { e.preventDefault(); input?.focus(); }
    else if (e.key === 'Escape' && document.activeElement === input) { input.blur(); }
  });
}

/* ── SEO: structured data ──────────────────────────────────── */
function injectJsonLd(data) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Claude Orchestration — Plugin Marketplace',
    description: data.meta.description,
    url: data.meta.url,
    isPartOf: { '@type': 'WebSite', name: data.meta.name, url: data.meta.url },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: data.plugins.length,
      itemListElement: data.plugins.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: p.name,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Claude Code',
          softwareVersion: p.version,
          description: p.description,
          author: { '@type': 'Person', name: p.author },
        },
      })),
    },
  };
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(ld);
  document.head.appendChild(s);
}

/* ── nav, scroll, copy, top ────────────────────────────────── */
function wireNav() {
  const nav = $('.nav');
  const menu = $('#navMenu');
  menu?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menu.setAttribute('aria-expanded', String(open));
  });
  $$('.nav__links a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('is-open')));
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function wireScrollReveal() {
  const targets = $$('.section, .step, .block, .check, .stat');
  targets.forEach((t) => t.setAttribute('data-reveal', ''));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  targets.forEach((t) => io.observe(t));
}

function wireCopyButtons() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const code = btn.parentElement.querySelector('code');
    try {
      await navigator.clipboard.writeText(code.innerText.trim());
      const prev = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('is-copied');
      setTimeout(() => { btn.textContent = prev; btn.classList.remove('is-copied'); }, 1600);
    } catch { /* clipboard unavailable */ }
  });
}

function wireBackToTop() {
  const btn = $('#toTop');
  if (!btn) return;
  window.addEventListener('scroll', () => { btn.hidden = window.scrollY < 600; }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function renderError() {
  const grid = $('#pluginGrid');
  if (grid) grid.innerHTML = '<p class="catalog__empty">Catalog data could not be loaded. Visit the <a href="https://github.com/markus41/claude" style="color:var(--ember)">repository</a>.</p>';
}
