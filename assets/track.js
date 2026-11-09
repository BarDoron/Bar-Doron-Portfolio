/* Visitor analytics (Microsoft Clarity, cookies off in the Clarity settings).
   ?notrack  turns tracking off in this browser (Bar's own visits); ?track turns it back on.
   ?ref=name tags the whole visit, so a link sent to one company shows up under its own name. */
(function () {
  var q = location.search, ls = null, ss = null;
  try { ls = localStorage; ss = sessionStorage; } catch (e) {}
  try {
    if (/[?&]notrack\b/.test(q)) ls.setItem('bd-notrack', '1');
    if (/[?&]track\b/.test(q)) ls.removeItem('bd-notrack');
    if (ls && ls.getItem('bd-notrack')) return;
  } catch (e) {}
  if (location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;

  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', 'zax4c51zbc');

  var ref = (q.match(/[?&]ref=([^&#]+)/) || [])[1];
  try {
    if (ref) { ref = decodeURIComponent(ref).slice(0, 60); ss.setItem('bd-ref', ref); }
    else ref = ss.getItem('bd-ref');
  } catch (e) {}
  if (ref) window.clarity('set', 'ref', ref);

  // the clicks worth counting
  var once = {};
  var ev = function (n, single) { if (single) { if (once[n]) return; once[n] = 1; } window.clarity('event', n); };
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    var a = t.closest('a[href]'), h = a ? a.getAttribute('href') : '';
    if (/^mailto:/.test(h)) ev('email_click');
    else if (/linkedin\.com/.test(h)) ev('linkedin_click');
    else if (/\.pdf(\?|#|$)/.test(h)) ev('cv_open');
    else if (/spotify\.com|youtube\.com|youtu\.be/.test(h)) ev('media_open');
    else if (/(champion-motors|swiftness|gigaspaces|ux-library)\.html/.test(h)) ev('case_open_' + h.match(/([a-z-]+)\.html/)[1]);
    if (t.closest('.pod-btn, .pod-float')) ev('podcast_play', true);
    if (t.closest('.aic')) ev('ai_card_touch', true);
  }, true);
})();
