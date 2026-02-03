/**
 * Stats module - Browser usage statistics
 */
import { store } from '../utils/store.js';
import { terminal } from './terminal.js';

let cache = null;

export const stats = {
  async init() {
    await this.refresh();
    this.registerCommands();
  },

  async refresh() {
    const [openTabs, bookmarkTree, historyItems] = await Promise.all([
      chrome.tabs.query({}),
      chrome.bookmarks.getTree(),
      chrome.history.search({ text: '', startTime: 0, maxResults: 10000 }),
    ]);

    // Count bookmarks
    let bookmarkCount = 0;
    const countBookmarks = (nodes) => {
      for (const n of nodes) {
        if (n.url) bookmarkCount++;
        if (n.children) countBookmarks(n.children);
      }
    };
    countBookmarks(bookmarkTree);

    // Get today's history
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const todayHistory = await chrome.history.search({ text: '', startTime: startOfDay, maxResults: 1000 });

    // Most visited sites (aggregate by domain)
    const domains = {};
    for (const item of historyItems) {
      try {
        const domain = new URL(item.url).hostname.replace('www.', '');
        domains[domain] = (domains[domain] || 0) + (item.visitCount || 1);
      } catch {}
    }
    const topSites = Object.entries(domains)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, visits]) => ({ domain, visits }));

    // Active tabs (audible or recently active)
    const activeTabs = openTabs.filter(t => t.audible || t.active);

    // Tabs by window
    const windows = {};
    for (const t of openTabs) {
      windows[t.windowId] = (windows[t.windowId] || 0) + 1;
    }

    cache = {
      openTabs: openTabs.length,
      activeTabs: activeTabs.length,
      windows: Object.keys(windows).length,
      tabsByWindow: Object.values(windows),
      bookmarks: bookmarkCount,
      todayVisited: todayHistory.length,
      totalHistory: historyItems.length,
      topSites,
      timestamp: Date.now(),
    };

    await store.set('stats', cache);
    return cache;
  },

  async get() {
    if (!cache) {
      cache = await store.get('stats', null);
      if (!cache || Date.now() - cache.timestamp > 60000) {
        cache = await this.refresh();
      }
    }
    return cache;
  },

  registerCommands() {
    terminal.register('stats', async (args) => {
      const s = await this.refresh();
      const sub = args[0];

      if (sub === 'top' || sub === 'sites') {
        if (!s.topSites.length) return { text: 'No history data' };
        return {
          text: 'Most visited sites:\n' +
            s.topSites.map((site, i) => `  ${i + 1}. ${site.domain} (${site.visits})`).join('\n')
        };
      }

      if (sub === 'tabs') {
        return {
          text: `Tabs: ${s.openTabs} across ${s.windows} window(s)\n` +
            `Active: ${s.activeTabs}\n` +
            `By window: [${s.tabsByWindow.join(', ')}]`
        };
      }

      return {
        text: [
          '┌─ Browser Stats ──────────────────┐',
          `│ Open tabs:      ${String(s.openTabs).padStart(6)}          │`,
          `│ Active tabs:    ${String(s.activeTabs).padStart(6)}          │`,
          `│ Windows:        ${String(s.windows).padStart(6)}          │`,
          `│ Bookmarks:      ${String(s.bookmarks).padStart(6)}          │`,
          `│ Visited today:  ${String(s.todayVisited).padStart(6)}          │`,
          `│ Total history:  ${String(s.totalHistory).padStart(6)}          │`,
          '└───────────────────────────────────┘',
          '',
          'Use: stats top, stats tabs',
        ].join('\n')
      };
    }, 'Browser usage stats', 'stat');
  }
};
