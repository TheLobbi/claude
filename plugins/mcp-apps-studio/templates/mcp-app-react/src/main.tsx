import { StrictMode, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { createBridge, type HostBridge, type HostContext, type ToolResult } from './bridge';
import { parseResult, safeHref, type Item, type Result } from './schema';
import './styles.css';

/* -------------------------------------------------------------------------- */
/* Bridge wiring                                                              */
/* -------------------------------------------------------------------------- */

type Phase = 'loading' | 'ready' | 'error';

function useHost(name: string) {
  const bridgeRef = useRef<HostBridge | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [result, setResult] = useState<Result | null>(null);
  const [pendingQuery, setPendingQuery] = useState<string | undefined>();
  const [ctx, setCtx] = useState<HostContext | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bridge = createBridge(name);
    bridgeRef.current = bridge;

    const applyResult = (toolResult: ToolResult) => {
      if (toolResult.isError) {
        setError(toolResult.content?.find((c) => c.type === 'text')?.text ?? 'The tool reported an error.');
        setPhase('error');
        return;
      }
      const parsed = parseResult(toolResult.structuredContent);
      if (!parsed) {
        setError('The response did not match the expected shape.');
        setPhase('error');
        bridge.log('error', { reason: 'schema-mismatch' });
        return;
      }
      setResult(parsed);
      setError(null);
      setPhase('ready');
    };

    // ⚠ Every handler BEFORE connect(). Reversed, the first tool-result is lost
    //   and the widget renders empty until something else triggers a re-render.
    bridge.onToolInput((input) => {
      const query = (input as { query?: string } | null)?.query;
      if (typeof query === 'string') setPendingQuery(query);
    });
    bridge.onToolInputPartial((partial) => {
      // Healed JSON: may be truncated. Safe to preview, never safe to act on.
      const query = (partial as { query?: string } | null)?.query;
      if (typeof query === 'string') setPendingQuery(query);
    });
    bridge.onToolResult(applyResult);
    bridge.onHostContextChanged(setCtx);
    bridge.onTeardown(() => bridgeRef.current = null);

    bridge.connect();
    setCtx(bridge.getContext());

    return () => { bridgeRef.current = null; };
  }, [name]);

  return { bridge: bridgeRef, phase, result, pendingQuery, ctx, error, setPhase, setResult, setError };
}

/* -------------------------------------------------------------------------- */
/* Height reporting                                                           */
/* -------------------------------------------------------------------------- */

function useReportedHeight(bridge: React.MutableRefObject<HostBridge | null>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: number | undefined;
    // Debounced and integer-rounded: sub-pixel deltas oscillate, and emitting on
    // every frame produces visible thrash.
    const observer = new ResizeObserver((entries) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const box = entries[0]?.contentRect;
        if (box) bridge.current?.setSize(Math.round(box.width), Math.round(box.height));
      }, 100);
    });
    observer.observe(el);
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, [bridge]);

  return ref;
}

/* -------------------------------------------------------------------------- */
/* States                                                                     */
/* -------------------------------------------------------------------------- */

/** Built from the tool ARGUMENTS, which arrive before the result. A skeleton
 *  with the real query reads as instant; a bare spinner reads as broken. */
function Skeleton({ query }: { query?: string }) {
  return (
    <div className="card" aria-busy="true">
      <h1 className="title">{query ? `Searching “${query}”…` : 'Loading…'}</h1>
      <ul className="list" aria-hidden="true">
        {[0, 1, 2].map((i) => <li key={i} className="row skeleton" />)}
      </ul>
    </div>
  );
}

function EmptyState({ query, onRetry }: { query?: string; onRetry: () => void }) {
  return (
    <div className="card">
      <h1 className="title">Nothing matched{query ? ` “${query}”` : ''}</h1>
      <p className="muted">Try a broader term, or check that the source has data for this query.</p>
      <button type="button" className="btn" onClick={onRetry}>Search again</button>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card" role="alert">
      <h1 className="title">Something went wrong</h1>
      <p className="muted">{message}</p>
      <button type="button" className="btn" onClick={onRetry}>Try again</button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Widget                                                                     */
/* -------------------------------------------------------------------------- */

function Row({ item, selected, onSelect, onOpen }: {
  item: Item;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpen: (url: string) => void;
}) {
  const href = safeHref(item.url);
  return (
    <li className="row">
      {/* A real <button>, not a div with a click handler — keyboard reach and
          screen-reader semantics come for free. */}
      <button
        type="button"
        className={`row-main${selected ? ' is-selected' : ''}`}
        aria-pressed={selected}
        onClick={() => onSelect(item.id)}
      >
        {/* Text, never innerHTML: this payload is untrusted input. */}
        <span className="row-title">{item.title}</span>
        {item.subtitle && <span className="row-subtitle">{item.subtitle}</span>}
        <span className={`badge badge--${item.status}`}>{item.status}</span>
      </button>
      {href && (
        <button type="button" className="btn btn--ghost" onClick={() => onOpen(href)}>
          Open<span className="sr-only"> {item.title}</span>
        </button>
      )}
    </li>
  );
}

function Widget() {
  const { bridge, phase, result, pendingQuery, ctx, error, setPhase, setResult, setError } =
    useHost('__APP_TITLE__');
  const containerRef = useReportedHeight(bridge);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const caps = bridge.current?.capabilities();

  // Tell the model what the user is looking at — bounded structured facts only.
  useEffect(() => {
    if (phase !== 'ready' || !result) return;
    void bridge.current?.updateModelContext({
      view: '__APP_SLUG__',
      query: result.query,
      total: result.items.length,
      selectedId,
    });
  }, [bridge, phase, result, selectedId]);

  const refresh = useCallback(async () => {
    const query = result?.query ?? pendingQuery;
    if (!query) return;
    setPhase('loading');
    try {
      // An app-only tool: the widget updates in place and never remounts, and
      // the call stays out of the model's context.
      const next = await bridge.current?.callTool('refresh___APP_SNAKE__', { query, limit: 20 });
      const parsed = parseResult(next?.structuredContent);
      if (parsed) { setResult(parsed); setPhase('ready'); }
      else { setError('Refresh returned an unexpected shape.'); setPhase('error'); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refresh failed.');
      setPhase('error');
    }
  }, [bridge, result, pendingQuery, setPhase, setResult, setError]);

  const openLink = useCallback((url: string) => {
    void bridge.current?.openLink(url);
  }, [bridge]);

  const goFullscreen = useCallback(() => {
    void bridge.current?.requestDisplayMode('fullscreen');
  }, [bridge]);

  const body = (() => {
    if (phase === 'loading') return <Skeleton query={pendingQuery} />;
    if (phase === 'error') return <ErrorState message={error ?? 'Unknown error.'} onRetry={refresh} />;
    if (!result || result.items.length === 0) return <EmptyState query={result?.query} onRetry={refresh} />;
    return (
      <div className="card">
        <div className="head">
          <h1 className="title">{result.query}</h1>
          <span className="muted">{result.items.length} item{result.items.length === 1 ? '' : 's'}</span>
        </div>
        <ul className="list" aria-live="polite">
          {result.items.map((item) => (
            <Row
              key={item.id}
              item={item}
              selected={item.id === selectedId}
              onSelect={setSelectedId}
              onOpen={openLink}
            />
          ))}
        </ul>
        {/* At most two primary actions on an inline card. */}
        <div className="actions">
          <button type="button" className="btn" onClick={refresh}>Refresh</button>
          {/* Never render a control the host cannot honor — hide it. */}
          {caps?.canChangeDisplayMode
            && (ctx?.availableDisplayModes ?? ['inline']).includes('fullscreen') && (
            <button type="button" className="btn btn--ghost" onClick={goFullscreen}>Expand</button>
          )}
        </div>
      </div>
    );
  })();

  return (
    <div
      ref={containerRef}
      className="app"
      data-theme={ctx?.theme ?? 'light'}
      style={{
        paddingTop: ctx?.safeAreaInsets?.top ?? 0,
        paddingBottom: ctx?.safeAreaInsets?.bottom ?? 0,
      }}
    >
      {body}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Widget />
  </StrictMode>,
);
