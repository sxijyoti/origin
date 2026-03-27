/**
 * Search module - web search
 */
import { terminal } from './terminal.js';

const ENGINES = {
  g: ['Google', 'https://www.google.com/search?q=%s'],
  ddg: ['DuckDuckGo', 'https://duckduckgo.com/?q=%s'],
  yt: ['YouTube', 'https://www.youtube.com/results?search_query=%s'],
  gh: ['GitHub', 'https://github.com/search?q=%s'],
  so: ['Stack Overflow', 'https://stackoverflow.com/search?q=%s'],
  r: ['Reddit', 'https://www.reddit.com/search/?q=%s'],
  w: ['Wikipedia', 'https://en.wikipedia.org/wiki/Special:Search?search=%s'],
  npm: ['NPM', 'https://www.npmjs.com/search?q=%s'],
  mdn: ['MDN', 'https://developer.mozilla.org/en-US/search?q=%s'],
};

export const search = {
  init() {
    terminal.register('s', (args) => {
      if (!args.length) {
        const list = Object.entries(ENGINES).map(([k, [n]]) => `  ${k.padEnd(5)} ${n}`).join('\n');
        return { text: `Engines:\n${list}\n\nUsage: s [engine] <query>` };
      }

      let engine = 'g', query = args.join(' ');
      if (ENGINES[args[0]]) {
        engine = args[0];
        query = args.slice(1).join(' ');
      }
      if (!query) return { text: 'No query', type: 'err' };

      const url = ENGINES[engine][1].replace('%s', encodeURIComponent(query));
      chrome.tabs.create({ url });
      return { text: `Searching ${ENGINES[engine][0]}...`, type: 'ok' };
    }, 'Web search', ['search', 'google']);

    terminal.register('open', (args) => {
      if (!args.length) return { text: 'Usage: open <url>', type: 'err' };
      let url = args.join(' ');
      if (!url.match(/^https?:\/\//)) url = 'https://' + url;
      chrome.tabs.create({ url });
    }, 'Open URL', ['o', 'go']);

    terminal.register('history', async (args) => {
      const [sub] = args;
      const week = Date.now() - 7 * 86400000;

      if (sub === 'stats') {
        const r = await chrome.history.search({ text: '', startTime: week, maxResults: 5000 });
        const domains = new Set(r.map(x => { try { return new URL(x.url).hostname; } catch { return null; } }).filter(Boolean));
        return { text: `7 days: ${r.length} pages, ${domains.size} sites` };
      }

      if (sub === 'top') {
        const r = await chrome.history.search({ text: '', startTime: week, maxResults: 5000 });
        const counts = {};
        r.forEach(x => { try { const d = new URL(x.url).hostname; counts[d] = (counts[d] || 0) + 1; } catch {} });
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        return { text: top.map(([d, c], i) => `  ${i + 1}. ${d} (${c})`).join('\n') };
      }

      const recent = await chrome.history.search({ text: '', startTime: 0, maxResults: 10 });
      return { text: recent.map(r => `  ${r.title || 'Untitled'}`).join('\n') };
    }, 'Browser history', 'h');
  }
};
