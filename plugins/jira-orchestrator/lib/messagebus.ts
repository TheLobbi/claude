/**
 * Message Bus Implementation for Plugin Ecosystem
 *
 * Provides publish/subscribe, request/response, and RPC patterns
 * for inter-plugin communication.
 *
 * Enhanced with Request Deduplication (v7.4):
 * - Coalesces identical concurrent requests
 * - Reduces redundant API calls
 * - Tracks deduplication metrics
 *
 * @version 1.1.0 (v7.4)
 * @author architect-supreme, jira-orchestrator
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { RequestDeduplicator } from './request-deduplicator';

// ============================================
// TYPES AND INTERFACES
// ============================================

export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  EVENT = 'event',
  COMMAND = 'command',
}

export interface MessageHeaders {
  traceId?: string;
  spanId?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

export interface MessageMetadata {
  retryCount?: number;
  timeout?: number;
  expiresAt?: string;
  [key: string]: any;
}

export interface Message {
  messageId: string;
  correlationId?: string;
  timestamp: string;
  source: string;
  destination: string | '*';
  topic: string;
  messageType: MessageType;
  priority: number;
  headers: MessageHeaders;
  payload: any;
  metadata: MessageMetadata;
}

export interface PublishOptions {
  destination?: string | '*';
  topic: string;
  messageType: MessageType;
  priority?: number;
  headers?: MessageHeaders;
  payload: any;
  metadata?: MessageMetadata;
}

export interface RequestOptions extends Omit<PublishOptions, 'messageType'> {
  timeout?: number;
}

export interface SubscriptionHandler {
  (message: Message): void | Promise<void>;
}

export interface SubscriptionOptions {
  filter?: (message: Message) => boolean;
  priority?: number;
}

// ============================================
// MESSAGE BUS IMPLEMENTATION
// ============================================

export class MessageBus {
  private emitter: EventEmitter;
  private pluginId: string;
  private subscriptions: Map<string, Set<SubscriptionHandler>>;
  private pendingRequests: Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >;
  private deduplicator: RequestDeduplicator;

  constructor(pluginId: string) {
    this.pluginId = pluginId;
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Support many subscriptions
    this.subscriptions = new Map();
    this.pendingRequests = new Map();
    this.deduplicator = new RequestDeduplicator({ defaultWindowMs: 5000 });

    // Subscribe to responses for this plugin
    this.setupResponseHandler();
  }

  // ========================================
  // PUBLISH/SUBSCRIBE PATTERN
  // ========================================

  /**
   * Publish a message to a topic
   */
  async publish(options: PublishOptions): Promise<void> {
    // Create request hash for deduplication
    const hash = RequestDeduplicator.hashRequest(options.topic, options.payload);

    // Wrap in deduplicator for event-type messages
    await this.deduplicator.execute(
      hash,
      async () => {
        const message: Message = {
          messageId: uuidv4(),
          timestamp: new Date().toISOString(),
          source: this.pluginId,
          destination: options.destination || '*',
          topic: options.topic,
          messageType: options.messageType,
          priority: options.priority || 5,
          headers: {
            traceId: uuidv4(),
            spanId: uuidv4(),
            ...options.headers,
          },
          payload: options.payload,
          metadata: options.metadata || {},
        };

        this.emitMessage(message);
      },
      1000 // Short dedup window for publishes (1s)
    );
  }

  /**
   * Subscribe to a topic or topic pattern
   */
  subscribe(
    topicPattern: string,
    handler: SubscriptionHandler,
    options?: SubscriptionOptions
  ): () => void {
    // Wrap handler with filter if provided
    const wrappedHandler = options?.filter
      ? (message: Message) => {
          if (options.filter!(message)) {
            handler(message);
          }
        }
      : handler;

    // Store subscription
    if (!this.subscriptions.has(topicPattern)) {
      this.subscriptions.set(topicPattern, new Set());
    }
    this.subscriptions.get(topicPattern)!.add(wrappedHandler);

    // Register event listener
    this.emitter.on(topicPattern, wrappedHandler);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(topicPattern, wrappedHandler);
    };
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topicPattern: string, handler: SubscriptionHandler): void {
    const handlers = this.subscriptions.get(topicPattern);
    if (handlers) {
      handlers.delete(handler);
      this.emitter.off(topicPattern, handler);

      // Clean up if no more handlers
      if (handlers.size === 0) {
        this.subscriptions.delete(topicPattern);
      }
    }
  }

  // ========================================
  // REQUEST/RESPONSE PATTERN
  // ========================================

  /**
   * Send a request and wait for response
   */
  async request<T = any>(options: RequestOptions): Promise<T> {
    const correlationId = uuidv4();
    const timeout = options.timeout || 30000;

    // Create promise that will be resolved when response arrives
    const responsePromise = new Promise<T>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(
          new Error(
            `Request timeout after ${timeout}ms for topic: ${options.topic}`
          )
        );
      }, timeout);

      this.pendingRequests.set(correlationId, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });
    });

    // Publish request
    const message: Message = {
      messageId: uuidv4(),
      correlationId,
      timestamp: new Date().toISOString(),
      source: this.pluginId,
      destination: options.destination || '*',
      topic: options.topic,
      messageType: MessageType.REQUEST,
      priority: options.priority || 5,
      headers: {
        traceId: uuidv4(),
        spanId: uuidv4(),
        ...options.headers,
      },
      payload: options.payload,
      metadata: {
        timeout,
        ...options.metadata,
      },
    };

    this.emitMessage(message);

    return responsePromise;
  }

  /**
   * Respond to a request
   */
  async respond(correlationId: string, payload: any): Promise<void> {
    const message: Message = {
      messageId: uuidv4(),
      correlationId,
      timestamp: new Date().toISOString(),
      source: this.pluginId,
      destination: '*', // Broadcast response
      topic: `plugin/${this.pluginId}/response`,
      messageType: MessageType.RESPONSE,
      priority: 10, // High priority for responses
      headers: {},
      payload,
      metadata: {},
    };

    this.emitMessage(message);
  }

  // ========================================
  // INTERNAL METHODS
  // ========================================

  private setupResponseHandler(): void {
    // Listen for responses to our requests
    this.emitter.on('**', (message: Message) => {
      if (
        message.messageType === MessageType.RESPONSE &&
        message.correlationId &&
        this.pendingRequests.has(message.correlationId)
      ) {
        const pending = this.pendingRequests.get(message.correlationId)!;
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.correlationId);

        // Check if response indicates error
        if (message.payload.error) {
          pending.reject(new Error(message.payload.error));
        } else {
          pending.resolve(message.payload);
        }
      }
    });
  }

  private emitMessage(message: Message): void {
    // Emit to exact topic
    this.emitter.emit(message.topic, message);

    // Emit to wildcard listeners
    this.emitToWildcardListeners(message);

    // Emit to catch-all
    this.emitter.emit('**', message);

    // Log for debugging
    this.logMessage(message);
  }

  private emitToWildcardListeners(message: Message): void {
    const topicParts = message.topic.split('/');

    // Check each subscription pattern
    for (const [pattern, handlers] of this.subscriptions) {
      if (this.matchesPattern(message.topic, pattern)) {
        handlers.forEach((handler) => {
          try {
            handler(message);
          } catch (error) {
            console.error(
              `[MessageBus] Handler error for pattern ${pattern}:`,
              error
            );
          }
        });
      }
    }
  }

  private matchesPattern(topic: string, pattern: string): boolean {
    // Convert pattern to regex
    // Examples:
    //   plugin/* → matches plugin/anything
    //   plugin/*/request → matches plugin/anything/request
    //   ** → matches everything

    if (pattern === '**') return true;
    if (pattern === topic) return true;

    // Build regex from pattern - this is internal and controlled (not user-provided)
    // but we still apply length limits as a safety measure
    if (pattern.length > 500) {
      console.warn(`Pattern too long (${pattern.length} chars), rejecting: ${pattern}`);
      return false;
    }

    try {
      const regex = new RegExp(
        '^' +
          pattern
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]+') +
          '$'
      );

      // Topic strings should be reasonable length; reject overly long topics to avoid
      // incorrect matching due to truncation.
      if (topic.length > 1000) {
        console.warn(`Topic too long (${topic.length} chars), rejecting: ${topic}`);
        return false;
      }

      return regex.test(topic);
    } catch (error) {
      console.error(`Invalid pattern: ${pattern}`, error);
      return false;
    }
  }

  private logMessage(message: Message): void {
    const direction = message.source === this.pluginId ? '→' : '←';
    console.log(
      `[MessageBus] ${direction} [${message.messageType}] ${message.topic}`,
      {
        messageId: message.messageId,
        correlationId: message.correlationId,
        source: message.source,
        destination: message.destination,
      }
    );
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get statistics about message bus usage
   */
  getStats(): {
    subscriptions: number;
    pendingRequests: number;
    topics: string[];
    deduplication: any;
  } {
    return {
      subscriptions: Array.from(this.subscriptions.values()).reduce(
        (sum, handlers) => sum + handlers.size,
        0
      ),
      pendingRequests: this.pendingRequests.size,
      topics: Array.from(this.subscriptions.keys()),
      deduplication: this.deduplicator.getMetrics(),
    };
  }

  /**
   * Get deduplication metrics
   */
  getDeduplicationMetrics(): any {
    return this.deduplicator.getMetrics();
  }

  /**
   * Clear all subscriptions and pending requests
   */
  clear(): void {
    this.emitter.removeAllListeners();
    this.subscriptions.clear();

    // Reject all pending requests
    for (const [correlationId, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('MessageBus cleared'));
    }
    this.pendingRequests.clear();
  }
}

// ============================================
// GLOBAL MESSAGE BUS SINGLETON
// ============================================

let globalMessageBus: MessageBus | null = null;

export function getMessageBus(pluginId?: string): MessageBus {
  if (!globalMessageBus && pluginId) {
    globalMessageBus = new MessageBus(pluginId);
  }

  if (!globalMessageBus) {
    throw new Error(
      'MessageBus not initialized. Call getMessageBus(pluginId) first.'
    );
  }

  return globalMessageBus;
}

export function resetMessageBus(): void {
  if (globalMessageBus) {
    globalMessageBus.clear();
  }
  globalMessageBus = null;
}

// ============================================
// RPC CLIENT/SERVER
// ============================================

export class RPCClient {
  private messageBus: MessageBus;
  private targetPlugin: string;

  constructor(endpoint: string, messageBus?: MessageBus) {
    // Parse endpoint: plugin://plugin-name/rpc
    // Validate endpoint length to prevent ReDoS
    if (endpoint.length > 500) {
      throw new Error(`RPC endpoint too long (${endpoint.length} chars)`);
    }

    const match = endpoint.match(/^plugin:\/\/([^/]+)\/rpc$/);
    if (!match) {
      throw new Error(`Invalid RPC endpoint: ${endpoint}`);
    }

    this.targetPlugin = match[1];
    this.messageBus = messageBus || getMessageBus();
  }

  async call<T = any>(method: string, params: any): Promise<T> {
    return this.messageBus.request<T>({
      destination: this.targetPlugin,
      topic: `plugin/${this.targetPlugin}/rpc`,
      payload: {
        method,
        params,
      },
      timeout: 30000,
    });
  }
}

export class RPCServer {
  private messageBus: MessageBus;
  private pluginId: string;
  private methods: Map<string, (params: any) => Promise<any>>;

  constructor(endpoint: string, messageBus?: MessageBus) {
    // Parse endpoint: plugin://plugin-name/rpc
    // Validate endpoint length to prevent ReDoS
    if (endpoint.length > 500) {
      throw new Error(`RPC endpoint too long (${endpoint.length} chars)`);
    }

    const match = endpoint.match(/^plugin:\/\/([^/]+)\/rpc$/);
    if (!match) {
      throw new Error(`Invalid RPC endpoint: ${endpoint}`);
    }

    this.pluginId = match[1];
    this.messageBus = messageBus || getMessageBus(this.pluginId);
    this.methods = new Map();

    // Subscribe to RPC requests
    this.setupRPCHandler();
  }

  register(method: string, handler: (params: any) => Promise<any>): void {
    this.methods.set(method, handler);
  }

  unregister(method: string): void {
    this.methods.delete(method);
  }

  private setupRPCHandler(): void {
    this.messageBus.subscribe(
      `plugin/${this.pluginId}/rpc`,
      async (message: Message) => {
        if (message.messageType !== MessageType.REQUEST) return;

        const { method, params } = message.payload;

        if (!this.methods.has(method)) {
          await this.messageBus.respond(message.correlationId!, {
            error: `Unknown RPC method: ${method}`,
          });
          return;
        }

        try {
          const handler = this.methods.get(method)!;
          const result = await handler(params);

          await this.messageBus.respond(message.correlationId!, {
            result,
          });
        } catch (error: any) {
          await this.messageBus.respond(message.correlationId!, {
            error: error.message,
          });
        }
      }
    );
  }
}

// ============================================
// EXAMPLE USAGE
// ============================================

/**
 * Example 1: Publish/Subscribe
 *
 * ```typescript
 * const bus = getMessageBus('my-plugin');
 *
 * // Subscribe
 * const unsubscribe = bus.subscribe('system/broadcast', async (message) => {
 *   console.log('Received broadcast:', message.payload);
 * });
 *
 * // Publish
 * await bus.publish({
 *   topic: 'system/broadcast',
 *   messageType: MessageType.EVENT,
 *   payload: { announcement: 'Hello world!' }
 * });
 *
 * // Unsubscribe
 * unsubscribe();
 * ```
 *
 * Example 2: Request/Response
 *
 * ```typescript
 * // Sender
 * const response = await bus.request({
 *   destination: 'fastapi-backend',
 *   topic: 'plugin/fastapi-backend/request',
 *   payload: { command: 'create_endpoint', params: {...} },
 *   timeout: 30000
 * });
 *
 * // Receiver
 * bus.subscribe('plugin/fastapi-backend/request', async (message) => {
 *   const result = await handleCommand(message.payload);
 *   await bus.respond(message.correlationId!, { result });
 * });
 * ```
 *
 * Example 3: RPC
 *
 * ```typescript
 * // Server
 * const rpcServer = new RPCServer('plugin://my-plugin/rpc');
 * rpcServer.register('calculateSum', async ({ a, b }) => {
 *   return a + b;
 * });
 *
 * // Client
 * const rpcClient = new RPCClient('plugin://my-plugin/rpc');
 * const result = await rpcClient.call('calculateSum', { a: 5, b: 3 });
 * console.log(result); // 8
 * ```
 */
