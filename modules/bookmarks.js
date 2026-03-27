/**
 * Bookmarks module
 */
import { $, html, getFavicon } from '../utils/dom.js';
import { terminal } from './terminal.js';

let flat = [];

export const bookmarks = {
  async init() {
    await this.load();
    this.render();
    this.registerCommands();

    setInterval(() => { if (!document.hidden) this.load().then(() => this.render()); }, 60000);
  },

  async load() {
    const tree = await chrome.bookmarks.getTree();
    flat = [];
    const walk = (nodes) => {
      for (const n of nodes) {
        if (n.url) flat.push({ title: n.title, url: n.url });
        if (n.children) walk(n.children);
      }
    };
    walk(tree);
  },

  async render() {
    const el = $('#bookmarks');
    const tree = await chrome.bookmarks.getTree();
    const bar = tree[0]?.children?.find(c => c.title.toLowerCase().includes('bookmark'))?.children || tree[0]?.children || [];

    if (!bar.length) {
      el.innerHTML = '<div class="empty">no bookmarks</div>';
      return;
    }

    let out = '';
    for (const item of bar.slice(0, 20)) {
      if (item.url) {
        out += `<a href="${html(item.url)}"><img src="${getFavicon(item.url)}" onerror="this.style.display='none'"><span>${html(item.title)}</span></a>`;
      } else if (item.children?.length) {
        out += `<div class="folder">▸ ${html(item.title)}</div>`;
        for (const c of item.children.slice(0, 3)) {
          if (c.url) out += `<a href="${html(c.url)}"><img src="${getFavicon(c.url)}" onerror="this.style.display='none'"><span>${html(c.title)}</span></a>`;
        }
      }
    }
    el.innerHTML = out;
  },

  search(q) {
    const lq = q.toLowerCase();
    return flat.filter(b => b.title.toLowerCase().includes(lq) || b.url.toLowerCase().includes(lq));
  },

  registerCommands() {
    terminal.register('bm', async (args) => {
      if (!args.length) {
        await this.load();
        this.render();
        return { text: `Loaded ${flat.length} bookmarks`, type: 'ok' };
      }
      const r = this.search(args.join(' ')).slice(0, 10);
      if (!r.length) return { text: 'No matches' };
      return { text: r.map((b, i) => `  ${i + 1}. ${b.title}\n     ${b.url}`).join('\n\n') };
    }, 'Search bookmarks', 'bookmarks');
  }
};
