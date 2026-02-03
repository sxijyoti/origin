/**
 * DOM utilities
 */
export const $ = (s) => document.querySelector(s);
export const $$ = (s) => document.querySelectorAll(s);

export const html = (str) => {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
};

export const formatTime = (d = new Date()) =>
  d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const formatDate = (d = new Date()) =>
  d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export const formatRelative = (ts) => {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(d / 3600000);
  if (h < 24) return `${h}h`;
  const days = Math.floor(d / 86400000);
  return days < 7 ? `${days}d` : new Date(ts).toLocaleDateString();
};

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const getFavicon = (url) => {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;
  } catch { return ''; }
};
