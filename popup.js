// ─── State machine ─────────────────────────────────────────────────────────
// States: unsupported | ready | loading | preview | sending | success | error

const STATES = ['unsupported', 'ready', 'loading', 'preview', 'sending', 'success', 'error'];

let currentFlow = null; // extracted flow data from content script

function showState(name) {
  STATES.forEach(s => {
    const el = document.getElementById(`state-${s}`);
    if (el) el.classList.toggle('hidden', s !== name);
  });
}

// ─── Platform detection ─────────────────────────────────────────────────────

function detectPlatform(url) {
  if (!url) return null;
  if (url.includes('zapier.com/editor') || url.includes('zapier.com/app/editor')) return 'zapier';
  if (url.includes('app.clay.com')) return 'clay';
  return null;
}

function setPlatformBadge(elementId, platform) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = platform === 'zapier' ? 'Zapier' : 'Clay';
  el.className = `platform-badge ${platform}`;
}

// ─── Steps renderer ─────────────────────────────────────────────────────────

function renderSteps(steps) {
  const list = document.getElementById('steps-list');
  list.innerHTML = '';

  steps.forEach((step, index) => {
    // Connector line between steps
    if (index > 0) {
      const connector = document.createElement('div');
      connector.className = 'connector';
      list.appendChild(connector);
    }

    const item = document.createElement('div');
    item.className = 'step-item';

    const num = document.createElement('div');
    num.className = `step-number${step.type === 'trigger' ? ' trigger' : ''}`;
    num.textContent = index + 1;

    const info = document.createElement('div');
    info.className = 'step-info';

    const app = document.createElement('div');
    app.className = 'step-app';
    app.textContent = step.app;

    const action = document.createElement('div');
    action.className = 'step-action';
    action.textContent = step.action || step.type;

    info.appendChild(app);
    info.appendChild(action);
    item.appendChild(num);
    item.appendChild(info);
    list.appendChild(item);
  });
}

// ─── Settings panel ─────────────────────────────────────────────────────────

async function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get(['gtmhubApiKey', 'gtmhubApiUrl'], result => {
      resolve({
        apiKey: result.gtmhubApiKey || '',
        apiUrl: result.gtmhubApiUrl || 'https://api.gtmhub.io',
      });
    });
  });
}

async function saveSettings() {
  const apiKey = document.getElementById('api-key').value.trim();
  const apiUrl = document.getElementById('api-url').value.trim();
  const status = document.getElementById('settings-status');

  if (!apiKey || !apiUrl) {
    showSettingsStatus('API key and URL are required.', 'error');
    return;
  }

  await new Promise(resolve => {
    chrome.storage.sync.set({ gtmhubApiKey: apiKey, gtmhubApiUrl: apiUrl }, resolve);
  });

  showSettingsStatus('Saved!', 'success');
  setTimeout(() => status.classList.add('hidden'), 2000);
}

function showSettingsStatus(msg, type) {
  const el = document.getElementById('settings-status');
  el.textContent = msg;
  el.className = `status-msg ${type}`;
  el.classList.remove('hidden');
}

// ─── Core flow: scan → preview → import ────────────────────────────────────

async function scanFlow(tabId) {
  showState('loading');

  let response;
  try {
    response = await chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_FLOW' });
  } catch (err) {
    // Content script not injected yet (page may still be loading)
    showState('error');
    document.getElementById('error-message').textContent =
      'Could not read the page. Make sure the flow is fully loaded, then try again.';
    return;
  }

  if (!response || response.error) {
    showState('error');
    document.getElementById('error-message').textContent =
      response?.error || 'No flow data found on this page.';
    return;
  }

  currentFlow = response;

  // Populate preview
  const platform = response.platform;
  setPlatformBadge('preview-platform', platform);
  document.getElementById('preview-name').textContent = response.name || 'Untitled Flow';
  renderSteps(response.steps || []);

  showState('preview');
}

async function importFlow() {
  if (!currentFlow) return;

  const { apiKey, apiUrl } = await loadSettings();
  if (!apiKey || !apiUrl) {
    showState('error');
    document.getElementById('error-message').textContent =
      'No API key set. Open ⚙ Settings and add your GTMhub API key.';
    return;
  }

  showState('sending');

  const response = await chrome.runtime.sendMessage({
    action: 'IMPORT_FLOW',
    payload: { flow: currentFlow, apiKey, apiUrl },
  });

  if (response.error) {
    showState('error');
    document.getElementById('error-message').textContent = response.error;
    return;
  }

  // Success
  const viewLink = document.getElementById('view-link');
  viewLink.href = response.url || `${apiUrl}/flows/${response.id}`;
  showState('success');
}

// ─── Init ───────────────────────────────────────────────────────────────────

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const platform = detectPlatform(tab?.url);

  if (!platform) {
    showState('unsupported');
    return;
  }

  setPlatformBadge('platform-label', platform);
  showState('ready');

  // Load settings into fields
  const settings = await loadSettings();
  document.getElementById('api-key').value = settings.apiKey;
  document.getElementById('api-url').value = settings.apiUrl;

  // ── Button wiring ────────────────────────────────────────
  document.getElementById('scan-btn').addEventListener('click', () => scanFlow(tab.id));
  document.getElementById('rescan-btn').addEventListener('click', () => scanFlow(tab.id));
  document.getElementById('retry-btn').addEventListener('click', () => scanFlow(tab.id));

  document.getElementById('import-btn').addEventListener('click', importFlow);

  document.getElementById('import-another-btn').addEventListener('click', () => {
    currentFlow = null;
    showState('ready');
  });

  document.getElementById('settings-btn').addEventListener('click', () => {
    const panel = document.getElementById('settings-panel');
    const mainPanel = document.getElementById('main-panel');
    const isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !isHidden);
    mainPanel.classList.toggle('hidden', isHidden);
  });

  document.getElementById('save-settings').addEventListener('click', saveSettings);
}

document.addEventListener('DOMContentLoaded', init);
