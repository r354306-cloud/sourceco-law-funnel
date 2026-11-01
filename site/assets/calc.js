/* SourceCo law firm funnel prototype: calculator UI, report gate, analytics stub, page helpers. */
(function () {
  'use strict';
  var M = window.SCModel;

  // ---------- Analytics stub (GA4 via dataLayer) ----------
  // Production: load GA4/GTM in <head>, then these pushes become events.
  // Events: calc_start, calc_step, calc_complete, report_unlock, cta_click
  window.dataLayer = window.dataLayer || [];
  function track(event, params) {
    var o = { event: event };
    if (params) for (var k in params) o[k] = params[k];
    window.dataLayer.push(o);
  }
  window.scTrack = track;

  // ---------- Lead source (first touch and this visit) ----------
  // LinkedIn posts link with utm_source=linkedin&utm_campaign=law-firm-sellers&utm_content=<post id>.
  var SRC_KEY = 'sc_src';
  function readSource() {
    var q = new URLSearchParams(location.search), now = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) { if (q.get(k)) now[k.slice(4)] = q.get(k).slice(0, 80); });
    if (!now.source && document.referrer && document.referrer.indexOf(location.hostname) < 0) now.source = document.referrer.replace(/^https?:\/\//, '').split('/')[0];
    now.landing = location.pathname;
    var first = null;
    try { first = JSON.parse(localStorage.getItem(SRC_KEY) || 'null'); } catch (x) { first = null; }
    if (!first && (now.source || now.campaign)) { first = now; try { localStorage.setItem(SRC_KEY, JSON.stringify(now)); } catch (x) {} }
    return { first: first || now, last: now };
  }
  var SRC = readSource();

  // ---------- Lead tier: who SourceCo calls first ----------
  // A = call today, B = same-day email and a call if asked, C = report plus a slow follow-up.
  function leadTier(r, phone, next) {
    if (!r || r.empty) return { tier: 'C', points: 0 };
    var i = r.input || {}, p = 0;
    p += r.revenue >= 3e6 ? 3 : r.revenue >= 1e6 ? 2 : r.revenue >= 5e5 ? 1 : 0;
    p += { '12mo': 3, capital: 2, '2to3': 1 }[i.timeline] || 0;
    p += { high: 2, middle: 1, neutral: 1 }[r.practice.fit] || 0;
    if (phone) p += 1;
    if (next === 'call' || next === 'buyers') p += 2;
    return { tier: p >= 7 ? 'A' : p >= 4 ? 'B' : 'C', points: p };
  }
  var TIMELINE_L = { curious: 'Just curious', '12mo': 'Selling within 12 months', '2to3': '2 to 3 years out', capital: 'Capital or a partner' };

  var FIELDS = ['practice', 'state', 'revenue', 'profit', 'owners', 'salary', 'pipeline', 'orig', 'flow', 'stay', 'timeline'];
  var PARAMS = { practice: 'practice', state: 'state', rev: 'revenue', revenue: 'revenue', profit: 'profit', owners: 'owners', salary: 'salary', pipeline: 'pipeline', orig: 'orig', flow: 'flow', stay: 'stay', timeline: 'timeline' };
  var SHORT = { revenue: 'rev' };

  function fmt(n) { return n ? Math.round(n).toLocaleString('en-US') : ''; }
  function setField(form, name, value) {
    var el = form.elements[name];
    if (!el) return false;
    if (el.length && el[0] && el[0].type === 'radio') {
      for (var i = 0; i < el.length; i++) el[i].checked = (el[i].value === value);
    } else {
      el.value = el.getAttribute('data-money') != null ? fmt(M.num(value)) : value;
    }
    return true;
  }
  function read(form) {
    var d = {};
    FIELDS.forEach(function (n) { var el = form.elements[n]; if (el) d[n] = el.value; });
    return d;
  }

  // ---------- Full calculator ----------
  function initCalc(root) {
    var form = root.querySelector('form.calc-form');
    var out = root.querySelector('[data-result]');
    var steps = root.querySelectorAll('.step');
    var tabs = root.querySelectorAll('[data-goto]');
    var pipeWrap = root.querySelector('[data-pipeline]');
    var cur = 0, started = false, completed = false, touched = false, fromUrl = false;

    var qs = new URLSearchParams(window.location.search);
    var d0 = read(form);
    qs.forEach(function (v, k) { if (PARAMS[k] && setField(form, PARAMS[k], v)) fromUrl = true; });
    // A link with fees but no profit keeps the example's margin instead of the example's dollar profit.
    if (qs.get('rev') && !qs.get('profit') && PARAMS.profit && M.num(d0.revenue) > 0) {
      setField(form, PARAMS.profit, String(Math.round(M.num(qs.get('rev')) * M.num(d0.profit) / M.num(d0.revenue))));
    }

    var fill = root.querySelector('.prog-fill');
    function showStep(n) {
      cur = Math.max(0, Math.min(steps.length - 1, n));
      for (var i = 0; i < steps.length; i++) steps[i].classList.toggle('on', i === cur);
      root.querySelectorAll('.steps button').forEach(function (b, i) {
        if (i === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        b.classList.toggle('done', i < cur);
      });
      if (fill) fill.style.width = ((cur + 1) / steps.length * 100) + '%';
      track('calc_step', { step: cur + 1 });
    }
    function togglePipeline(d) {
      if (!pipeWrap) return;
      var p = M.practice(d.practice);
      pipeWrap.classList.toggle('is-hidden', !p.contingency);
    }
    function update() {
      var d = read(form);
      togglePipeline(d);
      var r = M.compute(d);
      var prev = [].map.call(out.querySelectorAll('.rc-v'), function (el) { return parseFloat(el.getAttribute('data-v')); });
      out.innerHTML = M.renderResult(r, { example: !touched && !fromUrl });
      if (touched) tween(out.querySelectorAll('.rc-v'), prev);
      root.setAttribute('data-path', r.path);
      root._last = r;
      paintDetails(r);
      if (root._mini) root._mini.innerHTML = r.empty ? '<b>Enter your fees</b><span>See range &#8595;</span>' : '<b>' + M.money(r.lo) + ' to ' + M.money(r.hi) + '</b><span>See details &#8595;</span>';
      var share = root.querySelector('[data-share]');
      if (share) share.setAttribute('data-url', shareUrl(d));
    }
    function shareUrl(d) {
      var p = new URLSearchParams();
      FIELDS.forEach(function (n) { if (d[n] !== '' && d[n] != null) p.set(SHORT[n] || n, String(d[n]).replace(/,/g, '')); });
      return window.location.origin + window.location.pathname + '?' + p.toString();
    }

    form.addEventListener('input', function (e) {
      if (!started) { started = true; track('calc_start', { practice: form.elements.practice.value }); }
      touched = true;
      update();
      if (cur === steps.length - 1 && !completed && e.target.name && ['orig', 'flow', 'stay', 'timeline'].indexOf(e.target.name) > -1) {
        completed = true; track('calc_complete', { path: root._last.path, practice: root._last.practice.key, state: root._last.state.code });
      }
    });
    form.addEventListener('change', update);
    form.querySelectorAll('input[data-money]').forEach(function (inp) {
      inp.addEventListener('input', function () { liveMoney(inp); }, true);
      inp.addEventListener('blur', function () { inp.value = fmt(M.num(inp.value)); });
      inp.addEventListener('focus', function () { inp.select(); });
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    root.querySelectorAll('[data-next]').forEach(function (b) { b.addEventListener('click', function () { showStep(cur + 1); }); });
    root.querySelectorAll('[data-prev]').forEach(function (b) { b.addEventListener('click', function () { showStep(cur - 1); }); });
    tabs.forEach(function (b) { b.addEventListener('click', function () { showStep(parseInt(b.getAttribute('data-goto'), 10)); }); });
    var finish = root.querySelector('[data-finish]');
    if (finish) finish.addEventListener('click', function () {
      if (!completed) { completed = true; track('calc_complete', { path: root._last.path, practice: root._last.practice.key, state: root._last.state.code }); }
      var card = root.querySelector('.rcard');
      if (card && window.innerWidth < 960) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    var share = root.querySelector('[data-share]');
    if (share) share.addEventListener('click', function () {
      var url = share.getAttribute('data-url');
      var done = function () { var t = share.textContent; share.textContent = 'Link copied'; setTimeout(function () { share.textContent = t; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done); else done();
      track('cta_click', { cta: 'copy_estimate_link' });
    });
    // Mobile: sticky bar with the live range while the result card is off screen.
    var mini = document.createElement('a');
    mini.className = 'rc-mini'; mini.href = '#'; mini.setAttribute('aria-hidden', 'true'); mini.tabIndex = -1;
    mini.addEventListener('click', function (e) { e.preventDefault(); root.querySelector('.rcard').scrollIntoView({ behavior: 'smooth', block: 'start' }); track('cta_click', { cta: 'mobile_range_bar' }); });
    (document.querySelector('.sc-law') || document.body).appendChild(mini);
    var cardSeen = false, inCalc = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { cardSeen = en[0].isIntersecting; paintMini(); }).observe(root.querySelector('.rcard'));
      new IntersectionObserver(function (en) { inCalc = en[0].isIntersecting; paintMini(); }).observe(root.querySelector('.panel'));
    }
    function paintMini() { mini.classList.toggle('show', inCalc && !cardSeen && !document.body.classList.contains('embed')); }
    root._mini = mini;
    if (qs.get('step')) showStep(parseInt(qs.get('step'), 10) - 1);
    update();
    window.SCCalc = root;
  }

  // Format currency as you type, keeping the caret after the same digit.
  function liveMoney(inp) {
    var pos = inp.selectionStart || 0;
    var digitsBefore = inp.value.slice(0, pos).replace(/[^0-9]/g, '').length;
    var raw = inp.value.replace(/[^0-9]/g, '');
    var out = raw ? Number(raw).toLocaleString('en-US') : '';
    inp.value = out;
    var i = 0, seen = 0;
    while (i < out.length && seen < digitsBefore) { if (/[0-9]/.test(out.charAt(i))) seen++; i++; }
    try { inp.setSelectionRange(i, i); } catch (e) {}
  }
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Tween the big range numbers between values.
  function tween(els, prev) {
    if (REDUCED || !prev.length) return;
    [].forEach.call(els, function (el, i) {
      var to = parseFloat(el.getAttribute('data-v')), from = prev[i];
      if (!isFinite(from) || !isFinite(to) || from === to) return;
      var t0 = performance.now(), dur = 520;
      (function step(now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = M.money(from + (to - from) * e);
        if (k < 1) requestAnimationFrame(step); else el.textContent = M.money(to);
      })(t0);
    });
  }

  // ---------- Buyer Fit Report gate (demo only) ----------
  var DISPOSABLE = /@(mailinator|guerrillamail|10minutemail|tempmail|temp-mail|yopmail|trashmail|sharklasers|getnada|dispostable)\./i;
  // Gate state is page-wide: one unlock opens every breakdown on the page.
  var UNLOCKED = false, LAST = null;
  function paintDetails(r) {
    LAST = r;
    document.querySelectorAll('[data-details]').forEach(function (el) {
      var inner = el.querySelector('.dinner');
      if (inner) inner.innerHTML = M.renderDetails(r);
    });
  }
  function unlockAll() {
    document.querySelectorAll('[data-details]').forEach(function (el) {
      el.classList.add('unlocking');
      el.classList.remove('locked');
      el.removeAttribute('aria-hidden');
    });
  }
  function mountGate(mount) {
    if (mount.querySelector('[data-gate]')) return;
    mount.innerHTML = M.renderGate({ preview: mount.getAttribute('data-preview') });
    var gate = mount.querySelector('[data-gate]');
    var form = gate.querySelector('form'), err = gate.querySelector('.err'), ok = gate.querySelector('.success');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.elements.name.value || '').trim(), email = (form.elements.email.value || '').trim();
      if (!name) { err.textContent = 'Enter your name.'; form.elements.name.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.textContent = 'Enter a valid email.'; form.elements.email.focus(); return; }
      if (DISPOSABLE.test(email)) { err.textContent = 'Please use a firm or personal email, not a temporary one.'; return; }
      err.textContent = '';
      // PRODUCTION: POST to the Webflow form or HubSpot Forms API here, e.g.
      // fetch('https://api.hsforms.com/submissions/v3/integration/submit/<portalId>/<formGuid>', { method: 'POST', ... })
      // Send the same fields as the prototype payload below: tier, points, next, timeline, ebitda, fit and the source fields
      // (first-touch source/medium/campaign/content/landing). Route tier A to a person the same business day.
      var phone = form.elements.phone ? form.elements.phone.value.trim() : '';
      var next = (form.querySelector('[name=next]:checked') || {}).value || 'report';
      var T = leadTier(LAST, phone, next);
      // Prototype backend: when the passcode build sets window.SC_BACKEND (a Google Apps Script web app),
      // the lead is appended to the Leads tab of the Google Sheet. text/plain avoids a CORS preflight.
      if (window.SC_BACKEND) {
        var inp = (LAST && LAST.input) || {};
        try {
          var f1 = SRC.first || {};
          fetch(window.SC_BACKEND, { method: 'POST', body: JSON.stringify({
            action: 'lead', name: name, email: email, phone: phone,
            // The prototype Sheet's Intent and Page columns carry the tier and source, so no backend change is needed.
            intent: 'Tier ' + T.tier + ' (' + T.points + ' pts): ' + (TIMELINE_L[inp.timeline] || '') + '; wants ' + { report: 'the report', call: 'a call', buyers: 'to meet buyers' }[next],
            practice: LAST ? LAST.practice.key : '', state: inp.state || '', revenue: inp.revenue || '', profit: inp.profit || '',
            owners: inp.owners || '', path: LAST ? LAST.path : '', low: LAST ? LAST.lo : '', high: LAST ? LAST.hi : '',
            page: location.pathname + ' | source: ' + [f1.source, f1.medium, f1.campaign, f1.content].filter(Boolean).join(' / ') + (f1.landing && f1.landing !== location.pathname ? ' | landed on ' + f1.landing : ''),
            tier: T.tier, points: T.points, next: next, timeline: inp.timeline || '', ebitda: LAST ? Math.round(LAST.ebitda) : '', fit: LAST ? LAST.practice.fit : '',
            src_source: f1.source || '', src_medium: f1.medium || '', src_campaign: f1.campaign || '', src_content: f1.content || '', src_landing: f1.landing || ''
          }) });
        } catch (x) { /* never block the unlock on the backend */ }
      }
      UNLOCKED = true;
      unlockAll();
      track('report_unlock', { path: LAST ? LAST.path : '', practice: LAST ? LAST.practice.key : '', timeline: LAST ? LAST.input.timeline : '', lead_tier: T.tier, next_step: next, source: (SRC.first || {}).source || '' });
      if (next !== 'report') { var em = ok.querySelector('em'); if (em) em.insertAdjacentHTML('beforebegin', '<span class="gc-next-note">' + (next === 'call' ? 'A SourceCo advisor will reach out today to set a time. ' : 'A SourceCo advisor will reach out today about buyers who fit. ') + '</span>'); }
      form.classList.add('is-hidden');
      ok.classList.add('on');
      ok.focus({ preventScroll: true });
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-unlock-cta]');
    if (!b) return;
    e.preventDefault();
    var g = document.querySelector('[data-gate] #g-name');
    if (g) { g.closest('[data-gate]').scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(function () { g.focus({ preventScroll: true }); }, 450); }
  });

  // ---------- PI mini calculator ----------
  function initMini(root) {
    var f = root.querySelector('form');
    var out = root.querySelector('[data-mini-out]');
    var link = root.querySelector('[data-mini-link]');
    function update() {
      var d = { practice: 'pi', state: f.elements.state.value, revenue: f.elements.revenue.value, profit: f.elements.profit.value, owners: f.elements.owners.value, salary: f.elements.salary.value, orig: '25to50', flow: 'marketing', stay: '1yr' };
      var r = M.compute(d);
      out.querySelector('.mo-v').textContent = r.empty ? 'Enter fees' : M.money(r.lo) + ' to ' + M.money(r.hi);
      out.querySelector('.mo-b').textContent = r.empty ? '' : 'About ' + (Math.round(r.multMid * 10) / 10) + 'x ' + r.basisLabel + '. ' + r.pathLabel + '.';
      var p = new URLSearchParams({ practice: 'pi', state: d.state, rev: String(M.num(d.revenue)), profit: String(M.num(d.profit)), owners: String(M.num(d.owners)), salary: String(M.num(d.salary)), step: '3' });
      link.setAttribute('href', link.getAttribute('data-base') + '?' + p.toString());
      paintDetails(r);
    }
    f.addEventListener('input', update);
    f.querySelectorAll('input[data-money]').forEach(function (inp) { inp.addEventListener('input', function () { liveMoney(inp); }, true); inp.addEventListener('blur', function () { inp.value = fmt(M.num(inp.value)); }); });
    f.addEventListener('submit', function (e) { e.preventDefault(); });
    update();
  }

  // ---------- State table filter ----------
  function initStateFilter(root) {
    var input = root.querySelector('input');
    var btns = root.querySelectorAll('button[data-level]');
    var rows = document.querySelectorAll('[data-state-row]');
    var count = document.querySelector('[data-state-count]');
    var level = 'all';
    function apply() {
      var q = (input.value || '').toLowerCase().trim(), n = 0;
      rows.forEach(function (tr) {
        var show = (level === 'all' || tr.getAttribute('data-level') === level) && (!q || tr.textContent.toLowerCase().indexOf(q) > -1);
        tr.hidden = !show; if (show) n++;
      });
      if (count) count.textContent = n + ' of ' + rows.length + ' shown';
    }
    input.addEventListener('input', apply);
    btns.forEach(function (b) { b.addEventListener('click', function () { level = b.getAttribute('data-level'); btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); apply(); }); });
    apply();
  }

  // ---------- TOC highlight + reading progress ----------
  function initToc() {
    var links = document.querySelectorAll('.toc ol a[href^="#"]');
    var bar = document.querySelector('.toc-progress i'), prose = document.querySelector('.prose');
    if (bar && prose) {
      var onScroll = function () {
        var r = prose.getBoundingClientRect(), h = r.height - window.innerHeight * 0.6;
        bar.style.width = Math.max(0, Math.min(100, (-r.top + window.innerHeight * 0.2) / Math.max(1, h) * 100)) + '%';
      };
      window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    }
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { links.forEach(function (a) { a.classList.remove('on'); }); var a = map[en.target.id]; if (a) a.classList.add('on'); }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  // ---------- Embed height (iframe in Webflow) ----------
  function initEmbed() {
    if (!document.body.classList.contains('embed') || window.parent === window) return;
    var send = function () { window.parent.postMessage({ type: 'sc-calc-height', height: document.documentElement.scrollHeight }, '*'); };
    if ('ResizeObserver' in window) new ResizeObserver(send).observe(document.body);
    window.addEventListener('load', send); send();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-cta]');
    if (a) track('cta_click', { cta: a.getAttribute('data-cta') });
  });

  // ---------- Scroll reveals and count-ups ----------
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || REDUCED) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    window.addEventListener('beforeprint', function () { els.forEach(function (el) { el.classList.add('in'); }); });
    els.forEach(function (el) { io.observe(el); });
  }
  function initCount() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length || REDUCED || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, m = el.getAttribute('data-final').match(/^([^0-9]*)([0-9][0-9,]*\.?[0-9]*)(.*)$/);
        if (!m) return;
        var target = parseFloat(m[2].replace(/,/g, '')), dec = (m[2].split('.')[1] || '').length, t0 = performance.now(), dur = 1100;
        (function step(now) {
          var k = Math.min(1, (now - t0) / dur), v = target * (1 - Math.pow(1 - k, 3));
          el.textContent = m[1] + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + m[3];
          if (k < 1) requestAnimationFrame(step); else el.textContent = el.getAttribute('data-final');
        })(t0);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) {
      el.setAttribute('data-final', el.textContent.trim());
      var r = el.getBoundingClientRect();
      if (r.top > window.innerHeight) { var m = el.textContent.trim().match(/^([^0-9]*)([0-9][0-9,]*\.?[0-9]*)(.*)$/); if (m) el.textContent = m[1] + '0' + m[3]; }
      io.observe(el);
    });
  }

  function boot() {
    document.querySelectorAll('[data-gate-mount]').forEach(mountGate);
    document.querySelectorAll('[data-calc]').forEach(initCalc);
    if (location.hash === '#buyer-fit') { var bf = document.getElementById('buyer-fit'); if (bf) setTimeout(function () { bf.scrollIntoView(); }, 60); }
    document.querySelectorAll('[data-mini]').forEach(initMini);
    document.querySelectorAll('[data-state-filter]').forEach(initStateFilter);
    initToc();
    initReveal();
    initCount();
    initEmbed();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
