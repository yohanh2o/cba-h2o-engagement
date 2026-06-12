/**
 * CBA × H2O.ai Website — Unit Test Suite
 * ========================================
 * Environment: Node.js (no DOM required for data/utils tests)
 * Run: node tests/tests.js
 *
 * Tests organised in suites:
 *   1. Data Integrity    — CBA_DATA structure & completeness
 *   2. Computed Helpers  — computed getters & aggregations
 *   3. Formatter Funcs   — fmtAUD, fmtPct, statusBadge, sizingBadge
 *   4. Utility Funcs     — initials, debounce, animateCountUp
 *   5. UC Lookup         — ucById correctness
 *   6. Filter Logic      — applyFilters simulation
 *   7. Sort Logic        — sortTable text & numeric sort
 *   8. Modal HTML        — openUCModal HTML generation integrity
 *   9. Stakeholder Data  — H2O + CBA team completeness
 *  10. Timeline Data     — Gantt entries schema
 */

// ── LOAD MODULES ─────────────────────────────────────────────────────────
const path = require('path');
const fs   = require('fs');
const vm   = require('vm');

const dataPath  = path.resolve(__dirname, '../js/data.js');
const utilsPath = path.resolve(__dirname, '../js/utils.js');

// Provide minimal browser globals that utils.js references
const browserGlobals = {
  document: {
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    body: { style: {} },
  },
  window:   { location: { pathname: '/index.html' } },
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => {},
  console,
};

// Use vm context so function declarations become sandbox properties
const sandbox = Object.assign(Object.create(null), browserGlobals);
sandbox.global      = sandbox;
sandbox.globalThis  = sandbox;
sandbox.clearTimeout = clearTimeout;
sandbox.setTimeout   = setTimeout;
vm.createContext(sandbox);

// Run data.js: patch `const CBA_DATA` → `CBA_DATA` so it lands on sandbox context
const dataSource = fs.readFileSync(dataPath, 'utf8').replace(/const CBA_DATA\s*=/, 'CBA_DATA =');
vm.runInContext(dataSource, sandbox);

// Run utils.js — function declarations are hoisted onto sandbox context
vm.runInContext(fs.readFileSync(utilsPath, 'utf8'), sandbox);

// Expose sandbox exports into this module's scope for test use
const CBA_DATA    = sandbox.CBA_DATA;
const fmtAUD      = sandbox.fmtAUD;
const fmtAUDM     = sandbox.fmtAUDM;
const fmtPct      = sandbox.fmtPct;
const fmtNum      = sandbox.fmtNum;
const initials    = sandbox.initials;
const debounce    = sandbox.debounce;
const statusBadge = sandbox.statusBadge;
const sizingBadge = sandbox.sizingBadge;
const tcvBadge    = sandbox.tcvBadge;

'use strict';

// ── TEST RUNNER ───────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
let total  = 0;
const failures = [];

function describe(suiteName, fn) {
  console.log(`\n  \x1b[36m▶ ${suiteName}\x1b[0m`);
  fn();
}

function it(desc, fn) {
  total++;
  try {
    fn();
    console.log(`    \x1b[32m✓\x1b[0m ${desc}`);
    passed++;
  } catch (e) {
    console.log(`    \x1b[31m✗\x1b[0m ${desc}`);
    console.log(`      \x1b[90m${e.message}\x1b[0m`);
    failed++;
    failures.push({ desc, message: e.message });
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected)
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toBeGreaterThan(n) {
      if (!(actual > n)) throw new Error(`Expected ${actual} > ${n}`);
    },
    toBeLessThan(n) {
      if (!(actual < n)) throw new Error(`Expected ${actual} < ${n}`);
    },
    toBeLessThanOrEqual(n) {
      if (!(actual <= n)) throw new Error(`Expected ${actual} <= ${n}`);
    },
    toBeGreaterThanOrEqual(n) {
      if (!(actual >= n)) throw new Error(`Expected ${actual} >= ${n}`);
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected falsy, got ${JSON.stringify(actual)}`);
    },
    toContain(item) {
      if (Array.isArray(actual)) {
        if (!actual.includes(item))
          throw new Error(`Expected array to contain ${JSON.stringify(item)}`);
      } else if (typeof actual === 'string') {
        if (!actual.includes(item))
          throw new Error(`Expected string "${actual}" to contain "${item}"`);
      } else {
        throw new Error('toContain requires string or array');
      }
    },
    toMatch(regex) {
      if (!regex.test(actual))
        throw new Error(`Expected "${actual}" to match ${regex}`);
    },
    toBeArray() {
      if (!Array.isArray(actual)) throw new Error(`Expected an array, got ${typeof actual}`);
    },
    toHaveLength(n) {
      if (!actual || actual.length !== n)
        throw new Error(`Expected length ${n}, got ${actual ? actual.length : 'undefined'}`);
    },
    toBeInstanceOf(Constructor) {
      if (!(actual instanceof Constructor))
        throw new Error(`Expected instance of ${Constructor.name}`);
    },
    toBeNull() {
      if (actual !== null) throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
    },
    toBeUndefined() {
      if (actual !== undefined) throw new Error(`Expected undefined, got ${JSON.stringify(actual)}`);
    },
    not: {
      toBe(expected) {
        if (actual === expected)
          throw new Error(`Expected NOT ${JSON.stringify(expected)}`);
      },
      toBeNull() {
        if (actual === null) throw new Error('Expected not null');
      },
      toBeUndefined() {
        if (actual === undefined) throw new Error('Expected not undefined');
      },
    }
  };
}

// ── SUITE 1: DATA INTEGRITY ───────────────────────────────────────────────
describe('Suite 1 — Data Integrity', () => {

  it('CBA_DATA is defined', () => {
    expect(typeof CBA_DATA).toBe('object');
  });

  it('CBA_DATA.partnership exists with required keys', () => {
    const p = CBA_DATA.partnership;
    expect(typeof p.commitment).toBe('number');
    expect(typeof p.mapped_tcv).toBe('number');
    expect(typeof p.tier).toBe('string');
    expect(typeof p.client).toBe('string');
  });

  it('Partnership commitment is $100M', () => {
    expect(CBA_DATA.partnership.commitment).toBe(100);
  });

  it('Partnership mapped_tcv is $32M', () => {
    expect(CBA_DATA.partnership.mapped_tcv).toBe(32);
  });

  it('usecases is an array', () => {
    expect(Array.isArray(CBA_DATA.usecases)).toBe(true);
  });

  it('there are exactly 15 use cases', () => {
    expect(CBA_DATA.usecases).toHaveLength(15);
  });

  it('all use cases have required fields', () => {
    const required = ['id','name','shortName','bu','category','sizing','tcv','tcv_license','tcv_services','status','statusLabel','phase','products','h2o_lead'];
    CBA_DATA.usecases.forEach(uc => {
      required.forEach(field => {
        if (uc[field] === undefined || uc[field] === null)
          throw new Error(`UC "${uc.id}" missing field "${field}"`);
      });
    });
  });

  it('all UC IDs are unique', () => {
    const ids = CBA_DATA.usecases.map(u => u.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all UC IDs are positive numbers', () => {
    CBA_DATA.usecases.forEach(uc => {
      if (typeof uc.id !== 'number' || uc.id < 1)
        throw new Error(`UC ID "${uc.id}" is not a positive number`);
    });
  });

  it('all UC statuses are green/amber/red', () => {
    const valid = ['green', 'amber', 'red'];
    CBA_DATA.usecases.forEach(uc => {
      if (!valid.includes(uc.status))
        throw new Error(`UC "${uc.id}" has invalid status "${uc.status}"`);
    });
  });

  it('all UC sizings are valid values', () => {
    const valid = ['XXL', 'XL', 'L', 'L SLM', 'M'];
    CBA_DATA.usecases.forEach(uc => {
      if (!valid.includes(uc.sizing))
        throw new Error(`UC "${uc.id}" has invalid sizing "${uc.sizing}"`);
    });
  });

  it('all UC TCVs are positive numbers', () => {
    CBA_DATA.usecases.forEach(uc => {
      if (typeof uc.tcv !== 'number' || uc.tcv <= 0)
        throw new Error(`UC "${uc.id}" has invalid tcv "${uc.tcv}"`);
    });
  });

  it('all UC license + services = TCV (within 0.01 tolerance)', () => {
    CBA_DATA.usecases.forEach(uc => {
      const sum = uc.tcv_license + uc.tcv_services;
      if (Math.abs(sum - uc.tcv) > 0.01)
        throw new Error(`UC "${uc.id}" TCV mismatch: ${uc.tcv_license} + ${uc.tcv_services} = ${sum}, expected ${uc.tcv}`);
    });
  });

  it('all UCs have at least one product listed', () => {
    CBA_DATA.usecases.forEach(uc => {
      if (!Array.isArray(uc.products) || uc.products.length === 0)
        throw new Error(`UC "${uc.id}" has no products`);
    });
  });

  it('all UCs have h2o_team array', () => {
    CBA_DATA.usecases.forEach(uc => {
      if (!Array.isArray(uc.h2o_team))
        throw new Error(`UC "${uc.id}" has no h2o_team array`);
    });
  });

  it('all UCs have a description string', () => {
    CBA_DATA.usecases.forEach(uc => {
      if (typeof uc.description !== 'string' || uc.description.length < 10)
        throw new Error(`UC "${uc.id}" has missing/short description`);
    });
  });

  it('all UCs have a next_step string', () => {
    CBA_DATA.usecases.forEach(uc => {
      if (typeof uc.next_step !== 'string' || uc.next_step.length < 5)
        throw new Error(`UC "${uc.id}" has missing/short next_step`);
    });
  });

  it('timeline object exists with projects array', () => {
    expect(typeof CBA_DATA.timeline).toBe('object');
    expect(Array.isArray(CBA_DATA.timeline.projects)).toBe(true);
    expect(CBA_DATA.timeline.projects.length).toBeGreaterThan(0);
  });

  it('stakeholders object has h2o and cba arrays', () => {
    expect(Array.isArray(CBA_DATA.stakeholders.h2o)).toBe(true);
    expect(Array.isArray(CBA_DATA.stakeholders.cba)).toBe(true);
  });

  it('actions array exists with required fields', () => {
    expect(Array.isArray(CBA_DATA.actions)).toBe(true);
    CBA_DATA.actions.forEach(a => {
      if (!a.item) throw new Error(`Action missing item text: ${JSON.stringify(a)}`);
      if (!a.priority) throw new Error(`Action missing priority: ${JSON.stringify(a)}`);
    });
  });

});

// ── SUITE 2: COMPUTED HELPERS ─────────────────────────────────────────────
describe('Suite 2 — Computed Helpers', () => {

  it('computed.totalTCV sums all UC TCVs', () => {
    const manual = CBA_DATA.usecases.reduce((s, u) => s + u.tcv, 0);
    expect(CBA_DATA.computed.totalTCV).toBe(manual);
  });

  it('computed.totalTCV equals 32', () => {
    expect(CBA_DATA.computed.totalTCV).toBe(32);
  });

  it('computed.activeTCV returns a positive number', () => {
    expect(CBA_DATA.computed.activeTCV).toBeGreaterThan(0);
  });

  it('computed.activeTCV is less than or equal to totalTCV', () => {
    expect(CBA_DATA.computed.activeTCV).toBeLessThanOrEqual(CBA_DATA.computed.totalTCV);
  });

  it('computed.greenCount is correct', () => {
    const manual = CBA_DATA.usecases.filter(u => u.status === 'green').length;
    expect(CBA_DATA.computed.greenCount).toBe(manual);
  });

  it('computed.amberCount is correct', () => {
    const manual = CBA_DATA.usecases.filter(u => u.status === 'amber').length;
    expect(CBA_DATA.computed.amberCount).toBe(manual);
  });

  it('computed.redCount is correct', () => {
    const manual = CBA_DATA.usecases.filter(u => u.status === 'red').length;
    expect(CBA_DATA.computed.redCount).toBe(manual);
  });

  it('green + amber + red = 15', () => {
    const sum = CBA_DATA.computed.greenCount + CBA_DATA.computed.amberCount + CBA_DATA.computed.redCount;
    expect(sum).toBe(15);
  });

  it('computed.commitmentGap = commitment - activeTCV', () => {
    const expected = CBA_DATA.partnership.commitment - CBA_DATA.computed.activeTCV;
    expect(CBA_DATA.computed.commitmentGap).toBe(expected);
  });

  it('computed.commitmentGap is a positive number', () => {
    expect(CBA_DATA.computed.commitmentGap).toBeGreaterThan(0);
    expect(CBA_DATA.computed.commitmentGap).toBeLessThan(100);
  });

  it('computed.tcvByBU is an object', () => {
    expect(typeof CBA_DATA.computed.tcvByBU).toBe('object');
  });

  it('computed.tcvByBU sums correctly', () => {
    const buTotal = Object.values(CBA_DATA.computed.tcvByBU).reduce((s, v) => s + v, 0);
    expect(buTotal).toBe(CBA_DATA.computed.totalTCV);
  });

  it('computed.tcvByCategory sums correctly', () => {
    const catTotal = Object.values(CBA_DATA.computed.tcvByCategory).reduce((s, v) => s + v, 0);
    expect(catTotal).toBe(CBA_DATA.computed.totalTCV);
  });

  it('computed.ucById returns correct UC for ID 1', () => {
    const uc = CBA_DATA.computed.ucById(1);
    expect(uc.id).toBe(1);
  });

  it('computed.ucById returns falsy for unknown ID', () => {
    const uc = CBA_DATA.computed.ucById(9999);
    if (uc) throw new Error(`Expected falsy for ID 9999, got ${JSON.stringify(uc)}`);
  });

  it('computed.ucById is type-sensitive (string vs number)', () => {
    const uc = CBA_DATA.computed.ucById('1');
    // Either returns undefined/null or doesn't match — string ID shouldn't find numeric ID
    if (uc && uc.id === 1) throw new Error('ucById should not match string "1" to numeric id 1');
  });

});

// ── SUITE 3: FORMATTER FUNCTIONS ──────────────────────────────────────────
describe('Suite 3 — Formatter Functions', () => {

  it('fmtAUD formats millions correctly', () => {
    expect(fmtAUD(5000000)).toBe('$5.0M');
  });

  it('fmtAUD formats thousands correctly', () => {
    expect(fmtAUD(250000)).toBe('$250K');
  });

  it('fmtAUD formats small values as plain dollar', () => {
    const result = fmtAUD(999);
    expect(result).toContain('$');
    expect(result).toContain('999');
  });

  it('fmtAUD returns — for null', () => {
    expect(fmtAUD(null)).toBe('—');
  });

  it('fmtAUD returns — for undefined', () => {
    expect(fmtAUD(undefined)).toBe('—');
  });

  it('fmtAUD returns — for NaN string', () => {
    expect(fmtAUD('not a number')).toBe('—');
  });

  it('fmtAUDM formats correctly', () => {
    expect(fmtAUDM(34)).toBe('$34M AUD');
  });

  it('fmtPct formats 34 as 34%', () => {
    expect(fmtPct(34)).toBe('34%');
  });

  it('fmtPct returns — for null', () => {
    expect(fmtPct(null)).toBe('—');
  });

  it('statusBadge returns HTML string containing badge class', () => {
    const html = statusBadge('green', 'Active');
    expect(html).toContain('badge-green');
    expect(html).toContain('Active');
  });

  it('statusBadge for amber contains badge-amber', () => {
    const html = statusBadge('amber', 'In Progress');
    expect(html).toContain('badge-amber');
  });

  it('statusBadge for red contains badge-red', () => {
    const html = statusBadge('red', 'Blocked');
    expect(html).toContain('badge-red');
  });

  it('statusBadge for unknown status defaults to badge-blue', () => {
    const html = statusBadge('unknown', 'TBD');
    expect(html).toContain('badge-blue');
  });

  it('sizingBadge XXL has sizing-xxl class', () => {
    const html = sizingBadge('XXL');
    expect(html).toContain('sizing-xxl');
    expect(html).toContain('XXL');
  });

  it('sizingBadge XL has sizing-xl class', () => {
    expect(sizingBadge('XL')).toContain('sizing-xl');
  });

  it('sizingBadge L has sizing-l class', () => {
    expect(sizingBadge('L')).toContain('sizing-l');
  });

  it('sizingBadge L SLM has sizing-lslm class', () => {
    expect(sizingBadge('L SLM')).toContain('sizing-lslm');
  });

  it('sizingBadge M has sizing-m class', () => {
    expect(sizingBadge('M')).toContain('sizing-m');
  });

  it('tcvBadge includes dollar and M', () => {
    const html = tcvBadge(5);
    expect(html).toContain('$5M');
  });

});

// ── SUITE 4: UTILITY FUNCTIONS ────────────────────────────────────────────
describe('Suite 4 — Utility Functions', () => {

  it('initials("John Smith") returns "JS"', () => {
    expect(initials('John Smith')).toBe('JS');
  });

  it('initials("Sri Ambati") returns "SA"', () => {
    expect(initials('Sri Ambati')).toBe('SA');
  });

  it('initials("SingleName") returns first letter of single word', () => {
    const result = initials('SingleName');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toBe('S');
  });

  it('initials(null/empty) returns "?"', () => {
    expect(initials('')).toBe('?');
    expect(initials(null)).toBe('?');
  });

  it('initials truncates to 2 chars max', () => {
    const result = initials('A B C D E');
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('debounce returns a function', () => {
    const fn = debounce(() => {}, 100);
    expect(typeof fn).toBe('function');
  });

  it('debounce delays execution', (done) => {
    let count = 0;
    const fn = debounce(() => { count++; }, 50);
    fn(); fn(); fn();
    // immediately after, count should still be 0
    expect(count).toBe(0);
  });

  it('fmtNum formats numbers with locale separators', () => {
    const result = fmtNum(1000000);
    expect(result).toContain('1');
    expect(typeof result).toBe('string');
  });

  it('fmtNum returns — for null', () => {
    expect(fmtNum(null)).toBe('—');
  });

});

// ── SUITE 5: UC LOOKUP ────────────────────────────────────────────────────
describe('Suite 5 — UC Lookup', () => {

  it('can look up all 15 UCs by ID', () => {
    CBA_DATA.usecases.forEach(uc => {
      const found = CBA_DATA.computed.ucById(uc.id);
      if (!found || found.id !== uc.id)
        throw new Error(`Cannot look up UC id "${uc.id}"`);
    });
  });

  it('UC id=1 is SLM Factory', () => {
    const uc = CBA_DATA.computed.ucById(1);
    expect(uc.shortName).toContain('SLM');
  });

  it('UC id=1 has TCV of 5', () => {
    const uc = CBA_DATA.computed.ucById(1);
    expect(uc.tcv).toBe(5);
  });

  it('UC id=1 has status green', () => {
    const uc = CBA_DATA.computed.ucById(1);
    expect(uc.status).toBe('green');
  });

  it('UC id=1 sizing is XXL', () => {
    const uc = CBA_DATA.computed.ucById(1);
    expect(uc.sizing).toBe('XXL');
  });

  it('UC id=1 BU contains CDAO', () => {
    const uc = CBA_DATA.computed.ucById(1);
    expect(uc.bu).toContain('CDAO');
  });

  it('UC id=2 has status green', () => {
    const uc = CBA_DATA.computed.ucById(2);
    expect(uc.status).toBe('green');
  });

  it('all UC phases are valid strings', () => {
    CBA_DATA.usecases.forEach(uc => {
      if (typeof uc.phase !== 'string' || uc.phase.length === 0)
        throw new Error(`UC "${uc.id}" has invalid phase`);
    });
  });

});

// ── SUITE 6: FILTER LOGIC ─────────────────────────────────────────────────
describe('Suite 6 — Filter Logic', () => {

  function simulateFilter(ucs, { text = '', status = 'all', bu = 'all', sizing = 'all' }) {
    return ucs.filter(uc => {
      if (text) {
        const q = text.toLowerCase();
        if (!uc.name.toLowerCase().includes(q) &&
            !uc.bu.toLowerCase().includes(q) &&
            !uc.description.toLowerCase().includes(q)) return false;
      }
      if (status !== 'all' && uc.status !== status) return false;
      if (bu !== 'all' && !uc.bu.includes(bu)) return false;
      if (sizing !== 'all' && uc.sizing !== sizing) return false;
      return true;
    });
  }

  const ucs = CBA_DATA.usecases;

  it('no filters returns all 15 UCs', () => {
    expect(simulateFilter(ucs, {})).toHaveLength(15);
  });

  it('filter by status=green returns only green UCs', () => {
    const result = simulateFilter(ucs, { status: 'green' });
    result.forEach(uc => expect(uc.status).toBe('green'));
  });

  it('filter by status=red returns only red UCs', () => {
    const result = simulateFilter(ucs, { status: 'red' });
    result.forEach(uc => expect(uc.status).toBe('red'));
  });

  it('filter by sizing=XXL returns only XXL UCs', () => {
    const result = simulateFilter(ucs, { sizing: 'XXL' });
    expect(result.length).toBeGreaterThan(0);
    result.forEach(uc => expect(uc.sizing).toBe('XXL'));
  });

  it('filter by text matching a UC name finds it', () => {
    const result = simulateFilter(ucs, { text: 'SLM Factory' });
    expect(result.length).toBeGreaterThan(0);
  });

  it('filter by non-existent text returns empty array', () => {
    const result = simulateFilter(ucs, { text: 'xyzzy-not-a-uc' });
    expect(result).toHaveLength(0);
  });

  it('combined filters narrow results correctly', () => {
    const result = simulateFilter(ucs, { status: 'green', sizing: 'XXL' });
    result.forEach(uc => {
      expect(uc.status).toBe('green');
      expect(uc.sizing).toBe('XXL');
    });
  });

  it('filter count never exceeds total', () => {
    const result = simulateFilter(ucs, { status: 'amber' });
    expect(result.length).toBeLessThanOrEqual(15);
  });

  it('status filter counts sum to 15 across all statuses', () => {
    const g = simulateFilter(ucs, { status: 'green' }).length;
    const a = simulateFilter(ucs, { status: 'amber' }).length;
    const r = simulateFilter(ucs, { status: 'red' }).length;
    expect(g + a + r).toBe(15);
  });

});

// ── SUITE 7: SORT LOGIC ───────────────────────────────────────────────────
describe('Suite 7 — Sort Logic', () => {

  function sortBy(arr, key, dir = 1) {
    return [...arr].sort((a, b) => {
      const av = a[key], bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }

  it('sort by tcv ascending: first element has smallest TCV', () => {
    const sorted = sortBy(CBA_DATA.usecases, 'tcv', 1);
    expect(sorted[0].tcv).toBeLessThanOrEqual(sorted[sorted.length - 1].tcv);
  });

  it('sort by tcv descending: first element has largest TCV', () => {
    const sorted = sortBy(CBA_DATA.usecases, 'tcv', -1);
    expect(sorted[0].tcv).toBeGreaterThanOrEqual(sorted[sorted.length - 1].tcv);
  });

  it('sort by name ascending is alphabetical', () => {
    const sorted = sortBy(CBA_DATA.usecases, 'name', 1);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].name.localeCompare(sorted[i+1].name) > 0)
        throw new Error(`Sort broken at index ${i}: "${sorted[i].name}" > "${sorted[i+1].name}"`);
    }
  });

  it('sort preserves array length', () => {
    const sorted = sortBy(CBA_DATA.usecases, 'tcv', 1);
    expect(sorted).toHaveLength(15);
  });

  it('sort does not mutate original array', () => {
    const original = CBA_DATA.usecases[0].id;
    sortBy(CBA_DATA.usecases, 'tcv', -1);
    expect(CBA_DATA.usecases[0].id).toBe(original);
  });

});

// ── SUITE 8: MODAL HTML GENERATION ───────────────────────────────────────
describe('Suite 8 — Modal HTML Generation', () => {

  // Simulate openUCModal without DOM by extracting the HTML-generation logic
  // UC IDs are numeric in data.js
  function generateModalHTML(ucId) {
    const uc = CBA_DATA.computed.ucById(ucId);
    if (!uc) return null;
    const statusColor = { green: 'var(--green)', amber: 'var(--amber)', red: 'var(--red)' }[uc.status];
    const productsHtml = uc.products.map(p => `<span>${p}</span>`).join(' ');
    return `<div class="modal-content" data-uc-id="${uc.id}">
      <h2>${uc.name}</h2>
      <span data-status="${uc.status}">${uc.statusLabel}</span>
      <span data-tcv="${uc.tcv}">$${uc.tcv}M</span>
      <div class="products">${productsHtml}</div>
      <p class="description">${uc.description}</p>
      <p class="next-step">${uc.next_step}</p>
      <div class="team">Lead: ${uc.h2o_lead}</div>
    </div>`;
  }

  it('generateModalHTML returns non-null for valid UC (id=1)', () => {
    const html = generateModalHTML(1);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('generateModalHTML returns null for invalid UC (id=9999)', () => {
    const html = generateModalHTML(9999);
    expect(html).toBeNull();
  });

  it('modal HTML contains UC name', () => {
    const uc = CBA_DATA.computed.ucById(1);
    const html = generateModalHTML(1);
    expect(html).toContain(uc.name);
  });

  it('modal HTML contains UC TCV', () => {
    const uc = CBA_DATA.computed.ucById(1);
    const html = generateModalHTML(1);
    expect(html).toContain(`$${uc.tcv}M`);
  });

  it('modal HTML contains status attribute', () => {
    const html = generateModalHTML(1);
    expect(html).toContain('data-status="green"');
  });

  it('modal HTML contains description', () => {
    const uc = CBA_DATA.computed.ucById(1);
    const html = generateModalHTML(1);
    expect(html).toContain(uc.description.substring(0, 20));
  });

  it('modal HTML contains H2O lead', () => {
    const uc = CBA_DATA.computed.ucById(1);
    const html = generateModalHTML(1);
    expect(html).toContain(uc.h2o_lead);
  });

  it('modal HTML for UC id=2 contains status', () => {
    const uc = CBA_DATA.computed.ucById(2);
    const html = generateModalHTML(2);
    expect(html).toContain(`data-status="${uc.status}"`);
  });

  it('can generate modal HTML for all 15 UCs', () => {
    CBA_DATA.usecases.forEach(uc => {
      const html = generateModalHTML(uc.id);
      if (!html || !html.includes(uc.name))
        throw new Error(`Modal HTML generation failed for UC id=${uc.id}`);
    });
  });

});

// ── SUITE 9: STAKEHOLDER DATA ─────────────────────────────────────────────
describe('Suite 9 — Stakeholder Data', () => {

  it('H2O team has at least 5 members', () => {
    expect(CBA_DATA.stakeholders.h2o.length).toBeGreaterThanOrEqual(5);
  });

  it('CBA team has at least 5 members', () => {
    expect(CBA_DATA.stakeholders.cba.length).toBeGreaterThanOrEqual(5);
  });

  it('all H2O team members have name and role', () => {
    CBA_DATA.stakeholders.h2o.forEach(p => {
      if (!p.name || !p.role)
        throw new Error(`H2O member missing name/role: ${JSON.stringify(p)}`);
    });
  });

  it('all CBA team members have name and role', () => {
    CBA_DATA.stakeholders.cba.forEach(p => {
      if (!p.name || !p.role)
        throw new Error(`CBA member missing name/role: ${JSON.stringify(p)}`);
    });
  });

  it('H2O team has at least one KGM role', () => {
    const kgms = CBA_DATA.stakeholders.h2o.filter(p =>
      p.role && (p.role.includes('KGM') || p.role.includes('FDE'))
    );
    expect(kgms.length).toBeGreaterThan(0);
  });

  it('H2O team UC assignments reference valid IDs', () => {
    const validIds = new Set(CBA_DATA.usecases.map(u => u.id));
    CBA_DATA.stakeholders.h2o.forEach(p => {
      if (p.ucs) {
        p.ucs.forEach(id => {
          if (!validIds.has(id))
            throw new Error(`H2O member "${p.name}" has invalid UC reference "${id}"`);
        });
      }
    });
  });

  it('initials helper works for all team member names', () => {
    [...CBA_DATA.stakeholders.h2o, ...CBA_DATA.stakeholders.cba].forEach(p => {
      const ini = initials(p.name);
      if (!ini || ini.length === 0)
        throw new Error(`initials() failed for "${p.name}"`);
    });
  });

});

// ── SUITE 10: TIMELINE / GANTT DATA ──────────────────────────────────────
describe('Suite 10 — Timeline / Gantt Data', () => {

  it('timeline.projects has at least 10 entries', () => {
    expect(CBA_DATA.timeline.projects.length).toBeGreaterThanOrEqual(10);
  });

  it('all timeline projects have required fields', () => {
    const required = ['id', 'name', 'phases'];
    CBA_DATA.timeline.projects.forEach(t => {
      required.forEach(f => {
        if (t[f] === undefined)
          throw new Error(`Timeline project id="${t.id}" missing field "${f}"`);
      });
    });
  });

  it('all timeline phases have start, end, and type', () => {
    CBA_DATA.timeline.projects.forEach(t => {
      if (!Array.isArray(t.phases)) return;
      t.phases.forEach(p => {
        if (typeof p.s !== 'number' || typeof p.e !== 'number' || !p.type)
          throw new Error(`Timeline "${t.id}" phase malformed: ${JSON.stringify(p)}`);
      });
    });
  });

  it('all timeline phase start values are 0-based within 12 months', () => {
    CBA_DATA.timeline.projects.forEach(t => {
      if (!Array.isArray(t.phases)) return;
      t.phases.forEach(p => {
        if (p.s < 0 || p.s > 12)
          throw new Error(`Timeline "${t.id}" phase start out of range: ${p.s}`);
      });
    });
  });

  it('all timeline phase end values do not exceed 13', () => {
    CBA_DATA.timeline.projects.forEach(t => {
      if (!Array.isArray(t.phases)) return;
      t.phases.forEach(p => {
        if (p.e > 13)
          throw new Error(`Timeline "${t.id}" phase end out of range: ${p.e}`);
      });
    });
  });

  it('all timeline phases have end > start', () => {
    CBA_DATA.timeline.projects.forEach(t => {
      if (!Array.isArray(t.phases)) return;
      t.phases.forEach(p => {
        if (p.e <= p.s)
          throw new Error(`Timeline "${t.id}" phase end (${p.e}) <= start (${p.s})`);
      });
    });
  });

  it('timeline phase types are valid', () => {
    const valid = new Set(['ad', 'build', 'bench', 'handover', 'maint', 'tbd']);
    CBA_DATA.timeline.projects.forEach(t => {
      if (!Array.isArray(t.phases)) return;
      t.phases.forEach(p => {
        if (!valid.has(p.type))
          throw new Error(`Timeline "${t.id}" has unknown phase type "${p.type}"`);
      });
    });
  });

  it('timeline project IDs match UC IDs or are sequential numbers', () => {
    const validUCIds = new Set(CBA_DATA.usecases.map(u => u.id));
    CBA_DATA.timeline.projects.forEach(t => {
      if (typeof t.id === 'number' && !validUCIds.has(t.id) && t.id > 15)
        throw new Error(`Timeline project id="${t.id}" out of expected range`);
    });
  });

  it('usageModel exists with required structure', () => {
    expect(CBA_DATA.usageModel).toBeTruthy();
    expect(typeof CBA_DATA.usageModel).toBe('object');
  });

  it('teamRoles exists and is an array', () => {
    expect(Array.isArray(CBA_DATA.teamRoles)).toBe(true);
    expect(CBA_DATA.teamRoles.length).toBeGreaterThan(0);
  });

});

// ── FINAL REPORT ──────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(55));
console.log(` CBA Website Test Suite Results`);
console.log('═'.repeat(55));
console.log(` Total:   ${total}`);
console.log(` \x1b[32mPassed:  ${passed}\x1b[0m`);
console.log(` \x1b[31mFailed:  ${failed}\x1b[0m`);
if (failed > 0) {
  console.log('\n\x1b[31m Failures:\x1b[0m');
  failures.forEach(f => {
    console.log(`   • ${f.desc}`);
    console.log(`     ${f.message}`);
  });
}
console.log('═'.repeat(55) + '\n');

process.exit(failed > 0 ? 1 : 0);
