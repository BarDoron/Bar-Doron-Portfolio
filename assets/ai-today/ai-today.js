// If I built it today: switching AI card for each case page. Built from the approved sketch.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // one cancellable sequence per owner: starting a new run cancels the old one
  const seq = () => { let t = 0; return {
    start() { const my = ++t; return (ms) => new Promise((ok, no) => setTimeout(() => (my === t ? ok() : no('stop')), reduce ? 0 : ms)); },
    stop() { t++; },
  }; };
  const typeText = async (el, text, wait, ms) => { el.textContent = ''; for (const ch of text) { el.textContent += ch; await wait(ms); } };
  const typeWords = async (el, text, wait, ms) => { el.textContent = ''; const w = text.split(' '); for (let i = 0; i < w.length; i++) { el.textContent += (i ? ' ' : '') + w[i]; await wait(ms); } };
  const press = async (el, wait) => { el.classList.add('press'); await wait(180); el.classList.remove('press'); };
  const scoped = (id) => { const R = document.getElementById(id); return [R, (s) => R.querySelector(s), (s) => [...R.querySelectorAll(s)]]; };

  // small line chart, drawn at the width it is shown at
  const chart = (host, o) => {
    const W = Math.max(280, Math.round(host.clientWidth || 520)), H = o.h || 170, L = 40, Rr = 10, T = 16, B = 22;
    const sx = (x) => L + (x - o.x0) / (o.x1 - o.x0) * (W - L - Rr), sy = (y) => T + (1 - (y - o.y0) / (o.y1 - o.y0)) * (H - T - B);
    const P = (pts) => pts.map(([x, y], i) => (i ? 'L' : 'M') + sx(x).toFixed(1) + ' ' + sy(y).toFixed(1)).join(' ');
    let g = '<g class="grid">' + o.yt.map(([v, l]) => `<line x1="${L}" x2="${W - Rr}" y1="${sy(v)}" y2="${sy(v)}"/><text x="${L - 6}" y="${sy(v) + 3}" text-anchor="end">${l}</text>`).join('')
      + o.xt.map(([v, l]) => `<text x="${sx(v)}" y="${H - 6}" text-anchor="middle">${l}</text>`).join('') + '</g>';
    if (o.band) g += `<rect class="band mk" x="${sx(o.band[0])}" y="${T}" width="${sx(o.band[1]) - sx(o.band[0])}" height="${H - T - B}"/>`;
    if (o.extra) g += o.extra(sx, sy, P, { W, H, L, Rr, T, B });
    g += `<path class="ln" d="${P(o.pts)}" pathLength="1"/>`;
    (o.marks || []).forEach(([x, l], i) => { const X = sx(x), end = X > W * 0.62; g += `<g class="mk"><line x1="${X}" x2="${X}" y1="${T}" y2="${H - B}"/><text x="${end ? X - 5 : X + 5}" y="${T + 10 + i * 13}" text-anchor="${end ? 'end' : 'start'}">${l}</text></g>`; });
    host.innerHTML = `<svg class="gg-chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${o.label}">${g}</svg>`;
  };
  const hhmm = (min) => String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');

  // ══ CHAMPION ══════════════════════════════

  // 02 · the card writes itself
  const CH = () => (() => {
    const s = seq(), [, q, qq] = scoped('ch');
    const T = {
      en: { fault: 'Engine warning light on, steady (not flashing)', cause: 'Misfire on one cylinder, likely an ignition coil', prio: 'Today', est: '1.5 h', parts: 'Ignition coil ×1 · in stock' },
      he: { fault: 'נורת מנוע דולקת באופן קבוע (לא מהבהבת)', cause: 'תקלת הצתה בצילינדר אחד, כנראה סליל הצתה', prio: 'היום', est: '1.5 שעות', parts: 'סליל הצתה ×1 · במלאי' },
      ar: { fault: 'ضوء المحرك مضاء بشكل ثابت (غير وامض)', cause: 'خلل في الاشتعال في أسطوانة واحدة، على الأرجح ملف الإشعال', prio: 'اليوم', est: '1.5 ساعة', parts: 'ملف إشعال ×1 · متوفر' },
      ru: { fault: 'Горит индикатор двигателя, постоянно (не мигает)', cause: 'Пропуск зажигания в одном цилиндре, вероятно катушка', prio: 'Сегодня', est: '1,5 ч', parts: 'Катушка ×1 · на складе' },
    };
    let lang = 'he', editing = false;
    const dd = (f) => q(`[data-f="${f}"]`);
    const fill = (l) => { const t = T[l]; ['fault', 'cause', 'est', 'parts'].forEach(f => { const d = dd(f); d.textContent = t[f]; d.classList.remove('empty'); d.classList.add('ai'); }); dd('prio').innerHTML = `<span class="prio">${t.prio}</span>`; dd('prio').classList.remove('empty'); };
    const setLang = (l) => { lang = l; qq('#chLang button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.l === l))); if (!dd('fault').classList.contains('empty')) fill(l); };
    const blank = () => { qq('.ch-fields dd').forEach(d => { d.textContent = ''; d.classList.add('empty'); d.classList.remove('ai'); d.removeAttribute('contenteditable'); }); q('#chBox').classList.remove('on'); q('#chSent').hidden = true; q('#chOk').disabled = false; editing = false; q('#chEdit').textContent = 'עריכה'; };
    const capture = async (wait) => {
      blank(); setLang(lang);
      await press(q('#chShutter'), wait);
      const fl = q('#chFlash'); fl.classList.remove('on'); void fl.offsetWidth; fl.classList.add('on');
      await wait(260);
      const sc = q('#chScan'); sc.classList.remove('on'); void sc.offsetWidth; sc.classList.add('on');
      await wait(1150); sc.classList.remove('on'); q('#chBox').classList.add('on'); await wait(500);
      const t = T[lang];
      for (const f of ['fault', 'cause', 'est', 'parts']) { const d = dd(f); d.classList.remove('empty'); d.classList.add('ai'); await typeWords(d, t[f], wait, 55); await wait(120); if (f === 'cause') { dd('prio').classList.remove('empty'); dd('prio').innerHTML = `<span class="prio fade-in">${t.prio}</span>`; await wait(200); } }
    };
    return {
      s,
      rest() { blank(); setLang('he'); q('#chBox').classList.add('on'); fill('he'); },
      async play(wait) {
        lang = 'he'; await wait(500); await capture(wait); await wait(900);
        for (const l of ['en', 'ru', 'ar', 'he']) { setLang(l); await wait(1100); }
        await press(q('#chOk'), wait); q('#chSent').hidden = false; q('#chOk').disabled = true; await wait(2200);
      },
      bind(take) {
        q('#chShutter').addEventListener('click', () => { take(); const w = s.start(); capture(w).catch(() => {}); });
        q('#chLang').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setLang(b.dataset.l); });
        q('#chOk').addEventListener('click', () => { if (dd('fault').classList.contains('empty')) return; q('#chSent').hidden = false; q('#chOk').disabled = true; editing = false; q('#chEdit').textContent = 'עריכה'; qq('.ch-fields dd').forEach(d => d.removeAttribute('contenteditable')); });
        q('#chEdit').addEventListener('click', () => { editing = !editing; q('#chEdit').textContent = editing ? 'סיום' : 'עריכה'; ['fault', 'cause', 'est', 'parts'].forEach(f => { const d = dd(f); if (editing) d.setAttribute('contenteditable', 'true'); else d.removeAttribute('contenteditable'); }); q('#chSent').hidden = true; q('#chOk').disabled = false; });
      },
    };
  })();

  // 03 · priority that learns
  const CHP = () => (() => {
    const s = seq(), [, q, qq] = scoped('chp'), list = q('#chpList'), learn = q('#chpLearn');
    const J = {
      kia: { plate: '418-22-305', car: 'קיה ספורטאז׳', job: 'טיפול 60 אלף', due: 'היום 17:00', lt: false, base: 82 },
      cor: { plate: '731-90-112', car: 'טויוטה קורולה', job: 'החלפת מצמד', due: 'מחר 12:00', lt: false, base: 76 },
      golf: { plate: '542-33-894', car: 'גולף', job: 'נורת מנוע', due: 'היום 16:00', lt: true, base: 61 },
      sk: { plate: '266-41-077', car: 'סקודה אוקטביה', job: 'בלמים', due: 'היום 14:00', lt: true, base: 58 },
    };
    let ruled = false, order = [], manual = new Set(), rose = new Set();
    const score = (id) => J[id].base + (ruled && J[id].lt ? 25 : 0);
    const auto = () => Object.keys(J).sort((a, b) => score(b) - score(a));
    const row = (id) => { const j = J[id]; return `<li class="chp-row" data-id="${id}"><span class="chp-n"></span><span class="plate">${j.plate}</span><span class="chp-info"><b>${j.car}<em class="chp-badge"></em></b><small>${j.job} · ${j.due}</small></span>${j.lt ? '<span class="chp-tag">ליסינג</span>' : '<span></span>'}<span class="chp-score"></span><button type="button" class="chp-up" aria-label="להקדים את ${j.car}">↑</button></li>`; };
    const render = (ord, animate) => {
      const first = new Map(qq('.chp-row').map(r => [r.dataset.id, r.getBoundingClientRect().top]));
      if (!list.children.length) list.innerHTML = ord.map(row).join('');
      else ord.forEach(id => list.appendChild(list.querySelector(`[data-id="${id}"]`)));
      order = ord.slice();
      qq('.chp-row').forEach((r, i) => {
        const id = r.dataset.id, b = r.querySelector('.chp-badge');
        r.querySelector('.chp-n').textContent = i + 1; r.querySelector('.chp-score').textContent = score(id);
        b.className = 'chp-badge'; b.textContent = '';
        if (manual.has(id)) { b.classList.add('m'); b.textContent = 'ידני'; } else if (rose.has(id)) { b.classList.add('r'); b.textContent = 'לפי הכלל'; }
        if (animate && !reduce) { const f = first.get(id), dy = f == null ? 0 : f - r.getBoundingClientRect().top; if (dy) r.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)' }); }
      });
    };
    const reset = () => { ruled = false; manual = new Set(); rose = new Set(); list.innerHTML = ''; render(auto(), false); learn.classList.remove('open'); q('#chpDone').hidden = true; q('#chpHint').hidden = false; };
    const moveTo = (id, to) => { const o = order.filter(x => x !== id); o.splice(to, 0, id); manual.add(id); render(o, true); };
    const apply = () => {
      const before = order.slice(); ruled = true; manual = new Set();
      const after = auto(); rose = new Set(after.filter((id, i) => i < before.indexOf(id)));
      render(after, true); learn.classList.remove('open'); q('#chpDone').hidden = false; q('#chpHint').hidden = true;
    };
    return {
      s,
      rest: reset,
      async play(wait) {
        reset(); await wait(700);
        const r = q('[data-id="sk"]'); r.classList.add('lift'); await wait(500);
        moveTo('sk', 0); await wait(650); r.classList.remove('lift'); await wait(600);
        learn.classList.add('open'); q('#chpHint').hidden = true; await wait(3400);
        await press(q('#chpYes'), wait); apply(); await wait(3400);
      },
      bind(take) {
        list.addEventListener('click', (e) => {
          const b = e.target.closest('.chp-up'); if (!b) return; take();
          const id = b.closest('.chp-row').dataset.id, i = order.indexOf(id); if (i <= 0) return;
          moveTo(id, i - 1);
          if (!ruled && J[id].lt) { learn.classList.add('open'); q('#chpHint').hidden = true; }
        });
        q('#chpYes').addEventListener('click', () => { take(); if (!ruled) apply(); });
        q('#chpNo').addEventListener('click', () => { take(); learn.classList.remove('open'); q('#chpHint').hidden = false; q('#chpHint').textContent = 'בסדר. הלוח ימשיך ללמוד ויציע שוב בהמשך.'; });
      },
    };
  })();

  // ══ SWIFTNESS ═════════════════════════════

  // 01 · ask it like a person
  const SW = () => (() => {
    const s = seq(), [, q, qq] = scoped('sw'), thread = q('#swThread'), input = q('#swInput'), typed = q('#swTyped'), ph = q('#swPh');
    const Q = { age: 'כמה יהיה לי בגיל 67?', drop: 'למה היתרה ירדה במרץ?', more: 'ומה אם אפקיד 500 ₪ יותר?' };
    const mil = (x) => x.toFixed(x < 10 ? 1 : 0) + ' מיליון ₪';
    const A = {
      age: () => `
        <div class="sw-num"><b data-count="2.88">${mil(2.88)}</b><span>בגיל 67, אם שום דבר לא ישתנה</span></div>
        <p data-say>אם תמשיכו להפקיד 2,150 ₪ בחודש והתשואה תישאר קרובה לממוצע של 10 השנים האחרונות, 4.1%, יהיו לכם כ־2.9 מיליון ₪ בפרישה.</p>
        <div class="sw-how" id="swHow"><button type="button" id="swHowBtn">איך חישבנו</button>
          <div class="sw-rows"><div>
            <div class="sw-row"><span>היתרה של היום, אחרי 30 שנות צמיחה</span><span>1.38 מיליון ₪</span></div>
            <div class="sw-row"><span>360 הפקדות של 2,150 ₪ (774 אלף ₪), עם צמיחה</span><span>1.50 מיליון ₪</span></div>
            <div class="sw-row"><span>תשואה משוערת · ממוצע 10 שנים</span><span>4.1% בשנה</span></div>
          </div></div></div>
        <div class="sw-src"><span>מתוך הדוח של ספטמבר 2026 · הערכה, לא ייעוץ השקעות</span><a href="#swiftness">לפירוט בחסכונות ←</a></div>`,
      drop: () => `
        <div class="sw-num"><b>‎−6,200 ₪</b><span>במרץ, מתוך 412,300 ₪</span></div>
        <p data-say>כמעט כל הירידה היא תנודת שוק: מסלול המניות שלכם ירד יחד איתו. לא יצא כסף מהחשבון, וההפקדה של אפריל נכנסה בזמן.</p>
        <div class="sw-bars">
          <div class="sw-bar-row"><span>שוק</span><i style="transform:scaleX(.95)"></i><span>‎−5,900 ₪</span></div>
          <div class="sw-bar-row"><span>דמי ניהול</span><i class="fee" style="transform:scaleX(.05)"></i><span>‎−300 ₪</span></div>
        </div>
        <div class="sw-src"><span>מתוך הדוח החודשי של מרץ 2026</span><a href="#swiftness">לפירוט מרץ ←</a></div>`,
      more: () => `
        <div class="sw-num"><b>‎+341 אלף ₪</b><span>בגיל 67, כ־3.2 מיליון ₪ בסך הכול</span></div>
        <p data-say>500 ₪ נוספים בחודש במשך 30 שנה הם 180 אלף ₪ מהכיס שלכם. עם תשואה של 4.1% בשנה הם צומחים לכ־341 אלף ₪.</p>
        <div class="sw-bars">
          <div class="sw-bar-row"><span>מהכיס שלכם</span><i style="transform:scaleX(.53)"></i><span>180 אלף ₪</span></div>
          <div class="sw-bar-row"><span>צמיחה</span><i style="transform:scaleX(.47)"></i><span>161 אלף ₪</span></div>
        </div>
        <div class="sw-src"><span>הערכה לפי ממוצע 10 שנים · לא ייעוץ השקעות</span><a href="#swiftness">ומה עם ההטבה במס? ←</a></div>`,
    };
    thread.addEventListener('click', (e) => { if (e.target.closest('#swHowBtn')) q('#swHow').classList.toggle('open'); });
    const show = async (key, wait, animate) => {
      qq('#swChips button').forEach(b => b.classList.toggle('on', b.dataset.q === key));
      thread.innerHTML = `<div class="sw-q fade-in">${Q[key]}</div>`;
      if (animate) { thread.insertAdjacentHTML('beforeend', '<div class="sw-dots"><i></i><i></i><i></i></div>'); await wait(800); q('.sw-dots').remove(); }
      thread.insertAdjacentHTML('beforeend', `<div class="sw-a${animate ? ' fade-in' : ''}">${A[key]()}</div>`);
      if (!animate) return;
      const say = q('[data-say]'); if (say) { const t = say.textContent; await typeWords(say, t, wait, 38); }
      const num = q('[data-count]');
      if (num) { const end = +num.dataset.count; for (let i = 1; i <= 16; i++) { num.textContent = mil(end * i / 16); await wait(28); } }
    };
    const ask = async (key, wait) => {
      input.classList.add('focus'); ph.hidden = true; await typeText(typed, Q[key], wait, 32); await wait(350);
      typed.textContent = ''; ph.hidden = false; input.classList.remove('focus');
      await show(key, wait, true);
    };
    return {
      s,
      rest() { show('age', null, false); q('#swHow').classList.add('open'); typed.textContent = ''; ph.hidden = false; input.classList.remove('focus'); },
      async play(wait) {
        await ask('age', wait); await wait(800); q('#swHow').classList.add('open'); await wait(2800);
        await ask('drop', wait); await wait(3000);
        await ask('more', wait); await wait(3000);
      },
      bind(take) { q('#swChips').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; take(); const w = s.start(); ask(b.dataset.q, w).catch(() => {}); }); },
    };
  })();

  // 04 · letters, translated
  const SWL = () => (() => {
    const s = seq(), [, q, qq] = scoped('swl'), letter = q('#swlLetter'), cards = qq('.swl-card'), srcs = qq('.swl-paper [data-src]');
    const hl = (n) => { srcs.forEach(p => p.classList.toggle('hl', p.dataset.src === n)); cards.forEach(c => c.classList.toggle('on', c.dataset.src === n)); };
    const upload = async (wait) => {
      cards.forEach(c => c.classList.remove('in')); hl(null); letter.classList.remove('in');
      await wait(400); letter.classList.add('in'); await wait(700);
      const sc = q('#swlScan'); sc.classList.remove('on'); void sc.offsetWidth; sc.classList.add('on'); await wait(1300); sc.classList.remove('on');
      for (const c of cards) { c.classList.add('in'); hl(c.dataset.src); await wait(1900); }
    };
    return {
      s,
      rest() { letter.classList.add('in'); cards.forEach(c => c.classList.add('in')); hl('1'); },
      async play(wait) { await upload(wait); await wait(1400); },
      bind(take) {
        cards.forEach(c => c.addEventListener('click', () => { take(); if (c.classList.contains('in')) hl(c.dataset.src); }));
        q('#swlUp').addEventListener('click', () => { take(); const w = s.start(); upload(w).catch(() => {}); });
      },
    };
  })();

  // ══ GIGASPACES ════════════════════════════

  // 01 · alerts that triage themselves
  const GG = () => (() => {
    const s = seq(), [, q, qq] = scoped('gg'), list = q('#ggList'), inc = q('#ggInc'), otherL = q('#ggOtherL');
    const ALERTS = [
      ['02:11:04', 'crit', '<b>xap-03</b> · GC pause 1.8 s (old gen)', 1],
      ['02:11:09', 'warn', '<b>xap-03</b> · Heap 94% after GC', 1],
      ['02:11:15', 'crit', '<b>orders-space</b> · Partition 7 primary unreachable', 1],
      ['02:11:15', 'warn', '<b>orders-space</b> · Backup promoted to primary (p7)', 1],
      ['02:11:22', 'warn', '<b>orders-ingest</b> · Consumer lag 12,400', 1],
      ['02:11:31', 'warn', '<b>orders-ingest</b> · Consumer lag 28,900', 1],
      ['02:11:38', 'warn', '<b>reports-space</b> · Query timeout ×3', 0],
      ['02:11:40', 'crit', '<b>orders-ingest</b> · Consumer lag 42,100', 1],
      ['02:11:41', 'warn', '<b>api-gateway</b> · p99 latency 860 ms', 1],
      ['02:11:47', 'warn', '<b>api-gateway</b> · p99 latency 1,120 ms', 1],
      ['02:11:52', 'info', '<b>orders-space</b> · Rebalance started', 1],
      ['02:12:03', 'warn', '<b>xap-03</b> · GC pause 1.4 s', 1],
      ['02:12:18', 'info', '<b>orders-space</b> · Rebalance 60%', 1],
      ['02:12:30', 'crit', '<b>orders-ingest</b> · Consumer lag 51,700', 1],
    ];
    const row = (a, cls = '') => `<li class="gg-row ${cls}" data-rel="${a[3]}"><time>${a[0]}</time><i class="${a[1]}"></i><span>${a[2]}</span></li>`;
    const tab = (v) => qq('#ggSwitch button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.v === v)));
    const raw = () => { tab('raw'); inc.classList.remove('open'); otherL.hidden = true; list.innerHTML = ALERTS.slice().reverse().map(a => row(a)).join(''); };
    const triagedNow = () => { tab('tri'); list.innerHTML = ALERTS.filter(a => !a[3]).map(a => row(a, 'kept')).join(''); otherL.hidden = false; inc.classList.add('open'); };
    const collapse = async (wait) => {
      tab('tri');
      const rel = qq('.gg-row[data-rel="1"]');
      rel.forEach(r => r.classList.add('hl')); await wait(450);
      for (const r of rel) { r.classList.add('merge'); await wait(55); }
      qq('.gg-row[data-rel="0"]').forEach(r => r.classList.add('kept'));
      await wait(250); inc.classList.add('open'); await wait(300); otherL.hidden = false;
    };
    return {
      s,
      rest: triagedNow,
      async play(wait) {
        tab('raw'); inc.classList.remove('open'); otherL.hidden = true; list.innerHTML = '';
        await wait(400);
        for (const a of ALERTS) { list.insertAdjacentHTML('afterbegin', row(a, 'enter')); await wait(170); }
        await wait(1100); await collapse(wait); await wait(4000);
      },
      bind(take) {
        q('#ggSwitch').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; take(); if (b.dataset.v === 'raw') raw(); else { if (list.children.length < 3) raw(); const w = s.start(); collapse(w).catch(() => {}); } });
        q('#ggSplit').addEventListener('click', () => { take(); raw(); });
      },
    };
  })();

  // 03 · anomaly before alarm
  const GGN = () => (() => {
    const s = seq(), [, q] = scoped('ggn'), host = q('#ggnSvg'), call = q('#ggnCall'), dot = q('#ggnDot'), ls = q('#ggnLs'), why = q('#ggnWhyT');
    const pts = []; for (let t = 8; t <= 15.001; t += 0.25) pts.push([t, t < 13 ? 61 + 1.3 * Math.sin(t * 3.1) + 0.8 * Math.sin(t * 7.3) : 61 + (t - 13) * 5 + 0.6 * Math.sin(t * 5.7)]);
    const draw = () => chart(host, {
      label: 'xap-05 heap used, percent, 08:00 to 20:00, with forecast', h: (matchMedia('(min-width: 881px)').matches) ? 110 : 180, x0: 8, x1: 20, y0: 40, y1: 100, pts,
      yt: [[40, '40%'], [70, '70%'], [100, '100%']], xt: [8, 11, 14, 17, 20].map(h => [h, String(h).padStart(2, '0') + ':00']),
      extra: (sx, sy, P, d) => `<g class="thr"><line x1="${d.L}" x2="${d.W - d.Rr}" y1="${sy(85)}" y2="${sy(85)}"/><text x="${d.L + 4}" y="${sy(85) - 5}">Alert threshold 85%</text></g>`
        + `<g class="now"><line x1="${sx(15)}" x2="${sx(15)}" y1="${d.T}" y2="${d.H - d.B}"/></g>`
        + `<g class="mk"><path class="cone" d="M${sx(15)} ${sy(71)} L${sx(20)} ${sy(86)} L${sx(20)} ${sy(96)} Z"/><path class="fc" d="${P([[15, 71], [20, 91]])}"/></g>`
        + `<g class="mk xp"><circle cx="${sx(18.5)}" cy="${sy(85)}" r="4.5"/><text x="${sx(18.5)}" y="${sy(85) + 18}" text-anchor="middle">~18:30</text></g>`,
    });
    const light = (watch) => { dot.classList.toggle('watch', watch); ls.textContent = watch ? 'Watch · forecast' : 'Healthy'; };
    const callBack = () => { why.hidden = true; q('#ggnCallIn').firstElementChild.innerHTML = '<b>Drifting, not alarming yet.</b> Heap on xap-05 has grown about 4% an hour since the 13:00 deploy. At this rate it crosses the 85% threshold around 18:30, somewhere between 17:50 and 19:40.'; };
    return {
      s,
      rest() { draw(); host.classList.add('shown'); light(true); callBack(); call.classList.add('open'); },
      async play(wait) {
        light(false); call.classList.remove('open'); callBack(); draw(); await wait(500);
        host.classList.add('draw'); await wait(1500); host.classList.add('shown'); await wait(800);
        light(true); await wait(500); call.classList.add('open'); await wait(3000);
        await press(q('#ggnWhy'), wait); why.hidden = false; await wait(3200);
      },
      bind(take) {
        q('#ggnWhy').addEventListener('click', () => { take(); why.hidden = !why.hidden; });
        q('#ggnMute').addEventListener('click', () => { take(); light(false); why.hidden = true; q('#ggnCallIn').firstElementChild.innerHTML = '<b>Marked as expected.</b> The baseline for xap-05 now includes the new cache setting. The threshold alert still stands.'; });
      },
    };
  })();

  // ══ UX LIBRARY ════════════════════════════

  // 02 · wireframe from a brief: built only from the kit, every state, both directions
  const UXW = () => (() => {
    const s = seq(), [, q, qq] = scoped('uxw'), cv = q('#uxwCanvas'), input = q('#uxwIn'), typed = q('#uxwTyped'), ph = q('#uxwPh');
    const BRIEF = 'Orders screen for a dispatcher: search, status filter, table. Hebrew.';
    const parts = () => qq('.wf').filter(p => !p.closest('.uxw-empty, .uxw-err'));   // the default screen, built piece by piece
    // the empty and error screens are made of library parts too: name them while they show
    const stateParts = (v) => { const sel = v === 'empty' ? '.uxw-empty' : v === 'err' ? '.uxw-err' : ''; return sel ? qq(`${sel}.wf, ${sel} .wf`) : []; };
    const state = (v) => { cv.dataset.s = v; qq('#uxwStates button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.s === v))); };
    const dir = (d) => {
      cv.dir = d; cv.lang = d === 'rtl' ? 'he' : 'en';
      qq('#uxwDir button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.d === d)));
      qq('[data-he]', cv).forEach(el => { el.textContent = el.dataset[d === 'rtl' ? 'he' : 'en']; });
    };
    const flipTo = async (d, wait) => { cv.style.opacity = '0'; await wait(220); dir(d); cv.style.opacity = '1'; };
    const clean = () => { cv.classList.remove('building'); qq('.wf').forEach(p => p.classList.remove('in', 'lbl')); cv.style.opacity = ''; typed.textContent = BRIEF; ph.hidden = true; input.classList.remove('focus'); };
    const build = async (wait) => {
      state('def'); dir('rtl'); cv.classList.add('building'); parts().forEach(p => p.classList.remove('in', 'lbl'));
      await press(q('#uxwGo'), wait); await wait(200);
      for (const p of parts()) { p.classList.add('in', 'lbl'); await wait(520); p.classList.remove('lbl'); }
      cv.classList.remove('building');
    };
    return {
      s,
      rest() { clean(); state('def'); dir('rtl'); typed.textContent = BRIEF; ph.hidden = true; input.classList.remove('focus'); },
      async play(wait) {
        clean(); state('def'); dir('rtl'); cv.classList.add('building'); typed.textContent = ''; ph.hidden = false; await wait(400);
        input.classList.add('focus'); ph.hidden = true; await typeText(typed, BRIEF, wait, 28); await wait(300); input.classList.remove('focus');
        await build(wait); await wait(900);
        for (const v of ['empty', 'err', 'def']) { await press(q(`#uxwStates [data-s="${v}"]`), wait); state(v); const sp = stateParts(v); sp.forEach(p => p.classList.add('lbl')); await wait(v === 'def' ? 1500 : 2200); sp.forEach(p => p.classList.remove('lbl')); }
        await press(q('#uxwDir [data-d="ltr"]'), wait); await flipTo('ltr', wait); await wait(2000);
        await flipTo('rtl', wait); await wait(800);
      },
      bind(take) {
        q('#uxwStates').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; take(); clean(); state(b.dataset.s); });
        q('#uxwDir').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; take(); clean(); dir(b.dataset.d); });
        q('#uxwGo').addEventListener('click', () => { take(); typed.textContent = BRIEF; ph.hidden = true; const w = s.start(); build(w).catch(() => {}); });
      },
    };
  })();

  // ══ the switching card ════════════════════
  // In view it plays each idea's demo, then moves to the next. Picking an idea or tapping inside the print hands over.
  const card = (id, scenes, durs) => {
    const root = document.getElementById(id), tabs = $$('.idea', root), panels = $$('.idea-panel', root), els = $$('.scene', root);
    const stage = $('.stage', root), state = $('[data-state]', root), print = $('.print', root);
    const s = seq(); let idx = 0, auto = !reduce, once = false, played = false;
    const phone = matchMedia('(max-width: 880px)');
    // phones: the ideas stack, each with its own line and its own print (the scenes move into it)
    const scEl = $('.scenes', root);
    const stack = document.createElement('div'); stack.className = 'stack';
    const stkEl = $('.sticker', root), stk = stkEl ? stkEl.outerHTML : '';   // the same "concept" sticker, on each print
    stack.innerHTML = tabs.map((t, i) => '<div class="st-item"><div class="st-copy"><p class="st-t">' + $('.idea-t', t).innerHTML + '</p><p class="st-d">' + $('p', panels[i]).textContent + '</p></div><div class="st-print">' + stk + '</div></div>').join('');
    stage.insertBefore(stack, print);
    const slots = $$('.st-print', stack);
    const place = () => { const p = phone.matches; els.forEach((e, k) => { const home = p ? slots[k] : scEl; if (e.parentElement !== home) home.appendChild(e); if (p) e.inert = false; }); };
    place();
    // full-bleed prints, whatever the section's side padding is
    const geo = () => { const vw = document.documentElement.clientWidth, cw = stage.clientWidth; root.style.setProperty('--vw', vw + 'px'); root.style.setProperty('--bl', Math.max(0, (vw - cw) / 2) + 'px'); };
    geo(); addEventListener('resize', geo);
    // phones: each print plays on its own; touching one takes it over
    const ps = scenes.map(() => seq()), busy = scenes.map(() => false), mine = scenes.map(() => false), armed = scenes.map(() => true);
    const stopOne = (k) => { ps[k].stop(); scenes[k].s.stop(); busy[k] = false; };
    const playOne = (k) => { if (busy[k] || mine[k] || reduce) return; stopOne(k); scenes[k].rest(); busy[k] = true; const w = ps[k].start(); scenes[k].play(w).then(() => { busy[k] = false; settle(k); }, () => {}); };
    // while a print plays it keeps its tallest height (the page never jumps); once it is done it eases back to what it needs
    const mh = scenes.map(() => 0);
    const settle = (k) => {
      const sl = slots[k]; if (!phone.matches || !mh[k]) return;
      const from = sl.offsetHeight; sl.style.minHeight = ''; const to = sl.offsetHeight;
      if (from - to < 2) { sl.style.minHeight = from + 'px'; return; }
      mh[k] = to; sl.style.minHeight = to + 'px';
      if (!reduce && sl.animate) sl.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 500, easing: 'cubic-bezier(.2, .8, .2, 1)' });
    };
    const takeOne = (k) => { stopOne(k); mine[k] = true; };
    const stopAll = () => { s.stop(); scenes.forEach(x => x.s.stop()); };
    const prog = (i, ms) => tabs.forEach((t, k) => {
      const b = $('.prog i', t); b.style.transition = 'none'; b.style.transform = (k === i && ms === 'full') ? 'scaleX(1)' : 'scaleX(0)';
      if (k === i && typeof ms === 'number' && ms > 0) { void b.offsetWidth; b.style.transition = `transform ${ms}ms linear`; b.style.transform = 'scaleX(1)'; }
    });
    const show = (i) => {
      idx = i;
      tabs.forEach((t, k) => { t.setAttribute('aria-expanded', String(k === i)); t.parentElement.classList.toggle('on', k === i); });
      panels.forEach((p, k) => p.classList.toggle('open', k === i));
      els.forEach((e, k) => { e.classList.toggle('on', k === i); e.inert = k !== i; });
      if (phone.matches) els.forEach(e => { e.inert = false; });
    };
    const one = scenes.length === 1;
    const label = () => { stage.classList.toggle('is-manual', !auto); state.textContent = reduce ? (one ? 'Reduced motion · try the controls' : 'Reduced motion · pick an idea') : !auto ? 'Your turn · try the controls' : played ? (one ? 'Your turn · try the controls' : 'Pick the other idea to see it') : (phone.matches || one) ? 'Playing · tap to take over' : 'Playing both · tap to take over'; };
    const run = async () => {
      stopAll(); const wait = s.start();
      played = false; label();
      try { for (;;) { show(idx); prog(idx, durs[idx]); await Promise.all([scenes[idx].play(wait), wait(durs[idx])]); await wait(500); if (phone.matches || one) { played = true; label(); return; } idx = (idx + 1) % scenes.length; } } catch (e) {}
    };
    const take = () => { stopAll(); once = false; if (auto) { auto = false; label(); } prog(idx, 'full'); };
    const pick = (i) => {
      take(); show(i); prog(i, 'full'); scenes[i].rest();
      if (reduce) return;
      once = true; const w = s.start(); scenes[i].play(w).then(() => { once = false; }, () => {});
    };
    scenes.forEach((x, k) => { x.rest(); x.bind(() => (phone.matches ? takeOne(k) : take())); });
    show(0); label();
    // phones: the print keeps the tallest height it has needed, so the page under it never jumps
    if (window.ResizeObserver) slots.forEach((sl, k) => { new ResizeObserver(() => { if (!phone.matches) { if (mh[k]) { sl.style.minHeight = ''; mh[k] = 0; } return; } const h = sl.offsetHeight; if (h > mh[k] + 1) { mh[k] = h; sl.style.minHeight = h + 'px'; } }).observe(sl); });
    slots.forEach((sl, k) => sl.addEventListener('click', (e) => { if (busy[k]) { const btn = e.target.closest('button, [contenteditable="true"]'); takeOne(k); if (!btn) scenes[k].rest(); } }, true));
    phone.addEventListener('change', () => { stopAll(); scenes.forEach((x, k) => { stopOne(k); x.rest(); armed[k] = true; }); place(); show(idx); });
    if (!reduce && window.IntersectionObserver) {
      const io = new IntersectionObserver((es) => es.forEach(e => {
        const k = slots.indexOf(e.target); if (!phone.matches || k < 0) return;
        if (e.intersectionRatio >= 0.35) { if (armed[k]) { armed[k] = false; playOne(k); } }
        else if (!e.isIntersecting) { if (!mine[k]) { stopOne(k); scenes[k].rest(); } armed[k] = true; }
      }), { threshold: [0, 0.35] });
      slots.forEach(sl => io.observe(sl));
    }
    tabs.forEach((t, i) => t.addEventListener('click', () => { pick(i); }));
    tabs.forEach((t, i) => t.parentElement.addEventListener('click', (e) => { if (!e.target.closest('.idea')) pick(i); }));
    $('.ideas', root).addEventListener('keydown', (e) => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (!d) return;
      e.preventDefault(); const n = (idx + d + tabs.length) % tabs.length; pick(n); tabs[n].focus();
    });
    print.addEventListener('click', (e) => { if (auto || once) { const btn = e.target.closest('button, [contenteditable="true"]'); take(); if (!btn) scenes[idx].rest(); } }, true);
    $('.replay', root).addEventListener('click', () => { if (reduce) return; auto = true; label(); run(); });
    if (reduce) return;
    new IntersectionObserver(([e]) => { if (phone.matches || !auto || (played && e.isIntersecting)) return; if (e.isIntersecting) run(); else { stopAll(); prog(idx, 0); scenes[idx].rest(); } }, { threshold: 0.35 }).observe(print);
  };

  const init = (id, mods, durs) => { if (document.getElementById(id)) card(id, mods.map(m => m()), durs); };
  init('aic-champion', [CH, CHP], [13000, 10500]);
  init('aic-swiftness', [SW, SWL], [17500, 9500]);
  init('aic-gigaspaces', [GG, GGN], [10000, 10000]);
  init('aic-uxlibrary', [UXW], [15500]);
})();
