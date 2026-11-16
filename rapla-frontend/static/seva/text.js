(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SevaText = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function linkify(value) {
    const text = String(value ?? '');
    const pattern = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
    let html = '', cursor = 0;
    for (const match of text.matchAll(pattern)) {
      let url = match[0].replace(/[.,;:!?]+$/, '');
      // Keep balanced parentheses in URLs, but exclude surrounding prose punctuation.
      for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
        while (url.endsWith(close) && url.split(close).length > url.split(open).length) url = url.slice(0, -1);
      }
      const href = /^www\./i.test(url) ? 'https://' + url : url;
      html += escape(text.slice(cursor, match.index));
      try {
        const parsed = new URL(href);
        if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw Error('Invalid URL');
        html += `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${escape(url)}</a>`;
      } catch { html += escape(url); }
      cursor = match.index + url.length;
    }
    return html + escape(text.slice(cursor));
  }
  return { linkify };
});
