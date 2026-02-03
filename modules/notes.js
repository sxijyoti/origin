/**
 * Notes module
 */
import { $, html, formatRelative } from '../utils/dom.js';
import { store } from '../utils/store.js';
import { terminal } from './terminal.js';

let items = [];

export const notes = {
  async init() {
    items = await store.get('notes', []);
    this.render();
    this.registerCommands();
  },

  async save() {
    await store.set('notes', items);
    this.render();
  },

  render() {
    const el = $('#notes');
    if (!items.length) {
      el.innerHTML = '<div class="empty">no notes</div>';
      return;
    }

    el.innerHTML = items.slice(0, 5).map(n => `
      <div class="note" data-id="${n.id}">
        <b>${html(n.title)}</b>
        <span>${html(n.text.slice(0, 40))}</span>
      </div>
    `).join('');

    el.querySelectorAll('.note').forEach(n => {
      n.onclick = () => terminal.run(`note ${n.dataset.id}`);
    });
  },

  registerCommands() {
    terminal.register('note', async (args, raw) => {
      const [sub, ...rest] = args;
      const text = rest.join(' ');

      switch (sub) {
        case 'add': case 'a':
          if (!text) return { text: 'Usage: note add <text>', type: 'err' };
          items.unshift({
            id: Date.now().toString(),
            title: text.slice(0, 30),
            text,
            at: Date.now()
          });
          await this.save();
          return { text: 'Note saved', type: 'ok' };

        case 'rm':
          const idx = parseInt(rest[0]) - 1;
          if (!items[idx]) return { text: 'Invalid #', type: 'err' };
          items.splice(idx, 1);
          await this.save();
          return { text: 'Deleted', type: 'ok' };

        case 'list': case 'ls':
          if (!items.length) return { text: 'No notes' };
          return { text: items.map((n, i) => `  ${i + 1}. ${n.title} (${formatRelative(n.at)})`).join('\n') };

        default:
          const n = items[parseInt(sub) - 1] || items.find(x => x.id === sub);
          if (n) return { text: `${n.title}\n${'─'.repeat(30)}\n${n.text}` };
          if (!items.length) return { text: 'No notes. Add: note add <text>' };
          return { text: items.map((n, i) => `  ${i + 1}. ${n.title}`).join('\n') };
      }
    }, 'Quick notes', 'n');
  }
};
