/**
 * Todos module
 */
import { $, html, todayKey } from '../utils/dom.js';
import { store } from '../utils/store.js';
import { terminal } from './terminal.js';

let items = [];
let date = todayKey();

const DEFAULTS = [
  { text: 'Do [LeetCode](https://leetcode.com)', pri: 'h' },
  { text: 'Drink Water', pri: 'w' },
];

// Parse [text](url) links
const parseLinks = (text) => {
  const escaped = html(text);
  return escaped.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );
};

export const todos = {
  async init() {
    const data = await store.get('todos', { date, items: [] });
    
    if (data.date !== date) {
      if (data.items.length) {
        await store.update('todos_archive', a => [...(a || []).slice(-30), data]);
      }
      items = DEFAULTS.map(d => ({ ...d, id: Date.now().toString() + Math.random(), done: false }));
    } else {
      items = data.items.length ? data.items : DEFAULTS.map(d => ({ ...d, id: Date.now().toString() + Math.random(), done: false }));
    }

    await this.save();
    this.render();
    this.registerCommands();

    setInterval(() => {
      if (todayKey() !== date) { date = todayKey(); this.init(); }
    }, 60000);
  },

  async save() {
    await store.set('todos', { date, items });
    this.render();
  },

  render() {
    const el = $('#todos');
    if (!items.length) {
      el.innerHTML = '<div class="empty">no tasks</div>';
      return;
    }

    const sorted = [...items].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const p = { h: 0, m: 1, l: 2 };
      return p[a.pri] - p[b.pri];
    });

    el.innerHTML = sorted.map(t => `
      <div class="todo ${t.done ? 'done' : ''}">
        <input type="checkbox" ${t.done ? 'checked' : ''} data-id="${t.id}">
        <span>${parseLinks(t.text)}</span>
        ${t.pri !== 'm' ? `<span class="pri ${t.pri}">${t.pri}</span>` : ''}
      </div>
    `).join('');

    el.querySelectorAll('input').forEach(cb => {
      cb.onchange = () => this.toggle(cb.dataset.id);
    });
  },

  async toggle(id) {
    const t = items.find(x => x.id === id);
    if (t) { t.done = !t.done; await this.save(); }
  },

  registerCommands() {
    terminal.register('todo', async (args, raw) => {
      const [sub, ...rest] = args;
      const text = rest.join(' ');

      switch (sub) {
        case 'add': case 'a':
          if (!text) return { text: 'Usage: todo add <task> [!h|!l]', type: 'err' };
          let pri = 'm', t = text;
          if (text.includes('!h')) { pri = 'h'; t = text.replace('!h', '').trim(); }
          if (text.includes('!l')) { pri = 'l'; t = text.replace('!l', '').trim(); }
          items.push({ id: Date.now().toString(), text: t, pri, done: false });
          await this.save();
          return { text: `Added: ${t}`, type: 'ok' };

        case 'done': case 'd':
          const di = parseInt(rest[0]) - 1;
          if (!items[di]) return { text: 'Invalid #', type: 'err' };
          items[di].done = !items[di].done;
          await this.save();
          return { text: `Toggled: ${items[di].text}`, type: 'ok' };

        case 'rm':
          const ri = parseInt(rest[0]) - 1;
          if (!items[ri]) return { text: 'Invalid #', type: 'err' };
          const removed = items.splice(ri, 1)[0];
          await this.save();
          return { text: `Removed: ${removed.text}`, type: 'ok' };

        case 'clear':
          items = rest[0] === 'done' ? items.filter(x => !x.done) : [];
          await this.save();
          return { text: 'Cleared', type: 'ok' };

        default:
          if (!items.length) return { text: 'No todos. Add: todo add <task>' };
          return { text: items.map((t, i) => `  ${t.done ? '✓' : '○'} ${i + 1}. ${t.text}`).join('\n') };
      }
    }, 'Manage todos', 't');
  }
};
