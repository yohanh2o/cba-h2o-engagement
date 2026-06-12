/**
 * CBA Website — Shared Utilities
 */

'use strict';

// ── DOM HELPERS ────────────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ── FORMATTING ────────────────────────────────────────────────────────────
function fmtAUD(val, decimals = 0) {
  if (val == null) return '—';
  const n = Number(val);
  if (isNaN(n)) return '—';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(decimals === 0 ? 1 : decimals) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(decimals === 0 ? 0 : decimals) + 'K';
  return '$' + n.toLocaleString();
}

function fmtAUDM(val) {
  if (val == null) return '—';
  return '$' + Number(val).toFixed(0) + 'M AUD';
}

function fmtPct(val) {
  if (val == null) return '—';
  return Number(val).toFixed(0) + '%';
}

function fmtNum(val) {
  if (val == null) return '—';
  return Number(val).toLocaleString();
}

// ── STATUS HELPERS ────────────────────────────────────────────────────────
function statusBadge(status, label) {
  const cls = { green: 'badge-green', amber: 'badge-amber', red: 'badge-red' }[status] || 'badge-blue';
  const dotColor = { green: 'var(--green)', amber: 'var(--amber)', red: 'var(--red)' }[status] || 'var(--h2o-blue)';
  return `<span class="badge ${cls}">
    <span class="badge-dot" style="background:${dotColor}"></span>
    ${label}
  </span>`;
}

function sizingBadge(sizing) {
  const map = {
    'XXL':    'sizing-xxl',
    'XL':     'sizing-xl',
    'L':      'sizing-l',
    'L SLM':  'sizing-lslm',
    'M':      'sizing-m',
  };
  return `<span class="badge ${map[sizing] || 'badge-blue'}">${sizing}</span>`;
}

function tcvBadge(tcv) {
  return `<span class="badge badge-blue">$${tcv}M</span>`;
}

// ── INITIALS FROM NAME ────────────────────────────────────────────────────
function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

// ── MODAL SYSTEM ─────────────────────────────────────────────────────────
let activeModal = null;

function openModal(htmlContent) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body-content');
  if (!overlay || !body) return;
  body.innerHTML = htmlContent;
  overlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
  activeModal = overlay;
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  document.body.style.overflow = '';
  activeModal = null;
}

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target && e.target.id === 'modal-overlay') closeModal();
});

// Close on ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && activeModal) closeModal();
});

// ── UC DETAIL MODAL ────────────────────────────────────────────────────────
function openUCModal(ucId) {
  const uc = CBA_DATA.computed.ucById(ucId);
  if (!uc) return;

  const statusColor = { green: 'var(--green)', amber: 'var(--amber)', red: 'var(--red)' }[uc.status];

  const componentsHtml = uc.components.length
    ? uc.components.map(c => `<div style="font-size:12px;color:var(--text-secondary);padding:2px 0">▸ ${c}</div>`).join('')
    : '<span class="text-muted" style="font-size:12px">—</span>';

  const productsHtml = uc.products
    .map(p => `<span class="badge badge-blue" style="font-size:11px">${p}</span>`)
    .join(' ');

  const cbaMentions = uc.stakeholders_cba.length
    ? uc.stakeholders_cba.join(', ')
    : '—';

  const sowLinkHtml = uc.sow_link
    ? `<a href="${uc.sow_link}" target="_blank" class="btn btn-ghost" style="font-size:12px;padding:5px 10px">↗ Open SOW</a>`
    : '<span class="text-muted" style="font-size:12px">Not yet created</span>';

  const roiHtml = uc.roi ? `<span class="badge badge-gold">${uc.roi} ROI</span>` : '';

  const html = `
    <div class="modal-header">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${statusColor};flex-shrink:0"></span>
          ${sizingBadge(uc.sizing)}
          ${tcvBadge(uc.tcv)}
          ${roiHtml}
        </div>
        <div class="modal-title">${uc.name}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">${uc.bu}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-section">
        <div class="modal-section-title">Description</div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.7">${uc.description}</p>
      </div>

      ${uc.components.length ? `
      <div class="modal-section">
        <div class="modal-section-title">Components</div>
        ${componentsHtml}
      </div>` : ''}

      <div class="modal-section">
        <div class="kv-grid">
          <div class="kv-key">Status</div>
          <div class="kv-val">${statusBadge(uc.status, uc.statusLabel)}</div>
          <div class="kv-key">Phase</div>
          <div class="kv-val"><span class="badge badge-blue">${uc.phase}</span></div>
          <div class="kv-key">Sizing</div>
          <div class="kv-val">${sizingBadge(uc.sizing)} <span style="color:var(--text-muted);font-size:11px;margin-left:4px">${uc.duration}</span></div>
          <div class="kv-key">TCV</div>
          <div class="kv-val"><span class="text-blue font-bold">$${uc.tcv}M AUD</span> ($${uc.tcv_license}M licenses / $${uc.tcv_services}M services)</div>
          <div class="kv-key">Priority</div>
          <div class="kv-val">${uc.priority === 1 ? '⭐ Priority 1' : uc.priority === 2 ? 'Priority 2' : 'Priority 3'}</div>
          <div class="kv-key">CBA Stakeholders</div>
          <div class="kv-val">${cbaMentions}</div>
          <div class="kv-key">H2O Lead</div>
          <div class="kv-val">${uc.h2o_lead}</div>
          <div class="kv-key">H2O Team</div>
          <div class="kv-val">${uc.h2o_team.join(', ')}</div>
          ${uc.dependency ? `<div class="kv-key">Dependency</div><div class="kv-val">${uc.dependency}</div>` : ''}
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">H2O Products</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${productsHtml}</div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Next Steps</div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.6">→ ${uc.next_step}</p>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">SOW</div>
        ${sowLinkHtml}
      </div>

      ${(uc.build_cost || uc.maintenance_cost) ? `
      <div class="modal-section">
        <div class="modal-section-title">Cost Model</div>
        <div class="kv-grid">
          ${uc.build_cost ? `<div class="kv-key">Build Cost</div><div class="kv-val">${fmtAUD(uc.build_cost)}</div>` : ''}
          ${uc.maintenance_cost ? `<div class="kv-key">Maintenance (Y2+)</div><div class="kv-val">${fmtAUD(uc.maintenance_cost)} / year</div>` : ''}
          ${uc.usage_cost_qtr ? `<div class="kv-key">Usage</div><div class="kv-val">${fmtAUD(uc.usage_cost_qtr)} / quarter</div>` : ''}
        </div>
      </div>` : ''}
    </div>
  `;

  openModal(html);
}

// ── SIDEBAR NAV HIGHLIGHT ─────────────────────────────────────────────────
function highlightActiveNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href && href.includes(current)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// ── COUNT UP ANIMATION ────────────────────────────────────────────────────
function animateCountUp(el, target, duration = 800, prefix = '', suffix = '') {
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  const isFloat = !Number.isInteger(target);

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    const current = start + (target - start) * eased;
    el.textContent = prefix + (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = prefix + target + suffix;
  }
  requestAnimationFrame(step);
}

// ── ANIMATE KPIs ON LOAD ──────────────────────────────────────────────────
function animateKPIs() {
  $$('[data-kpi-target]').forEach(el => {
    const target = parseFloat(el.dataset.kpiTarget);
    const prefix = el.dataset.kpiPrefix || '';
    const suffix = el.dataset.kpiSuffix || '';
    animateCountUp(el, target, 900, prefix, suffix);
  });
}

// ── TABS ─────────────────────────────────────────────────────────────────
function initTabs(containerSelector = '.tabs-container') {
  $$(containerSelector).forEach(container => {
    const tabs = $$('.tab-btn', container);
    const panes = $$('.tab-pane', container);
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const pane = container.querySelector(`[data-pane="${target}"]`);
        if (pane) pane.classList.add('active');
      });
    });
  });
}

// ── DEBOUNCE ──────────────────────────────────────────────────────────────
function debounce(fn, wait) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

// ── SORT TABLE ────────────────────────────────────────────────────────────
let _sortState = { col: null, dir: 1 };

function sortTable(tableId, colIndex) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const tbody = table.querySelector('tbody');
  const rows = [...tbody.querySelectorAll('tr')];

  if (_sortState.col === colIndex) {
    _sortState.dir *= -1;
  } else {
    _sortState.col = colIndex;
    _sortState.dir = 1;
  }

  rows.sort((a, b) => {
    const aText = a.cells[colIndex]?.textContent.trim() ?? '';
    const bText = b.cells[colIndex]?.textContent.trim() ?? '';
    const aNum = parseFloat(aText.replace(/[^0-9.-]/g, ''));
    const bNum = parseFloat(bText.replace(/[^0-9.-]/g, ''));

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return (aNum - bNum) * _sortState.dir;
    }
    return aText.localeCompare(bText) * _sortState.dir;
  });

  rows.forEach(r => tbody.appendChild(r));

  // Update sort indicators
  table.querySelectorAll('th').forEach((th, i) => {
    th.textContent = th.textContent.replace(/ [▲▼]$/, '');
    if (i === colIndex) {
      th.textContent += _sortState.dir === 1 ? ' ▲' : ' ▼';
    }
  });
}

// ── SIDEBAR HTML ──────────────────────────────────────────────────────────
function renderSidebar(activePage) {
  const navItems = [
    { href: 'index.html',       icon: '⬡',  label: 'Overview',     page: 'index' },
    { href: 'use-cases.html',   icon: '⚡',  label: 'Use Cases',    page: 'use-cases' },
    { href: 'delivery.html',    icon: '📅',  label: 'Delivery',     page: 'delivery' },
    { href: 'commercial.html',  icon: '💰',  label: 'Commercial',   page: 'commercial' },
    { href: 'team.html',        icon: '👥',  label: 'Team',         page: 'team' },
  ];

  return `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-h2o">H2O.ai</div>
        <div class="logo-cba">× Commonwealth Bank</div>
        <div class="tier-badge">★ Tier 0 Partner</div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-label">Navigation</div>
        ${navItems.map(item => `
          <a href="${item.href}" class="nav-item ${activePage === item.page ? 'active' : ''}">
            <span style="font-size:15px">${item.icon}</span>
            ${item.label}
          </a>
        `).join('')}
      </nav>
      <div class="sidebar-footer">
        FY27 Engagement Plan<br>
        Updated June 2026
      </div>
    </aside>
  `;
}

// ── MODAL CONTAINER HTML ─────────────────────────────────────────────────
function renderModalContainer() {
  return `
    <div id="modal-overlay" class="modal-overlay">
      <div class="modal">
        <div id="modal-body-content"></div>
      </div>
    </div>
  `;
}

// On DOM ready
document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  animateKPIs();
  initTabs();
});
