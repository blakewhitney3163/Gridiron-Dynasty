/**
 * Thin TTL cache around window.api IPC calls.
 *
 * Usage:
 *   import { cached, invalidate } from './lib/apiCache';
 *   const standings = await cached(`standings-${season}`, () => window.api.getStandings(season));
 *
 * Call invalidate() or invalidatePattern() after mutations (simulate week, trade, etc.)
 * so stale data isn't served.
 */

const CACHE = new Map<string, { data: unknown; at: number }>();

/** How long a cache entry is considered fresh (milliseconds) */
const TTL_MS = 8_000;

/**
 * Return a cached result if one exists and is still fresh,
 * otherwise call fetcher(), cache the result, and return it.
 */
export async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return hit.data as T;
  }
  const data = await fetcher();
  CACHE.set(key, { data, at: Date.now() });
  return data;
}

/**
 * Invalidate specific cache keys.
 * Call with no arguments to clear the entire cache.
 */
export function invalidate(...keys: string[]): void {
  if (keys.length === 0) {
    CACHE.clear();
  } else {
    keys.forEach(k => CACHE.delete(k));
  }
}

/**
 * Invalidate all keys whose name contains the given substring.
 * Useful for season-scoped keys: invalidatePattern('standings') clears
 * 'standings-2025', 'standings-2026', etc.
 */
export function invalidatePattern(pattern: string): void {
  for (const key of CACHE.keys()) {
    if (key.includes(pattern)) CACHE.delete(key);
  }
}
