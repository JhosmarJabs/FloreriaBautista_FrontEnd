const TTL = 5 * 60_000;

interface Entry { json: unknown; ts: number }

const store = new Map<string, Entry>();

export const apiCache = {
  get(url: string): unknown | null {
    const e = store.get(url);
    if (!e) return null;
    if (Date.now() - e.ts > TTL) { store.delete(url); return null; }
    return e.json;
  },

  set(url: string, json: unknown) {
    store.set(url, { json, ts: Date.now() });
  },

  invalidate(pattern: string) {
    for (const key of store.keys()) {
      if (key.includes(pattern)) store.delete(key);
    }
  },

  clear() { store.clear(); },
};
