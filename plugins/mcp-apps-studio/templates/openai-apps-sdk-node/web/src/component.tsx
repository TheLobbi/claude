/**
 * __APP_TITLE__ — ChatGPT component.
 *
 * Renders from the MCP Apps bridge (portable everywhere) and layers
 * `window.openai` extensions only where the standard has no equivalent —
 * always feature-detected, never branched on host name.
 */

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

type Item = { id: string; title: string; subtitle?: string };
type Result = { query: string; items: Item[] } | null;

/** Bound and shape-check the payload before it reaches the DOM. */
function parseResult(input: unknown): Result {
  if (!input || typeof input !== 'object') return null;
  const raw = input as { query?: unknown; items?: unknown };
  if (typeof raw.query !== 'string' || !Array.isArray(raw.items)) return null;
  const items = raw.items.slice(0, 50).flatMap((entry): Item[] => {
    if (!entry || typeof entry !== 'object') return [];
    const e = entry as Record<string, unknown>;
    if (typeof e.id !== 'string' || typeof e.title !== 'string') return [];
    return [{
      id: e.id.slice(0, 128),
      title: e.title.slice(0, 200),
      subtitle: typeof e.subtitle === 'string' ? e.subtitle.slice(0, 400) : undefined,
    }];
  });
  return { query: raw.query.slice(0, 200), items };
}

/** Portable: subscribe to the MCP Apps bridge notification directly. */
function useToolResult(): Result {
  const [result, setResult] = useState<Result>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;            // required
      const message = event.data;
      if (!message || message.jsonrpc !== '2.0') return;     // required
      if (message.method !== 'ui/notifications/tool-result') return;
      setResult(parseResult(message.params?.structuredContent));
    };
    window.addEventListener('message', onMessage, { passive: true });
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return result;
}

type WidgetState = { selectedId: string | null };

function Widget() {
  const result = useToolResult();
  const openai = typeof window !== 'undefined' ? window.openai : undefined;

  // Widget state is ChatGPT-scoped and ephemeral — remount survival, not storage.
  const [state, setState] = useState<WidgetState>(
    (openai?.widgetState as WidgetState | undefined) ?? { selectedId: null },
  );

  function select(selectedId: string) {
    const next = { ...state, selectedId };
    setState(next);
    openai?.setWidgetState?.(next);   // synchronous; nothing to await
  }

  if (!result) {
    return <div className="card" aria-busy="true"><p>Loading…</p></div>;
  }
  if (result.items.length === 0) {
    return (
      <div className="card">
        <p>Nothing matched “{result.query}”. Try a broader term.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>{result.query}</h1>
      <ul>
        {result.items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              aria-pressed={state.selectedId === item.id}
              onClick={() => select(item.id)}
            >
              {/* Text interpolation — never dangerouslySetInnerHTML. */}
              {item.title}
              {item.subtitle && <span className="muted"> — {item.subtitle}</span>}
            </button>
          </li>
        ))}
      </ul>
      {/* Hide, do not disable, a control the host cannot honor. */}
      {openai?.requestDisplayMode && (
        <button type="button" onClick={() => openai.requestDisplayMode?.({ mode: 'fullscreen' })}>
          Expand
        </button>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Widget />);
