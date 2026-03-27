/**
 * Tabs module - save/restore tab groups
 */
import { formatRelative } from '../utils/dom.js';
import { store } from '../utils/store.js';
import { terminal } from './terminal.js';

let groups = [];

export const tabs = {
  async init() {
    groups = await store.get('tabs', []);
    this.registerCommands();
  },

  async save() {
    await store.set('tabs', groups);
  },

  registerCommands() {
    terminal.register('tabs', async (args) => {
      const [sub, ...rest] = args;
      const name = rest.join(' ');

      switch (sub) {
        case 'save':
          const open = await chrome.tabs.query({ currentWindow: true });
          const filtered = open.filter(t => t.url && !t.url.startsWith('chrome') && !t.pinned);
          if (!filtered.length) return { text: 'No tabs to save', type: 'err' };
          
          groups.unshift({
            id: Date.now(),
            name: name || new Date().toLocaleDateString(),
            tabs: filtered.map(t => ({ title: t.title, url: t.url })),
            at: Date.now()
          });
          await this.save();
          return { text: `Saved ${filtered.length} tabs`, type: 'ok' };

        case 'restore':
          const ri = parseInt(rest[0]) - 1;
          if (!groups[ri]) return { text: 'Invalid #', type: 'err' };
          for (const t of groups[ri].tabs) chrome.tabs.create({ url: t.url, active: false });
          const restored = groups.splice(ri, 1)[0];
          await this.save();
          return { text: `Restored ${restored.tabs.length} tabs`, type: 'ok' };

        case 'rm':
          const di = parseInt(rest[0]) - 1;
          if (!groups[di]) return { text: 'Invalid #', type: 'err' };
          groups.splice(di, 1);
          await this.save();
          return { text: 'Deleted', type: 'ok' };

        default:
          if (!groups.length) return { text: 'No saved tabs. Use: tabs save [name]' };
          return { text: groups.map((g, i) => `  ${i + 1}. ${g.name} (${g.tabs.length}) - ${formatRelative(g.at)}`).join('\n') };
      }
    }, 'Save/restore tabs');
  }
};
