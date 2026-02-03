/**
 * Origin - Entry Point
 */
import { $, formatTime, formatDate } from './utils/dom.js';
import { store } from './utils/store.js';
import { terminal } from './modules/terminal.js';
import { todos } from './modules/todos.js';
import { notes } from './modules/notes.js';
import { bookmarks } from './modules/bookmarks.js';
import { tabs } from './modules/tabs.js';
import { search } from './modules/search.js';
import { stats } from './modules/stats.js';

// Clock
function updateClock() {
  const now = new Date();
  const h = now.getHours();
  
  $('#time').textContent = formatTime(now);
  $('#date').textContent = formatDate(now);
  $('#todo-date').textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  $('#greeting').textContent = 
    h < 5 ? 'night owl?' : h < 12 ? 'good morning' : h < 17 ? 'good afternoon' : h < 21 ? 'good evening' : 'good night';
}

// Stats footer display
async function updateStats() {
  const s = await stats.get();
  $('#stat-tabs').textContent = `tabs: ${s.openTabs}`;
  $('#stat-saved').textContent = `bookmarks: ${s.bookmarks}`;
  $('#stat-visited').textContent = `visited: ${s.todayVisited}`;
}

// Initialize
async function init() {
  updateClock();
  setInterval(updateClock, 1000);

  await Promise.all([
    todos.init(),
    notes.init(),
    bookmarks.init(),
    tabs.init(),
    stats.init(),
  ]);

  search.init();
  terminal.init();
  updateStats();

  // Refresh on visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateStats();
  });
}

init();
