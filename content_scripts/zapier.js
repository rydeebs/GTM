// Zapier content script
// Runs on: zapier.com/editor/* and zapier.com/app/editor/*
//
// IMPORTANT: Zapier's editor is a React SPA whose class names are auto-generated
// and change with deployments. This scraper uses a layered strategy:
//   1. data-testid attributes  (most stable)
//   2. aria-* attributes       (accessibility labels, fairly stable)
//   3. Semantic / structural   (position-based fallbacks)
// If Zapier updates their UI, extend the SELECTORS object below.

(() => {
  // ─── Selector catalogue ──────────────────────────────────────────────────
  // Each entry is an array of selectors tried in order until one matches.
  const SELECTORS = {
    // The container wrapping all steps in the Zap editor
    stepCards: [
      '[data-testid="step-card"]',
      '[data-testid="zap-step"]',
      '[class*="StepCard"]',
      '[class*="step-card"]',
      '[class*="ZapStep"]',
      // Last-resort: numbered li children of the editor canvas
      '.editor-steps > li',
    ],

    // App name inside a step card
    appName: [
      '[data-testid="app-name"]',
      '[data-testid="step-app-name"]',
      '[aria-label*="app"]',
      '[class*="AppName"]',
      '[class*="appName"]',
      'h3',           // Zapier often renders app name as h3 inside the card
    ],

    // Action/event name inside a step card
    actionName: [
      '[data-testid="action-name"]',
      '[data-testid="event-name"]',
      '[data-testid="step-event"]',
      '[class*="ActionName"]',
      '[class*="EventName"]',
      'h4',
      'p',
    ],

    // Step type indicator (trigger vs action)
    triggerLabel: [
      '[data-testid="trigger-label"]',
      '[aria-label*="Trigger"]',
      '[class*="Trigger"]',
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
    return el ? el.textContent.trim() : '';
  }

  function findStepCards() {
    for (const sel of SELECTORS.stepCards) {
      try {
        const cards = [...document.querySelectorAll(sel)];
        if (cards.length > 0) return cards;
      } catch (_) {}
    }
    return [];
  }

  // ─── Extract Zap name ────────────────────────────────────────────────────
  function extractZapName() {
    const candidates = [
      '[data-testid="zap-name"]',
      '[data-testid="zap-title"]',
      'input[aria-label*="name" i]',
      'input[placeholder*="name" i]',
      'h1',
      'title',
    ];
    for (const sel of candidates) {
      try {
        const el = document.querySelector(sel);
        if (!el) continue;
        const text = (el.value || el.textContent || '').trim();
        if (text && text !== 'Zapier') return text;
      } catch (_) {}
    }
    return document.title.replace(' | Zapier', '').trim() || 'Untitled Zap';
  }

  // ─── Extract Zap ID from URL ─────────────────────────────────────────────
  function extractZapId() {
    // URLs: /editor/12345678 or /app/editor/12345678/...
    const match = window.location.pathname.match(/\/editor\/(\d+)/);
    return match ? match[1] : null;
  }

  // ─── Determine step type ─────────────────────────────────────────────────
  function getStepType(card, index) {
    // Explicit trigger label wins
    if (queryFirst(card, SELECTORS.triggerLabel)) return 'trigger';

    // Zapier renders "Filter" steps with a specific label
    const text = card.textContent || '';
    if (/filter/i.test(text) && index > 0) return 'filter';

    // First step is always the trigger
    return index === 0 ? 'trigger' : 'action';
  }

  // ─── Main extractor ──────────────────────────────────────────────────────
  function extractFlow() {
    const cards = findStepCards();

    if (cards.length === 0) {
      return { error: 'No steps found. Make sure the Zap editor is fully loaded.' };
    }

    const steps = cards.map((card, index) => {
      const app    = getText(card, SELECTORS.appName)    || 'Unknown App';
      const action = getText(card, SELECTORS.actionName) || '';
      const type   = getStepType(card, index);

      return {
        type,
        app,
        action,
        description: `${app}: ${action}`.trim(),
        rawMeta: {
          innerText: card.innerText?.slice(0, 300), // snapshot for debugging
        },
      };
    });

    return {
      platform: 'zapier',
      id: extractZapId(),
      name: extractZapName(),
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
