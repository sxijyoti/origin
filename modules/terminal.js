/**
 * Terminal module
 */
import { $, html } from '../utils/dom.js';

const cmds = {};
let history = [];
let histIdx = 0;

export const terminal = {
  init() {
    const input = $('#input');
    const output = $('#output');

    chrome.storage.local.get('origin_history', (d) => {
      history = d.origin_history || [];
      histIdx = history.length;
    });

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = input.value.trim();
        input.value = '';
        if (cmd) await this.run(cmd);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (histIdx > 0) input.value = history[--histIdx] || '';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        input.value = history[++histIdx] || '';
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const v = input.value.split(/\s/)[0];
        const m = Object.keys(cmds).filter(c => c.startsWith(v));
        if (m.length === 1) input.value = m[0] + ' ';
      } else if (e.key === 'Escape') {
        input.value = '';
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        output.innerHTML = '';
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('a, button, input[type=checkbox]')) input.focus();
    });

    this.print('origin ready. type `help` for commands.', 'dim');
  },

  register(name, fn, desc, alias = []) {
    cmds[name] = { fn, desc };
    [].concat(alias).forEach(a => cmds[a] = { fn, desc, alias: name });
  },

  async run(cmd) {
    if (history[history.length - 1] !== cmd) {
      history.push(cmd);
      if (history.length > 100) history.shift();
      chrome.storage.local.set({ origin_history: history });
    }
    histIdx = history.length;

    this.print(`› ${cmd}`, 'cmd');

    const [name, ...args] = cmd.split(/\s+/);
    const entry = cmds[name.toLowerCase()];

    if (!entry) {
      if (cmd.match(/^[\w-]+\.\w+/)) {
        chrome.tabs.create({ url: 'https://' + cmd });
        return;
      }
      return this.print(`unknown: ${name}`, 'err');
    }

    try {
      const r = await entry.fn(args, args.join(' '));
      if (r) this.print(r.text, r.type);
    } catch (e) {
      this.print(e.message, 'err');
    }
  },

  print(text, type = '') {
    const el = document.createElement('div');
    el.className = `line ${type}`;
    el.innerHTML = type === 'cmd' ? `<span class="cmd">› <b>${html(text.slice(2))}</b></span>` : html(text);
    $('#output').appendChild(el);
    $('#output').scrollTop = $('#output').scrollHeight;
  },

  help() {
    const lines = Object.entries(cmds)
      .filter(([, c]) => !c.alias)
      .map(([n, c]) => `  ${n.padEnd(10)} ${c.desc}`);
    return { text: `Commands:\n${lines.join('\n')}` };
  }
};

// Built-in commands
terminal.register('help', () => terminal.help(), 'Show commands');
terminal.register('clear', () => { $('#output').innerHTML = ''; }, 'Clear terminal', ['cls', 'c']);
terminal.register('reload', () => location.reload(), 'Reload page', 'r');
terminal.register('time', () => ({ text: new Date().toLocaleString() }), 'Current time', 'date');
