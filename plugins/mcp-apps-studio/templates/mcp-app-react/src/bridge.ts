/**
 * The adapter layer.
 *
 * This is the ONLY module that knows which protocol we are speaking. Components
 * import `HostBridge`, never the SDK. Two payoffs:
 *
 *   1. Porting to another protocol is a one-file change instead of a rewrite.
 *   2. The View is unit-testable — inject a fake bridge and assert the DOM.
 *
 * It also centralizes capability guards, so a host that does not implement an
 * API produces a hidden control rather than a silent dead button.
 */

import { App } from '@modelcontextprotocol/ext-apps';

export type DisplayMode = 'inline' | 'fullscreen' | 'pip';

export interface HostContext {
  theme?: 'light' | 'dark';
  displayMode?: DisplayMode;
  availableDisplayModes?: DisplayMode[];
  viewport?: { maxHeight?: number };
  safeAreaInsets?: { top: number; right: number; bottom: number; left: number };
  locale?: string;
  userAgent?: string;
}

export interface ToolResult {
  content?: Array<{ type: string; text?: string }>;
  structuredContent?: unknown;
  isError?: boolean;
  _meta?: Record<string, unknown>;
}

export interface Capabilities {
  canCallTools: boolean;
  canChangeDisplayMode: boolean;
  canSendMessages: boolean;
  canUpdateModelContext: boolean;
  canLog: boolean;
}

export interface HostBridge {
  onToolInput(cb: (input: unknown) => void): void;
  onToolInputPartial(cb: (partial: unknown) => void): void;
  onToolResult(cb: (result: ToolResult) => void): void;
  onTeardown(cb: () => void): void;
  onHostContextChanged(cb: (ctx: HostContext) => void): void;
  connect(): void;
  callTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
  sendMessage(text: string): Promise<void>;
  updateModelContext(ctx: Record<string, unknown>): Promise<void>;
  openLink(url: string): Promise<void>;
  setSize(width: number, height: number): void;
  requestDisplayMode(mode: DisplayMode): Promise<DisplayMode | null>;
  getContext(): HostContext | undefined;
  capabilities(): Capabilities;
  log(level: 'debug' | 'info' | 'warning' | 'error', data: unknown): void;
}

const DEBUG = typeof location !== 'undefined'
  && new URLSearchParams(location.search).has('debug');

export function createBridge(name: string, version = '1.0.0'): HostBridge {
  const app = new App({ name, version });
  let connected = false;

  const requireNotConnected = (what: string) => {
    // Handlers registered after connect() miss the first notification — which is
    // the one that matters. Fail loudly in development rather than shipping a
    // widget that "works but only after you click refresh".
    if (connected && DEBUG) {
      console.warn(`[bridge] ${what} registered after connect(); the initial notification was already delivered.`);
    }
  };

  return {
    onToolInput(cb) {
      requireNotConnected('onToolInput');
      app.ontoolinput = (params: unknown) => cb(params);
    },
    onToolInputPartial(cb) {
      requireNotConnected('onToolInputPartial');
      // Unsupported on some hosts; assignment is harmless where it is ignored.
      // Partial args are JSON-healed and may be truncated — render, never act.
      app.ontoolinputpartial = (params: unknown) => cb(params);
    },
    onToolResult(cb) {
      requireNotConnected('onToolResult');
      app.ontoolresult = (result: ToolResult) => cb(result);
    },
    onTeardown(cb) {
      requireNotConnected('onTeardown');
      app.onteardown = () => cb();
    },
    onHostContextChanged(cb) {
      requireNotConnected('onHostContextChanged');
      app.onhostcontextchanged = (ctx: HostContext) => cb(ctx);
    },

    connect() {
      app.connect();
      connected = true;
    },

    async callTool(toolName, args) {
      return app.callServerTool({ name: toolName, arguments: args }) as Promise<ToolResult>;
    },

    async sendMessage(text) {
      await app.sendMessage?.({ content: text });
    },

    async updateModelContext(ctx) {
      // Send bounded structured facts — ids, counts, modes. Never raw
      // third-party prose: model context is trusted-looking, so upstream text
      // here is a prompt injection you built yourself.
      await app.updateModelContext?.(ctx);
    },

    async openLink(url) {
      // Host-mediated navigation. Never window.open / location.assign — the
      // host must be able to show the destination and refuse.
      await app.openLink?.({ url });
    },

    setSize(width, height) {
      app.sendSizeChanged?.({ width: Math.round(width), height: Math.round(height) });
    },

    async requestDisplayMode(mode) {
      const available = app.getHostContext?.()?.availableDisplayModes ?? ['inline'];
      if (!app.requestDisplayMode || !available.includes(mode)) return null;
      const granted = await app.requestDisplayMode({ mode });
      // Render from the mode you were GIVEN, not the one you asked for.
      return (granted?.mode ?? mode) as DisplayMode;
    },

    getContext() {
      return app.getHostContext?.() as HostContext | undefined;
    },

    capabilities() {
      return {
        canCallTools: typeof app.callServerTool === 'function',
        canChangeDisplayMode: typeof app.requestDisplayMode === 'function',
        canSendMessages: typeof app.sendMessage === 'function',
        canUpdateModelContext: typeof app.updateModelContext === 'function',
        canLog: typeof app.sendLog === 'function',
      };
    },

    log(level, data) {
      try {
        app.sendLog?.({ level, data });
      } catch {
        /* host does not support sendLog */
      }
      if (DEBUG) console.log(`[${level}]`, data);
    },
  };
}
