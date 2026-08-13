import { z } from 'zod';

/**
 * Shared shapes for the tool contract AND the View boundary.
 *
 * `structuredContent` reaches the View having travelled external service →
 * server → model → host. Every hop is somewhere the content could have been
 * shaped by someone who is not your user, so the View parses it before it
 * touches the DOM. Bounds are load-bearing: an unbounded array is a
 * denial-of-service against your own render loop.
 */

export const ItemSchema = z.object({
  id: z.string().min(1).max(128),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(400).optional(),
  status: z.enum(['pending', 'ready', 'failed']).default('ready'),
  url: z.string().url().max(2048).optional(),
});

export type Item = z.infer<typeof ItemSchema>;

export const ResultSchema = z.object({
  query: z.string().max(200),
  items: z.array(ItemSchema).max(50),
});

export type Result = z.infer<typeof ResultSchema>;

/** Parse untrusted structuredContent. Returns null rather than throwing. */
export function parseResult(input: unknown): Result | null {
  const parsed = ResultSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

/**
 * Any URL that arrived in a payload is attacker-influenced. One protocol
 * allowlist kills javascript:, data:, and vbscript: together.
 */
export function safeHref(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}
