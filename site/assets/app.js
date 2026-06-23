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

const state = { data: null, query: '', category: 'All' };

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ── boot ──────────────────────────────────────────────────── */
init();

async function init() {
  wireNav();
  wireScrollReveal();
  wireCopyButtons();
  wireBackToTop();

  try {
    const res = await fetch('./data/plugins.json', { cache: 'no-cache' });
    state.data = await res.json();
  } catch (err) {
    console.error('Failed to load catalog data', err);
    renderError();
    return;
  }

  bindData(state.data);
  renderSubplugins(state.data.subplugins);
  buildFilters(state.data);
  renderGrid();
  wireSearch();
  observeStats();
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
      return `<button class="pill${c === 'All' ? ' is-active' : ''}" role="tab" data-cat="${esc(c)}">${esc(c)}<span class="pill__count">${n}</span></button>`;
    })
    .join('');
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    state.category = btn.dataset.cat;
    $$('.pill', wrap).forEach((p) => p.classList.toggle('is-active', p === btn));
    renderGrid();
  });
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
  $('#clearSearch')?.addEventListener('click', () => {
    input.value = '';
    state.query = '';
    state.category = 'All';
    $$('.pill').forEach((p) => p.classList.toggle('is-active', p.dataset.cat === 'All'));
    renderGrid();
  });
}

/* ── grid render ───────────────────────────────────────────── */
function filtered() {
  const { plugins } = state.data;
  return plugins.filter((p) => {
    if (state.category !== 'All' && p.category !== state.category) return false;
    if (!state.query) return true;
    const hay = `${p.name} ${p.description} ${p.category} ${p.author} ${(p.keywords || []).join(' ')}`.toLowerCase();
    return hay.includes(state.query);
  });
}

function renderGrid() {
  const grid = $('#pluginGrid');
  const list = filtered();
  const countEl = $('#resultCount');
  const empty = $('#emptyState');

  empty.hidden = list.length !== 0;
  countEl.textContent = list.length
    ? `Showing ${list.length} of ${state.data.plugins.length} plugins`
    : '';

  grid.innerHTML = list.map((p, i) => cardHtml(p, i)).join('');
  wireCards(grid);
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

  const tags = (p.keywords || []).slice(0, 8).map((k) => `<span class="tag">${esc(k)}</span>`).join('');
  const repoUrl = `${state.data.meta.repo}/tree/main/${p.source.replace(/^\.\//, '')}`;
  const author = p.authorUrl
    ? `<a href="${esc(p.authorUrl)}" target="_blank" rel="noopener">${esc(p.author)}</a>`
    : esc(p.author);

  return `
  <article class="card" style="--accent:${accent};animation-delay:${Math.min(i * 35, 500)}ms">
    <div class="card__body">
      <div class="card__top">
        <span class="card__cat">${esc(p.category)}</span>
        <span class="card__ver">v${esc(p.version)}</span>
      </div>
      <h3 class="card__name">${esc(p.name)}</h3>
      <p class="card__desc">${esc(p.description)}</p>
      <div class="card__metrics">${metrics}</div>

      <div class="card__details">
        <div class="card__detailsinner">
          <div class="kv"><span>Author</span><span>${author}</span></div>
          <div class="kv"><span>License</span><span>${esc(p.license)}</span></div>
          ${tags ? `<div class="tags">${tags}</div>` : ''}
          <div class="card__install">
            <code>/plugin install ${esc(p.name)}</code>
          </div>
          <a class="card__toggle" href="${esc(repoUrl)}" target="_blank" rel="noopener" style="text-decoration:none">View source on GitHub →</a>
        </div>
      </div>
    </div>
    <div class="card__foot">
      <span class="card__author">by ${author}</span>
      <button class="card__toggle" data-expand aria-expanded="false">
        Details
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </button>
    </div>
  </article>`;
}

function wireCards(grid) {
  $$('[data-expand]', grid).forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.card');
      const open = card.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
}

/* ── sub-plugins ───────────────────────────────────────────── */
function renderSubplugins(list) {
  const el = $('#subpluginList');
  if (el && list) el.innerHTML = list.map((s) => `<li>${esc(s)}</li>`).join('');
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
