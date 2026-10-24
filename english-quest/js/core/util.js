/* Tiện ích dùng chung */
window.EQ = window.EQ || {};
(function () {
  const U = {};
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randi = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  U.shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  U.uniq = arr => Array.from(new Set(arr));
  U.today = (d) => {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  U.fmtTime = sec => {
    sec = Math.round(sec || 0);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    if (h > 0) return h + ' giờ ' + m + ' phút';
    if (m > 0) return m + ' phút';
    return sec + ' giây';
  };
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // tạo phần tử DOM: U.el('div', {class:'x', onclick: fn}, [children or text])
  U.el = (tag, attrs, children) => {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k === 'text') e.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
        else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v === true ? '' : v);
      }
    }
    if (children != null) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null || c === false) return;
        e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
      });
    }
    return e;
  };
  U.sleep = ms => new Promise(r => setTimeout(r, ms));
  U.fill = (text, p) => String(text || '')
    .replace(/\{name\}/g, (p && p.name) || 'friend')
    .replace(/\{age\}/g, (p && p._ageWord) || 'twelve');
  U.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  U.cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  U.numWord = n => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'][n] || String(n);
  EQ.U = U;
})();
