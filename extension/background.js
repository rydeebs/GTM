// Service worker – handles GTMhub API calls so the popup doesn't need
// host_permissions directly (keeps CSP simpler).

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'IMPORT_FLOW') {
    importFlow(message.payload).then(sendResponse);
    return true; // keep channel open for async response
  }
});

// ─── GTMhub API ─────────────────────────────────────────────────────────────

async function importFlow({ flow, apiKey, apiUrl }) {
  const endpoint = `${apiUrl.replace(/\/$/, '')}/v1/flows`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(serializeFlow(flow)),
    });
  } catch (networkErr) {
    return { error: `Network error: ${networkErr.message}` };
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body.message || body.error || '';
    } catch (_) {}
    return {
      error: `GTMhub returned ${response.status}${detail ? `: ${detail}` : ''}. Check your API key and URL in settings.`,
    };
  }

  let data;
  try {
    data = await response.json();
  } catch (_) {
    return { error: 'GTMhub returned an unexpected response.' };
  }

  return {
    id: data.id,
    url: data.url,
  };
}

// ─── Shape the extracted DOM data into GTMhub's expected payload ────────────

function serializeFlow(flow) {
  return {
    source: flow.platform,           // "zapier" | "clay"
    sourceId: flow.id,               // original flow ID from the URL/DOM
    name: flow.name,
    description: flow.description || '',
    steps: (flow.steps || []).map((step, index) => ({
      index,
      type: step.type,               // "trigger" | "action" | "filter"
      app: step.app,
      action: step.action,
      description: step.description || '',
      rawMeta: step.rawMeta || {},   // pass-through for any extra DOM data
    })),
    importedAt: new Date().toISOString(),
    sourceUrl: flow.sourceUrl,
  };
}
