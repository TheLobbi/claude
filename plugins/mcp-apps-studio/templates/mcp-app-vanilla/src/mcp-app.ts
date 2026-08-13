/**
 * __APP_TITLE__ — vanilla View.
 *
 * No framework. The ordering discipline and the untrusted-payload discipline are
 * exactly the same as the React template; only the rendering is manual.
 */

import { App } from '@modelcontextprotocol/ext-apps';

const valueEl = document.getElementById('value')!;
const statusEl = document.getElementById('status')!;
const refreshBtn = document.getElementById('refresh') as HTMLButtonElement;
const expandBtn = document.getElementById('expand') as HTMLButtonElement;

const app = new App({ name: '__APP_TITLE__', version: '1.0.0' });

/** Untrusted payload → text, never innerHTML. Bounded before it reaches the DOM. */
function render(value: unknown): void {
  const text = typeof value === 'string' ? value.slice(0, 500) : null;
  valueEl.textContent = text ?? '—';
  statusEl.textContent = text ? '' : 'No data.';
  statusEl.hidden = Boolean(text);
  reportSize();
}

function setError(message: string): void {
  valueEl.textContent = '—';
  statusEl.textContent = message;
  statusEl.hidden = false;
  // Tell the model the view is degraded so it can help rather than assume success.
  void app.updateModelContext?.({ view: '__APP_SLUG__', state: 'error' });
  reportSize();
}

let sizeTimer: number | undefined;
function reportSize(): void {
  window.clearTimeout(sizeTimer);
  sizeTimer = window.setTimeout(() => {
    app.sendSizeChanged?.({
      width: Math.round(document.body.scrollWidth),
      height: Math.round(document.body.scrollHeight),
    });
  }, 100);
}

// ⚠ Every handler BEFORE connect(). Reversed, the first tool-result is dropped.
app.ontoolinput = () => {
  statusEl.textContent = 'Loading…';
  statusEl.hidden = false;
};

app.ontoolresult = (result) => {
  if (result.isError) {
    setError(result.content?.find((c) => c.type === 'text')?.text ?? 'The tool reported an error.');
    return;
  }
  render((result.structuredContent as { value?: unknown } | undefined)?.value);
};

app.onteardown = () => {
  window.clearTimeout(sizeTimer);
};

app.onhostcontextchanged = (ctx) => {
  document.documentElement.dataset.theme = ctx?.theme ?? 'light';
};

app.connect();

document.documentElement.dataset.theme = app.getHostContext?.()?.theme ?? 'light';

refreshBtn.addEventListener('click', async () => {
  refreshBtn.disabled = true;
  try {
    const result = await app.callServerTool({ name: 'get___APP_SNAKE__', arguments: {} });
    render((result.structuredContent as { value?: unknown } | undefined)?.value);
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Refresh failed.');
  } finally {
    refreshBtn.disabled = false;
  }
});

// Never render a control the host cannot honor — hide it.
const modes = app.getHostContext?.()?.availableDisplayModes ?? ['inline'];
if (!app.requestDisplayMode || !modes.includes('fullscreen')) {
  expandBtn.hidden = true;
} else {
  expandBtn.addEventListener('click', () => {
    void app.requestDisplayMode?.({ mode: 'fullscreen' });
  });
}
