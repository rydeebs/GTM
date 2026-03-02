// Clay content script
// Runs on: app.clay.com/*
//
// Clay's UI is a spreadsheet/table where each column header or sidebar item
// represents an enrichment step (data source / action). The scraper tries
// to read the waterfall/run sequence from the sidebar or column headers.
//
// Selector strategy — same layered approach as zapier.js:
//   1. data-testid / data-* attributes
//   2. aria-* labels
//   3. Structural / positional fallbacks

(() => {
  // ─── Selector catalogue ──────────────────────────────────────────────────
  const SELECTORS = {
    // Sidebar list of enrichment steps (most reliable entry point)
    sidebarSteps: [
      '[data-testid="enrichment-step"]',
      '[data-testid="waterfall-step"]',
      '[data-testid="run-step"]',
      '[class*="EnrichmentStep"]',
      '[class*="WaterfallStep"]',
      '[class*="enrichment-step"]',
      // fallback: list items inside the left sidebar panel
      'aside li',
      '[role="listitem"]',
    ],

    // Column headers in the table view (each column = one enrichment)
    columnHeaders: [
      '[data-testid="column-header"]',
      '[data-testid="table-column-header"]',
      '[class*="ColumnHeader"]',
      '[class*="column-header"]',
      'th[data-column-id]',
      'th',
    ],

    // Name/label within a step or column header
    stepLabel: [
      '[data-testid="step-name"]',
      '[data-testid="enrichment-name"]',
      '[class*="StepName"]',
      '[class*="step-name"]',
      'span',
      'p',
    ],

    // Integration/provider badge (e.g. "Apollo", "Clearbit")
    stepProvider: [
      '[data-testid="provider-name"]',
      '[data-testid="integration-name"]',
      '[class*="ProviderName"]',
      '[class*="provider"]',
      'img[alt]',   // provider logos often have alt text
    ],
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function queryFirst(parent, selectors) {
    for (const sel of selectors) {
      try {
        const el = parent.querySelector(sel);
        if (el) return el;
      } catch (_) {}
    }
    return null;
  }

  function getText(parent, selectors) {
    const el = queryFirst(parent, selectors);
    if (!el) return '';
    // For images, prefer alt text
    if (el.tagName === 'IMG') return el.alt?.trim() || '';
    return el.textContent.trim();
  }

  function findAll(selectors) {
    for (const sel of selectors) {
      try {
        const els = [...document.querySelectorAll(sel)];
        if (els.length > 0) return els;
      } catch (_) {}
    }
    return [];
  }

  // ─── Extract table / run name ────────────────────────────────────────────
  function extractTableName() {
    const candidates = [
      '[data-testid="table-name"]',
      '[data-testid="run-name"]',
      'input[aria-label*="name" i]',
      'h1',
      'h2',
    ];
    for (const sel of candidates) {
      try {
        const el = document.querySelector(sel);
        if (!el) continue;
        const text = (el.value || el.textContent || '').trim();
        if (text) return text;
      } catch (_) {}
    }
    return document.title.replace(' | Clay', '').trim() || 'Untitled Table';
  }

  // ─── Extract table/run ID from URL ──────────────────────────────────────
  function extractTableId() {
    // Clay URLs look like: app.clay.com/tables/{id} or /runs/{id}
    const match = window.location.pathname.match(/\/(tables|runs)\/([a-zA-Z0-9_-]+)/);
    return match ? match[2] : null;
  }

  // ─── Determine step type for Clay ────────────────────────────────────────
  // Clay doesn't have a "trigger" concept the same way Zapier does.
  // We mark the first column after the built-in identity columns as the seed source.
  const BUILT_IN_COLUMNS = new Set([
    'name', 'email', 'company', 'linkedin', 'website', 'phone', 'title', '#', 'status',
  ]);

  function getStepType(label, index) {
    if (index === 0) return 'seed'; // first meaningful column = seed list
    if (/filter/i.test(label)) return 'filter';
    return 'enrichment';
  }

  // ─── Try sidebar steps first ─────────────────────────────────────────────
  function extractFromSidebar() {
    const items = findAll(SELECTORS.sidebarSteps);
    if (items.length === 0) return null;

    return items.map((item, index) => {
      const label    = getText(item, SELECTORS.stepLabel)    || item.textContent.trim().split('\n')[0] || 'Step';
      const provider = getText(item, SELECTORS.stepProvider) || '';
      const type     = getStepType(label, index);

      return {
        type,
        app: provider || label,
        action: provider ? label : '',
        description: [provider, label].filter(Boolean).join(': '),
        rawMeta: { innerText: item.innerText?.slice(0, 200) },
      };
    });
  }

  // ─── Fallback: read column headers from table view ───────────────────────
  function extractFromColumns() {
    const headers = findAll(SELECTORS.columnHeaders);
    if (headers.length === 0) return null;

    const meaningful = headers.filter(th => {
      const text = th.textContent.trim().toLowerCase();
      return text && !BUILT_IN_COLUMNS.has(text) && text.length > 1;
    });

    if (meaningful.length === 0) return null;

    return meaningful.map((th, index) => {
      const label    = getText(th, SELECTORS.stepLabel) || th.textContent.trim();
      const provider = getText(th, SELECTORS.stepProvider) || '';
      const type     = getStepType(label, index);

      return {
        type,
        app: provider || label,
        action: provider ? label : '',
        description: [provider, label].filter(Boolean).join(': '),
        rawMeta: { innerText: th.innerText?.slice(0, 200) },
      };
    });
  }

  // ─── Main extractor ──────────────────────────────────────────────────────
  function extractFlow() {
    const steps = extractFromSidebar() || extractFromColumns();

    if (!steps || steps.length === 0) {
      return {
        error:
          'No enrichment steps found. Make sure the Clay table is fully loaded and at least one enrichment column is visible.',
      };
    }

    return {
      platform: 'clay',
      id: extractTableId(),
      name: extractTableName(),
      steps,
      sourceUrl: window.location.href,
    };
  }

  // ─── Message listener ────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'EXTRACT_FLOW') {
      sendResponse(extractFlow());
    }
  });
})();
