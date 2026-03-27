/**
 * Storage wrapper
 */
const PREFIX = 'origin_';

export const store = {
  async get(key, fallback = null) {
    const r = await chrome.storage.local.get(PREFIX + key);
    return r[PREFIX + key] ?? fallback;
  },

  async set(key, val) {
    await chrome.storage.local.set({ [PREFIX + key]: val });
  },

  async update(key, fn, fallback = null) {
    const cur = await this.get(key, fallback);
    const next = fn(cur);
    await this.set(key, next);
    return next;
  }
};
