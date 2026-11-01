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
  // Global Privacy Control: a visitor who sends the GPC signal has opted out of "sharing" under CCPA.
  // GTM reads dataLayer.gpc and blocks the LinkedIn Insight Tag and any ad tags for them (see the Webflow README).
  var GPC = navigator.globalPrivacyControl === true;
  window.dataLayer.push({ gpc: GPC });
  window.scGPC = GPC;
  // Never push names, emails or phone numbers into the dataLayer; events carry only tiers, practice areas and paths.

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
  // Example numbers (the prefilled default) are never scored: the lead is sent as unscored with no financials.
  function isExample(r) { var i = (r && r.input) || {}; return M.num(i.revenue) === M.DEFAULTS.revenue && M.num(i.profit) === M.DEFAULTS.profit; }
  function leadTier(r, phone, next, role) {
    if (!r || r.empty || isExample(r)) return { tier: 'U', points: 0, example: true };
    var i = r.input || {}, p = 0;
    // Scored on adjusted EBITDA (profit after market pay for the owners), which is what buyers price.
    p += r.ebitda >= 1e6 ? 3 : r.ebitda >= 4e5 ? 2 : r.ebitda >= 15e4 ? 1 : 0;
    p += { '12mo': 3, capital: 2, '2to3': 1 }[i.timeline] || 0;
    p += { high: 2, middle: 1, neutral: 1 }[r.practice.fit] || 0;
    if (phone) p += 1;
    if (next === 'call' || next === 'buyers') p += 2;
    var t = p >= 7 ? 'A' : p >= 4 ? 'B' : 'C';
    if (role && role !== 'owner') t = 'C'; // only owners are scored up
    return { tier: t, points: p };
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
      if (root._mini) root._mini.innerHTML = r.empty ? '<b>Enter your fees</b><span>See range &#8595;</span>' : '<b>' + (!touched && !fromUrl ? 'Example: ' : '') + M.money(r.lo) + ' to ' + M.money(r.hi) + '</b><span>See details &#8595;</span>';
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

  // ---------- Full breakdown gate ----------
  var DISPOSABLE = /@(mailinator|guerrillamail|10minutemail|tempmail|temp-mail|yopmail|trashmail|sharklasers|getnada|dispostable)\./i;
  // Gate state is page-wide: one unlock opens every breakdown on the page.
  var UNLOCKED = false, LAST = null;
  // Buyer introductions for small lawyer-to-lawyer sales (path A) stay off until counsel clears SourceCo's fee on them.
  var PATH_A_INTROS = false;
  function paintDetails(r) {
    LAST = r;
    var hideIntros = !PATH_A_INTROS && r && !r.empty && r.path === 'A';
    document.querySelectorAll('[data-gate] input[name=next][value=buyers]').forEach(function (inp) {
      var lab = inp.closest('label'); if (lab) lab.hidden = hideIntros;
      if (hideIntros && inp.checked) { var c = inp.form && inp.form.querySelector('input[name=next][value=call]'); if (c) c.checked = true; }
    });
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
      var role = form.elements.role ? form.elements.role.value : 'owner';
      if (form.elements.role && !role) { err.textContent = 'Choose your role.'; form.elements.role.focus(); return; }
      err.textContent = '';
      // PRODUCTION: POST to the Webflow form or HubSpot Forms API here, e.g.
      // fetch('https://api.hsforms.com/submissions/v3/integration/submit/<portalId>/<formGuid>', { method: 'POST', ... })
      // Send the same fields as the prototype payload below: tier, points, next, timeline, ebitda, fit and the source fields
      // (first-touch source/medium/campaign/content/landing). Route tier A to a person the same business day.
      var phone = form.elements.phone ? form.elements.phone.value.trim() : '';
      var next = (form.querySelector('[name=next]:checked') || {}).value || 'report';
      var T = leadTier(LAST, phone, next, role);
      // Prototype backend: when the passcode build sets window.SC_BACKEND (a Google Apps Script web app),
      // the lead is appended to the Leads tab of the Google Sheet. text/plain avoids a CORS preflight.
      if (window.SC_BACKEND) {
        var inp = (LAST && LAST.input) || {};
        try {
          var f1 = SRC.first || {};
          fetch(window.SC_BACKEND, { method: 'POST', body: JSON.stringify({
            action: 'lead', name: name, email: email, phone: phone,
            // The prototype Sheet's Intent and Page columns carry the tier and source, so no backend change is needed.
            intent: (T.example ? 'Unscored (example numbers, no inputs)' : 'Tier ' + T.tier + ' (' + T.points + ' pts): ' + (TIMELINE_L[inp.timeline] || '')) + '; role ' + role + '; wants ' + { report: 'the breakdown', call: 'a call', buyers: 'to compare offers' }[next] + (next === 'call' ? '; CALL WITHIN 5 MIN IN BUSINESS HOURS' : next === 'buyers' ? '; REPLY SAME BUSINESS DAY' : ''),
            role: role, callback: next !== 'report' ? 'yes' : 'no',
            practice: LAST ? LAST.practice.key : '', state: inp.state || '', revenue: T.example ? '' : (inp.revenue || ''), profit: T.example ? '' : (inp.profit || ''),
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
      if (next !== 'report') { var em = ok.querySelector('em'); if (em) em.insertAdjacentHTML('beforebegin', '<span class="gc-next-note">' + (next === 'call' ? 'A SourceCo advisor will call or email the same business day to set a time. ' : 'A SourceCo advisor will reply the same business day about comparing offers from buyers who fit. No buyer hears your name until you approve it. ') + '</span>'); }
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
    var want = b.getAttribute('data-next'); if (want) { var rb = document.querySelector('[data-gate] input[name=next][value=' + want + ']'); if (rb) rb.checked = true; }
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


  // ---------- Article quick estimate + sticky mobile bar (roadmap articles) ----------
  function initArtEst(root) {
    var f = root.querySelector('form');
    var k = root.querySelector('[data-est-k]'), v = root.querySelector('[data-est-v]'), b = root.querySelector('[data-est-b]');
    var link = root.querySelector('[data-est-link]');
    var sticky = document.querySelector('[data-art-sticky]');
    var sTxt = sticky && sticky.querySelector('[data-sticky-txt]'), sLink = sticky && sticky.querySelector('[data-sticky-link]');
    var touched = false, started = false;
    function update() {
      var d = { practice: f.elements.practice.value, state: M.DEFAULTS.state, revenue: f.elements.revenue.value, profit: f.elements.profit.value, owners: f.elements.owners.value, salary: M.DEFAULTS.salary, orig: '25to50', flow: 'mixed', stay: '1yr' };
      var r = M.compute(d);
      k.textContent = touched ? 'Your directional range' : 'Example range';
      v.textContent = r.empty ? 'Enter your fees' : M.money(r.lo) + ' to ' + M.money(r.hi);
      b.textContent = r.empty ? '' : 'About ' + (Math.round(r.multMid * 10) / 10) + 'x ' + r.basisLabel + '. ' + r.pathLabel + '.';
      if (link) {
        var p = new URLSearchParams({ practice: d.practice, rev: String(M.num(d.revenue)), profit: String(M.num(d.profit)), owners: String(M.num(d.owners)), step: '3' });
        link.setAttribute('href', link.getAttribute('data-base') + '?' + p.toString() + '#calculator');
        if (touched && sLink) { sLink.setAttribute('href', link.getAttribute('href')); sLink.firstChild.textContent = 'Full report '; }
      }
      if (touched && sTxt && !r.empty) sTxt.textContent = M.money(r.lo) + ' to ' + M.money(r.hi);
    }
    f.addEventListener('input', function () {
      touched = true;
      if (!started) { started = true; track('calc_start', { source: 'article_estimate' }); }
      update();
    });
    f.querySelectorAll('input[data-money]').forEach(function (inp) { inp.addEventListener('input', function () { liveMoney(inp); }, true); inp.addEventListener('blur', function () { inp.value = fmt(M.num(inp.value)); }); });
    f.addEventListener('submit', function (e) { e.preventDefault(); if (link) link.click(); });
    update();
    // Sticky bar on phones: shows once the estimate card is above the viewport, hides at the closing band and footer.
    if (sticky && 'IntersectionObserver' in window) {
      var past = false, atEnd = false;
      var paint = function () { sticky.hidden = !(past && !atEnd); };
      new IntersectionObserver(function (es) { es.forEach(function (e) { past = !e.isIntersecting && e.boundingClientRect.top < 0; }); paint(); }).observe(root);
      var end = document.querySelector('.band') || document.querySelector('footer');
      if (end) new IntersectionObserver(function (es) { es.forEach(function (e) { atEnd = e.isIntersecting || e.boundingClientRect.top < 0; }); paint(); }).observe(end);
    }
  }
  // Citation links open the collapsed sources list; TOC links open a folded section
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (/^src-|^sources$/.test(id)) { var d = document.querySelector('details.la-src'); if (d) d.open = true; return; }
    var sec = id && document.getElementById(id);
    var more = sec && sec.querySelector && sec.querySelector(':scope > details.la-more');
    if (more) more.open = true;
  });
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d.classList && d.classList.contains('la-more') && d.open) { var s = d.closest('section'); track('cta_click', { cta: 'read_more_' + (s ? s.id : '') }); }
  }, true);

  // ---------- Investor page: law firm buy box ----------
  function initBuyerForm(form) {
    var card = form.closest('.bb-card'), ok = card && card.querySelector('.success'), err = form.querySelector('.err');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { return form.elements[n] ? String(form.elements[n].value || '').trim() : ''; };
      var all = function (n) { return Array.prototype.map.call(form.querySelectorAll('input[name=' + n + ']:checked'), function (x) { return x.value; }).join(', '); };
      var email = v('email');
      if (!v('name')) { err.textContent = 'Enter your name.'; form.elements.name.focus(); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'Enter a valid work email.'; form.elements.email.focus(); return; }
      if (!v('firm')) { err.textContent = 'Enter your firm or fund.'; form.elements.firm.focus(); return; }
      if (!v('btype')) { err.textContent = 'Choose what kind of buyer you are.'; form.elements.btype.focus(); return; }
      if (v('revmin') && v('revmax') && Number(v('revmin')) > Number(v('revmax'))) { err.textContent = 'The revenue range is reversed.'; form.elements.revmin.focus(); return; }
      err.textContent = '';
      var f1 = SRC.first || {};
      if (window.SC_BACKEND) {
        try {
          fetch(window.SC_BACKEND, { method: 'POST', body: JSON.stringify({ action: 'buyer', name: v('name'), email: email, firm: v('firm'), btype: v('btype'), states: v('states'),
            practices: all('practices'), feemodels: all('feemodels'), revmin: v('revmin'), revmax: v('revmax'), structures: all('structures'), stay: v('stay'), notes: v('notes'),
            page: location.pathname + ' | source: ' + [f1.source, f1.medium, f1.campaign, f1.content].filter(Boolean).join(' / ') }) });
        } catch (x) { /* never block the confirmation on the backend */ }
      }
      track('buyer_submit', { buyer_type: v('btype'), practices: all('practices'), structures: all('structures'), source: f1.source || '' });
      form.classList.add('is-hidden');
      if (ok) { ok.classList.add('on'); ok.focus({ preventScroll: true }); }
    });
  }

  function boot() {
    document.querySelectorAll('[data-buyer-form]').forEach(initBuyerForm);
    document.querySelectorAll('[data-gate-mount]').forEach(mountGate);
    document.querySelectorAll('[data-calc]').forEach(initCalc);
    if (location.hash === '#buyer-fit') { var bf = document.getElementById('buyer-fit'); if (bf) setTimeout(function () { bf.scrollIntoView(); var rb = bf.querySelector('input[name=next][value=buyers]'); if (rb) rb.checked = true; }, 60); }
    document.querySelectorAll('[data-mini]').forEach(initMini);
    document.querySelectorAll('[data-art-est]').forEach(initArtEst);
    document.querySelectorAll('[data-state-filter]').forEach(initStateFilter);
    initToc();
    initReveal();
    initCount();
    initEmbed();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
