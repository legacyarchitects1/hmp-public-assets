/* STEM Master Course — Interactive Edition v2 (GitHub Pages).
   Interactive version of the Student Edition workbook, with learner profiles,
   saved workbook answers, build-project data tools, quizzes, final exam,
   certificate, printable workbook, and a Teacher Hub (Teacher's Edition guide,
   answer key, rubric grading, class gradebook, Family Night Kit). */
(function () {
  "use strict";
  var D = window.STEM, root = document.getElementById('hmpc-root');
  if (!D || !root) return;

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) { var v = attrs[k]; if (v == null || v === false) continue;
      if (k === 'html') el.innerHTML = v; else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v); }
    (kids || []).forEach(function (c) { if (c == null || c === false) return; el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function fb(el, ok, msg) { el.innerHTML = '<span class="' + (ok ? 'fb-ok' : 'fb-no') + '">' + esc(msg) + '</span>'; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function fnv(s) { var x = 0x811c9dc5; for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; } return x.toString(16); }
  function download(name, text, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type || 'application/json' }));
    var a = h('a', { href: url, download: name }); document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 2000);
  }
  var MODS = D.mods, MOD = {}; MODS.forEach(function (m) { MOD[m.n] = m; });
  var LESSONS = []; MODS.forEach(function (m) { m.lessons.forEach(function (l) { LESSONS.push({ m: m.n, l: l }); }); });
  var TEACHER_HASH = '21973eb5';
  var AVATARS = ['🦁', '🐘', '🦉', '🚀', '🔬', '🧪', '🤖', '🦋', '🐢', '🌟', '🐬', '🦊'];

  /* ---------- storage ---------- */
  var KEY = 'hmp-stem-v2', DB;
  function blank() { return { profiles: {}, order: [], active: null, settings: { size: 'm', rate: 1, contrast: false }, teacher: { rubric: {}, notes: {}, roster: {} } }; }
  function load() {
    DB = blank();
    try { var raw = localStorage.getItem(KEY); if (raw) { var p = JSON.parse(raw); if (p && p.profiles) { DB = p; ['settings', 'teacher'].forEach(function (k) { DB[k] = Object.assign(blank()[k], DB[k] || {}); }); } } } catch (e) {}
    // bring v1 progress forward as the first learner
    try {
      var v1 = localStorage.getItem('hmp-stem-master-v1');
      if (v1 && !DB.migrated) {
        var o = JSON.parse(v1) || {}; DB.migrated = true;
        if (o.done && Object.keys(o.done).length || o.quiz && Object.keys(o.quiz).length || o.final) {
          var p = newProfile(o.name || 'My Scientist', '🔬', true);
          p.done = o.done || {}; Object.keys(o.quiz || {}).forEach(function (n) { p.quiz[n] = { best: o.quiz[n].best || 0, att: [] }; });
          if (o.final) p.final = { best: o.final.best, pass: !!o.final.pass, date: o.final.date, att: [] };
        }
      }
    } catch (e) {}
  }
  var saveT = null, warned = false;
  function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 250); }
  function saveNow() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { if (!warned) { warned = true; alert('This device is out of space for saving. Remove a build photo or export a backup from Settings.'); } } }
  window.addEventListener('pagehide', saveNow);
  function newProfile(name, avatar, silent) {
    var id = uid();
    DB.profiles[id] = { id: id, name: (name || 'Scientist').slice(0, 40), avatar: avatar || '🔬', created: today(), done: {}, tryit: {}, words: {}, labs: {}, build: {}, quiz: {}, final: null, last: null, seen: today() };
    DB.order.push(id); DB.active = id; if (!silent) saveNow(); return DB.profiles[id];
  }
  function P() { return DB.profiles[DB.active] || null; }

  /* ---------- progress ---------- */
  function quizPass(p, n) { return !!(p.quiz[n] && p.quiz[n].best >= 6); }
  function buildDone(p, n) { return !!(p.build[n] && p.build[n].done); }
  function parts(p, n) {
    var m = MOD[n], ld = m.lessons.filter(function (l) { return p.done[l.num]; }).length;
    return { lessons: ld, lessonsT: m.lessons.length, words: !!p.words[n], lab: !!p.labs[n], build: buildDone(p, n), quiz: quizPass(p, n) };
  }
  function modPct(p, n) { var x = parts(p, n), t = x.lessonsT + 4, d = x.lessons + (x.words ? 1 : 0) + (x.lab ? 1 : 0) + (x.build ? 1 : 0) + (x.quiz ? 1 : 0); return Math.round(100 * d / t); }
  function stamp(p, n) { var x = parts(p, n); return x.lessons === x.lessonsT && x.quiz && x.build; }
  function overall(p) { var t = 0, d = 0; MODS.forEach(function (m) { var x = parts(p, m.n); t += x.lessonsT + 4; d += x.lessons + (x.words ? 1 : 0) + (x.lab ? 1 : 0) + (x.build ? 1 : 0) + (x.quiz ? 1 : 0); }); t++; if (p.final && p.final.pass) d++; return Math.round(100 * d / t); }
  function quizTotal(p) { var s = 0; MODS.forEach(function (m) { s += p.quiz[m.n] ? p.quiz[m.n].best : 0; }); return s; }
  function nextStep(p) {
    for (var i = 0; i < MODS.length; i++) {
      var m = MODS[i], x = parts(p, m.n);
      for (var j = 0; j < m.lessons.length; j++) if (!p.done[m.lessons[j].num]) return { href: '#/m/' + m.n + '/l/' + m.lessons[j].num, label: 'Lesson ' + m.lessons[j].num + ': ' + m.lessons[j].title };
      if (!x.words) return { href: '#/m/' + m.n + '/words', label: 'Module ' + m.n + ' Words' };
      if (!x.lab) return { href: '#/m/' + m.n + '/lab', label: 'Module ' + m.n + ' Lab' };
      if (!x.build) return { href: '#/m/' + m.n + '/build', label: 'Build: ' + m.build.title };
      if (!x.quiz) return { href: '#/m/' + m.n + '/quiz', label: 'Module ' + m.n + ' Quiz' };
    }
    if (!(p.final && p.final.pass)) return { href: '#/final', label: 'The Final Exam' };
    return { href: '#/cert', label: 'Your STEM Master certificate' };
  }

  /* ---------- audio & read-aloud ---------- */
  var player = null, playingBtn = null;
  function stopAudio() { if (player) { player.pause(); if (playingBtn) playingBtn.innerHTML = playingBtn._label; } try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {} Array.prototype.forEach.call(document.querySelectorAll('#hmpc video'), function (v) { v.pause(); }); }
  function listenBtn(key, who) {
    var url = D.audio && D.audio[key]; if (!url) return null;
    var b = h('button', { 'class': 'listen', type: 'button' }); b._label = '&#9654; Listen with ' + (who || 'Mia'); b.innerHTML = b._label;
    b.addEventListener('click', function () {
      if (player && playingBtn === b && !player.paused) { player.pause(); b.innerHTML = b._label; return; }
      stopAudio(); player = new Audio(url); player.playbackRate = DB.settings.rate || 1; playingBtn = b; b.innerHTML = '&#10074;&#10074; Pause';
      player.addEventListener('ended', function () { b.innerHTML = b._label; });
      player.play().catch(function () { b.innerHTML = b._label; });
    });
    return b;
  }
  var canSpeak = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  function speakBtn(text, label) {
    if (!canSpeak) return null;
    return h('button', { type: 'button', 'class': 'speak', 'aria-label': 'Read aloud' + (label ? ': ' + label : ''), title: 'Read aloud', onclick: function (e) {
      e.stopPropagation(); try { if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; } var u = new SpeechSynthesisUtterance(text); u.rate = 0.95 * (DB.settings.rate || 1); u.lang = 'en-US'; speechSynthesis.speak(u); } catch (er) {}
    } }, ['🔊']);
  }

  /* ---------- routing ---------- */
  function route() { var p = (location.hash || '#/').replace(/^#\/?/, '').split('/'); return p.filter(function (x) { return x !== ''; }); }
  function go(href) { if (location.hash === href) render(); else location.hash = href; }
  window.addEventListener('hashchange', function () { stopAudio(); render(); window.scrollTo(0, 0); });

  /* ---------- chrome ---------- */
  function topbar(p, r) {
    var pc = p ? overall(p) : 0;
    var nav = [['#/', 'Home', r[0] == null], ['#/book', 'My Workbook', r[0] === 'book'], ['#/gloss', 'Glossary', r[0] === 'gloss'], ['#/final', 'Final Exam', r[0] === 'final' || r[0] === 'cert'], ['#/teacher', 'Teacher', r[0] === 'teacher']];
    return h('header', { 'class': 'top noprint' }, [
      h('a', { 'class': 'who', href: '#/who', 'aria-label': 'Switch learner' }, p ? [h('span', { 'class': 'av', text: p.avatar }), h('span', {}, [h('span', { 'class': 'brand', text: 'STEM Master' }), h('span', { 'class': 'nm', text: p.name }), h('span', { 'class': 'bar' }, [h('i', { style: 'width:' + pc + '%' })])])] : [h('span', { 'class': 'brand', text: 'STEM Master Course' })]),
      h('nav', { 'class': 'nav', 'aria-label': 'Main' }, nav.map(function (n) { return h('a', { href: n[0], 'class': n[2] ? 'on' : '', 'aria-current': n[2] ? 'page' : null, text: n[1] }); }).concat([h('a', { href: '#/settings', 'class': r[0] === 'settings' ? 'on' : '', 'aria-label': 'Settings', text: '⚙' })]))]);
  }
  function footer() { return h('footer', { 'class': 'foot noprint', html: '<b>' + esc(D.footer) + '</b><br>Hands-on activities are meant to be done with a grown-up nearby. Your work saves on this device — use My Workbook › Save a backup to keep it safe. Questions? taylormadesalescorp@gmail.com' }); }
  function crumbs(list) { return h('div', { 'class': 'crumbs noprint' }, list.map(function (c, i) { return i < list.length - 1 ? h('a', { href: c[0], text: c[1] }) : h('span', { text: c[1] }); }).reduce(function (a, el, i) { if (i) a.push(document.createTextNode(' › ')); a.push(el); return a; }, [])); }
  function btnLink(href, label, cls) { return h('a', { href: href, 'class': 'btn ' + (cls || 'b-gold'), text: label }); }

  /* ---------- views ---------- */
  function whoView() {
    var w = h('div', { 'class': 'wrap' });
    w.appendChild(h('div', { 'class': 'center' }, [h('img', { src: D.img.badge, alt: '', 'class': 'logo', width: '120', height: '120' }), h('h1', { text: 'Who is learning today?' }), h('p', { 'class': 'muted', text: 'Each learner gets their own workbook, scores and certificate. Brothers, sisters and classmates can share one device.' })]));
    var g = h('div', { 'class': 'people' });
    DB.order.forEach(function (id) { var p = DB.profiles[id]; if (!p) return;
      g.appendChild(h('button', { type: 'button', 'class': 'person' + (id === DB.active ? ' on' : ''), onclick: function () { DB.active = id; p.seen = today(); saveNow(); go(p.last || '#/'); } }, [h('span', { 'class': 'av big', text: p.avatar }), h('b', { text: p.name }), h('span', { 'class': 'muted', text: overall(p) + '% complete' })])); });
    w.appendChild(g);
    var name = h('input', { type: 'text', maxlength: '40', placeholder: 'First name', 'aria-label': 'New learner first name' }), av = AVATARS[DB.order.length % AVATARS.length];
    var avs = h('div', { 'class': 'avs', role: 'radiogroup', 'aria-label': 'Pick an avatar' });
    AVATARS.forEach(function (a) { var b = h('button', { type: 'button', role: 'radio', 'aria-checked': a === av ? 'true' : 'false', 'class': a === av ? 'on' : '', text: a, onclick: function () { av = a; Array.prototype.forEach.call(avs.children, function (c) { c.className = c.textContent === a ? 'on' : ''; c.setAttribute('aria-checked', c.textContent === a ? 'true' : 'false'); }); } }); avs.appendChild(b); });
    w.appendChild(h('div', { 'class': 'card' }, [h('div', { 'class': 'in' }, [h('h3', { text: DB.order.length ? 'Add a learner' : 'Make your learner card' }), h('div', { 'class': 'row' }, [name]), avs,
      h('div', { 'class': 'row' }, [h('button', { type: 'button', 'class': 'b-gold', onclick: function () { if (!name.value.trim()) { name.focus(); name.placeholder = 'Type a name first'; return; } newProfile(name.value.trim(), av); go('#/'); } }, ['Start learning →'])]),
      h('p', { 'class': 'muted', html: 'Moving from another device? Open <a href="#/settings">Settings</a> and choose <b>Restore a backup</b>.' })])]));
    return [w];
  }

  function home(p) {
    var w = [], pc = overall(p), nx = nextStep(p);
    w.push(h('section', { 'class': 'hero' }, [h('div', {}, [h('div', { 'class': 'kicker', text: 'The Legacy Blueprint · Interactive Workbook' }),
      h('h1', { text: 'Welcome back, ' + p.name + '!' }), h('p', { text: D.welcome }),
      h('div', { 'class': 'ring-row' }, [ring(pc), h('div', {}, [h('div', { 'class': 'muted', text: 'Next up' }), h('b', { text: nx.label }), h('div', { 'class': 'row' }, [btnLink(nx.href, pc ? 'Keep going →' : 'Start Module 1 →'), listenBtn('welcome', 'Mia')])])])]),
      h('img', { src: D.img.hero, alt: 'Two young engineers in hard hats at a rocket launch over a golden bridge', width: '720', height: '720' })]));
    var wr = h('div', { 'class': 'wrap' });
    wr.appendChild(h('h2', { text: 'My STEM Passport' }));
    wr.appendChild(h('div', { 'class': 'passport' }, MODS.map(function (m) { var s = stamp(p, m.n); return h('a', { href: '#/m/' + m.n, 'class': 'stamp' + (s ? ' on' : ''), 'aria-label': 'Module ' + m.n + (s ? ' stamp earned' : ' stamp not yet earned') }, [h('span', { text: s ? '★' : String(m.n) }), h('small', { text: m.title.split(' ').slice(0, 2).join(' ') })]); })));
    wr.appendChild(h('p', { 'class': 'muted', text: 'Earn a stamp by finishing every lesson, the Build Project and the quiz in a module.' }));
    wr.appendChild(h('h2', { text: 'Your Journey Map' }));
    var g = h('div', { 'class': 'grid' });
    MODS.forEach(function (m) { var x = parts(p, m.n), mp = modPct(p, m.n);
      g.appendChild(h('a', { 'class': 'mcard', href: '#/m/' + m.n }, [h('img', { src: D.img['m' + m.n], alt: '', loading: 'lazy', width: '900', height: '450' }), h('div', { 'class': 'in' }, [
        h('span', { 'class': 'mnum', text: 'MODULE ' + m.n }), h('span', { 'class': 'mt', text: m.title }), h('span', { 'class': 'muted', style: 'display:block;margin-bottom:6px', text: m.tag }),
        h('span', { 'class': 'bar' }, [h('i', { style: 'width:' + mp + '%' })]),
        h('div', { 'class': 'chips' }, [chip(x.lessons + '/' + x.lessonsT + ' lessons', x.lessons === x.lessonsT), chip('Words', x.words), chip('Lab', x.lab), chip('Build', x.build), chip('Quiz', x.quiz)])])])); });
    wr.appendChild(g);
    wr.appendChild(h('div', { 'class': 'card', style: 'margin-top:18px' }, [h('div', { 'class': 'in' }, [h('h3', { text: 'How this workbook works' }), h('ul', { 'class': 'dots', html:
      '<li><b>Work in order.</b> Each module builds on the last.</li><li><b>Read, then do.</b> Watch the video, read or listen, then do the TRY IT and write what happened.</li><li><b>Words, Lab, Build.</b> Learn the vocabulary, play the lab, then do the Build Project with a grown-up and record real data.</li><li><b>Take every quiz.</b> 8 points each. Pass with 6 or more.</li><li><b>Final Exam.</b> 24 questions. Score 22 or more (90%) to become a STEM Master and earn your certificate and badge.</li><li><b>Grown-ups are the lab assistants.</b> Celebrate every failed test — failure is data!</li>' }),
      h('div', { 'class': 'safety', html: '<b>! SAFETY FIRST</b> Never taste or touch unknown materials, ask a grown-up before using tools or electricity, and keep small parts away from little siblings.' })])]));
    w.push(wr); return w;
  }
  function chip(t, on) { return h('span', { 'class': 'pill' + (on ? ' ok' : ''), text: (on ? '✓ ' : '') + t }); }
  function ring(pc) { var r = 34, c = 2 * Math.PI * r; return h('div', { 'class': 'ring', html: '<svg viewBox="0 0 80 80" width="84" height="84" role="img" aria-label="' + pc + ' percent complete"><circle cx="40" cy="40" r="' + r + '" fill="none" stroke="#1a2440" stroke-width="9"/><circle cx="40" cy="40" r="' + r + '" fill="none" stroke="#29A99E" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + (c * pc / 100) + ' ' + c + '" stroke-opacity="' + (pc ? 1 : 0) + '" transform="rotate(-90 40 40)"/><text x="40" y="46" text-anchor="middle" fill="#E4C173" font-size="18" font-weight="900">' + pc + '%</text></svg>' }); }

  function modTabs(m, cur) {
    var t = [['', 'Overview'], ['l/' + m.lessons[0].num, 'Lessons'], ['words', 'Words'], ['lab', 'Lab'], ['build', 'Build'], ['quiz', 'Quiz']];
    return h('nav', { 'class': 'tabs noprint', 'aria-label': 'Module ' + m.n + ' sections' }, t.map(function (x) { var on = x[0] === cur || (cur === 'l' && x[0].slice(0, 2) === 'l/'); return h('a', { href: '#/m/' + m.n + (x[0] ? '/' + x[0] : ''), 'class': on ? 'on' : '', 'aria-current': on ? 'page' : null, text: x[1] }); }));
  }
  function modShell(m, cur, kids) {
    var wr = h('div', { 'class': 'wrap' }, [crumbs([['#/', 'Home'], ['#/m/' + m.n, 'Module ' + m.n + ': ' + m.title]].concat(cur ? [[null, ({ l: 'Lessons', words: 'Words', lab: 'Lab', build: 'Build Project', quiz: 'Quiz' })[cur]]] : []))].concat(kids));
    return [h('img', { 'class': 'banner', src: D.img['m' + m.n], alt: '', width: '900', height: '375' }), modTabs(m, cur), wr];
  }
  function nextPart(m, cur) {
    var order = ['l', 'words', 'lab', 'build', 'quiz'], i = order.indexOf(cur), nx = order[i + 1];
    if (!nx) return m.n < 8 ? btnLink('#/m/' + (m.n + 1), 'Start Module ' + (m.n + 1) + ' →') : btnLink('#/final', 'Go to the Final Exam →');
    return btnLink('#/m/' + m.n + '/' + nx, 'Next: ' + ({ words: 'Words', lab: 'Lab', build: 'Build Project', quiz: 'Quiz' })[nx] + ' →');
  }

  function modOverview(p, m) {
    var x = parts(p, m.n), k = [];
    k.push(h('div', { 'class': 'kicker', text: 'Module ' + m.n + ' of 8 · ' + m.tag }), h('h1', { text: m.title }));
    var vid = h('video', { 'class': 'mvideo', controls: true, preload: 'metadata', playsinline: true, src: D.video[m.n], poster: D.img['m' + m.n] });
    vid.addEventListener('play', function () { if (player) player.pause(); });
    k.push(h('div', { 'class': 'vwrap' }, [h('div', { 'class': 'kicker', text: '🎬 Module ' + m.n + ' video' }), vid]));
    k.push(h('div', { 'class': 'row' }, [listenBtn('m' + m.n, 'Mia')]), h('p', { text: m.intro }));
    k.push(h('h3', { text: 'By the end of this module, you will be able to:' }), h('ul', { 'class': 'dots' }, m.objs.map(function (o) { return h('li', { text: o }); })));
    if (D.diag[m.n]) k.push(h('div', { 'class': 'diagram', html: D.diag[m.n] }));
    k.push(h('h3', { text: 'Your checklist' }));
    var items = m.lessons.map(function (l) { return ['#/m/' + m.n + '/l/' + l.num, 'Lesson ' + l.num + ' — ' + l.title, !!p.done[l.num]]; })
      .concat([['#/m/' + m.n + '/words', 'Key vocabulary: flashcards + Match It', x.words], ['#/m/' + m.n + '/lab', 'Interactive Lab', x.lab], ['#/m/' + m.n + '/build', 'Build Simulation: ' + m.build.title, x.build], ['#/m/' + m.n + '/quiz', 'Module ' + m.n + ' Quiz (8 questions)', x.quiz]]);
    k.push(h('ul', { 'class': 'checklist' }, items.map(function (it) { return h('li', { 'class': it[2] ? 'ok' : '' }, [h('a', { href: it[0] }, [h('span', { 'class': 'tick', text: it[2] ? '✓' : '○' }), it[1]])]); })));
    var nx = nextStep(p);
    k.push(h('div', { 'class': 'row' }, [btnLink(nx.href.indexOf('#/m/' + m.n + '/') === 0 ? nx.href : '#/m/' + m.n + '/l/' + m.lessons[0].num, stamp(p, m.n) ? 'Review this module' : 'Continue →')]));
    return modShell(m, '', k);
  }

  function lessonView(p, m, num) {
    var idx = m.lessons.map(function (l) { return l.num; }).indexOf(num); if (idx < 0) idx = 0; var l = m.lessons[idx];
    var k = [h('div', { 'class': 'kicker', text: 'Lesson ' + l.num + ' · ' + (idx + 1) + ' of ' + m.lessons.length }), h('h1', { text: l.title })];
    var lv = D.lvid[l.num];
    if (lv) { var v = h('video', { 'class': 'mvideo', controls: true, preload: 'metadata', playsinline: true, src: lv.src, poster: lv.poster }); v.addEventListener('play', function () { if (player) player.pause(); }); k.push(h('div', { 'class': 'vwrap' }, [h('div', { 'class': 'kicker', text: '🎬 Watch with Mia, Malik & Nana' }), v])); }
    k.push(h('div', { 'class': 'row' }, [listenBtn(l.num, 'Mia')]));
    l.paras.forEach(function (t) { k.push(/^safety/i.test(t) ? h('div', { 'class': 'safety', text: t }) : h('p', { 'class': 'read', text: t })); });
    if (l.try) {
      var ta = h('textarea', { rows: '4', placeholder: 'What did you do? What did you notice? Draw it on paper too!', 'aria-label': 'My TRY IT notes for lesson ' + l.num });
      ta.value = p.tryit[l.num] || ''; var st = h('span', { 'class': 'muted saved', 'aria-live': 'polite' });
      ta.addEventListener('input', function () { p.tryit[l.num] = ta.value; save(); st.textContent = 'Saved ✓'; });
      k.push(h('div', { 'class': 'try' }, [h('div', { 'class': 'row' }, [h('b', { text: 'TRY IT' }), speakBtn(l.try, 'Try it')]), h('p', { text: l.try }), h('label', { 'class': 'lbl', text: 'My TRY IT notes' }), ta, st]));
    }
    var done = !!p.done[l.num];
    k.push(h('div', { 'class': 'row' }, [h('button', { type: 'button', 'class': done ? 'b-teal' : 'b-gold', onclick: function () { if (p.done[l.num]) delete p.done[l.num]; else p.done[l.num] = today(); p.last = location.hash; saveNow(); if (p.done[l.num]) { toast('Lesson ' + l.num + ' done! ⭐'); go(idx < m.lessons.length - 1 ? '#/m/' + m.n + '/l/' + m.lessons[idx + 1].num : '#/m/' + m.n + '/words'); } else render(); } }, [done ? '✓ Lesson done (tap to undo)' : 'I finished this lesson ✓'])]));
    k.push(h('div', { 'class': 'pager noprint' }, [idx > 0 ? btnLink('#/m/' + m.n + '/l/' + m.lessons[idx - 1].num, '← Lesson ' + m.lessons[idx - 1].num, 'b-dim') : btnLink('#/m/' + m.n, '← Overview', 'b-dim'),
      idx < m.lessons.length - 1 ? btnLink('#/m/' + m.n + '/l/' + m.lessons[idx + 1].num, 'Lesson ' + m.lessons[idx + 1].num + ' →', 'b-ghost') : btnLink('#/m/' + m.n + '/words', 'Next: Words →', 'b-ghost')]));
    return modShell(m, 'l', k);
  }

  function wordsView(p, m) {
    var V = D.vocab[m.n], k = [h('h1', { text: 'Key vocabulary' }), h('p', { 'class': 'muted', text: 'Tap a card to flip it. Can you say the meaning before you flip?' })];
    var v = h('div', { 'class': 'vocab' });
    V.forEach(function (w) { var b = h('button', { 'class': 'flip', type: 'button', 'aria-label': w[0] + '. Tap to flip.' }, [h('div', { 'class': 'fi' }, [h('div', { 'class': 'fa', text: w[0] }), h('div', { 'class': 'fb', text: w[1] })])]); b.addEventListener('click', function () { b.classList.toggle('f'); if (canSpeak && b.classList.contains('f')) { try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(w[0] + '. ' + w[1])); } catch (e) {} } }); v.appendChild(b); });
    k.push(v);
    // Match It game
    k.push(h('h2', { text: 'Match It!', style: 'margin-top:22px' }), h('p', { 'class': 'muted', text: 'Tap a word, then tap its meaning. Match all ' + V.length + ' to finish this page.' }));
    var game = h('div', { 'class': 'match' }), msg = h('div', { 'class': 'calc', 'aria-live': 'polite' }), sel = null, got = 0, miss = 0;
    var left = h('div', { 'class': 'col' }), right = h('div', { 'class': 'col' });
    shuffle(V.map(function (w, i) { return i; })).forEach(function (i) { left.appendChild(h('button', { type: 'button', 'class': 'mw', 'data-i': i, text: V[i][0], onclick: function (e) { Array.prototype.forEach.call(left.children, function (c) { c.classList.remove('sel'); }); if (e.currentTarget.classList.contains('ok')) return; e.currentTarget.classList.add('sel'); sel = i; } })); });
    shuffle(V.map(function (w, i) { return i; })).forEach(function (i) { right.appendChild(h('button', { type: 'button', 'class': 'md', 'data-i': i, text: V[i][1], onclick: function (e) {
      var b = e.currentTarget; if (sel == null || b.classList.contains('ok')) return;
      var wb = left.querySelector('[data-i="' + sel + '"]');
      if (sel === i) { b.classList.add('ok'); wb.classList.add('ok'); wb.classList.remove('sel'); got++; sel = null; fb(msg, true, 'Match! ' + got + ' of ' + V.length);
        if (got === V.length) { var stars = miss === 0 ? 3 : miss <= 2 ? 2 : 1; p.words[m.n] = Math.max(p.words[m.n] || 0, stars); saveNow(); fb(msg, true, 'All matched! ' + '⭐'.repeat(stars) + (miss ? ' (' + miss + ' tries to fix)' : ' Perfect!')); toast('Words complete! ⭐'); } }
      else { miss++; b.classList.add('no'); setTimeout(function () { b.classList.remove('no'); }, 600); fb(msg, false, 'Not that one — try again.'); }
    } })); });
    game.appendChild(left); game.appendChild(right); k.push(game, msg);
    if (p.words[m.n]) k.push(h('p', { 'class': 'muted', text: 'Best: ' + '⭐'.repeat(p.words[m.n]) }));
    k.push(h('div', { 'class': 'row' }, [nextPart(m, 'words')]));
    return modShell(m, 'words', k);
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  var LABS = window.STEM_LABS ? window.STEM_LABS(h, fb, esc) : {};
  function labView(p, m) {
    var lab = h('div', { 'class': 'lab' }), k = [h('h1', { text: 'Interactive Lab' }), lab];
    try { LABS[m.n](lab); } catch (e) { lab.appendChild(h('p', { text: 'This lab could not start on this device.' })); }
    var d = !!p.labs[m.n];
    k.push(h('div', { 'class': 'row' }, [h('button', { type: 'button', 'class': d ? 'b-teal' : 'b-gold', onclick: function () { p.labs[m.n] = d ? 0 : today(); if (!p.labs[m.n]) delete p.labs[m.n]; saveNow(); if (!d) toast('Lab explored! 🔬'); render(); } }, [d ? '✓ Lab explored' : 'I explored this lab ✓']), nextPart(m, 'lab')]));
    return modShell(m, 'lab', k);
  }

  var BUILDS = window.STEM_BUILDS ? window.STEM_BUILDS({ h: h, esc: esc }) : {};
  function buildView(p, m) {
    var b = m.build, st = p.build[m.n] = p.build[m.n] || {}; st.mat = st.mat || {}; st.step = st.step || {}; st.think = st.think || {}; st.tool = st.tool || {}; st.self = st.self || {};
    var k = [h('div', { 'class': 'kicker', text: '🔧 Build Simulation ' + m.n }), h('h1', { text: b.title }), h('div', { 'class': 'mission' }, [h('b', { text: 'THE MISSION. ' }), b.mission, speakBtn(b.mission, 'Mission')])];
    k.push(h('h3', { text: 'Materials — check them off as you gather' }));
    k.push(h('div', { 'class': 'checks' }, b.materials.map(function (x, i) { var cb = h('input', { type: 'checkbox' }); cb.checked = !!st.mat[i]; cb.addEventListener('change', function () { st.mat[i] = cb.checked; save(); }); return h('label', { 'class': 'chk' }, [cb, ' ' + x]); })));
    k.push(h('h3', { text: 'Steps' }));
    k.push(h('ol', { 'class': 'steps' }, b.steps.map(function (x, i) { var cb = h('input', { type: 'checkbox', 'aria-label': 'Step ' + (i + 1) + ' done' }); cb.checked = !!st.step[i]; cb.addEventListener('change', function () { st.step[i] = cb.checked; save(); });
      return h('li', {}, [/^safety/i.test(x) ? h('div', { 'class': 'safety' }, [h('label', { 'class': 'chk' }, [cb, ' ' + x])]) : h('label', { 'class': 'chk' }, [cb, ' ' + x])]); })));
    var tool = h('div', { 'class': 'lab tool' });
    k.push(h('h3', { text: 'My data' }), tool);
    try { BUILDS[m.n](tool, st.tool, save); } catch (e) { tool.appendChild(h('p', { text: 'The data tool could not start on this device.' })); }
    k.push(h('h3', { text: 'Think about it' }));
    b.think.forEach(function (q, i) { var ta = h('textarea', { rows: '2', 'aria-label': q }); ta.value = st.think[i] || ''; ta.addEventListener('input', function () { st.think[i] = ta.value; save(); }); k.push(h('div', { 'class': 'think' }, [h('div', { 'class': 'row' }, [h('b', { text: q }), speakBtn(q)]), ta])); });
    k.push(h('h3', { text: 'My conclusion' }));
    var cc = h('textarea', { rows: '3', placeholder: 'Write it like a real scientist or engineer: what you found, and the evidence that proves it.', 'aria-label': 'My conclusion' }); cc.value = st.concl || ''; cc.addEventListener('input', function () { st.concl = cc.value; save(); }); k.push(cc);
    k.push(h('div', { 'class': 'try' }, [h('b', { text: 'THE SCIENCE BEHIND IT. ' }), b.science]));
    // photo
    var ph = h('div', { 'class': 'photo' }); function drawPhoto() { ph.innerHTML = ''; if (st.photo) { ph.appendChild(h('img', { src: st.photo, alt: 'Photo of my build' })); ph.appendChild(h('button', { type: 'button', 'class': 'b-dim sm', onclick: function () { delete st.photo; saveNow(); drawPhoto(); } }, ['Remove photo'])); } }
    var fi = h('input', { type: 'file', accept: 'image/*', 'aria-label': 'Add a photo of my build' });
    fi.addEventListener('change', function () { var f = fi.files && fi.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { var im = new Image(); im.onload = function () { var s = Math.min(1, 640 / Math.max(im.width, im.height)); var cv = document.createElement('canvas'); cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); st.photo = cv.toDataURL('image/jpeg', 0.7); saveNow(); drawPhoto(); }; im.src = rd.result; }; rd.readAsDataURL(f); });
    k.push(h('h3', { text: 'Photo of my build (optional)' }), h('div', { 'class': 'row' }, [fi]), ph); drawPhoto();
    // self-check rubric (from the Teacher's Edition rubric)
    var fm = D.fac.mods[m.n];
    if (fm && fm.rubric) {
      k.push(h('h3', { text: 'Score my own work' }), h('p', { 'class': 'muted', text: 'Be honest — this is how real engineers improve. Your teacher can score it too.' }));
      fm.rubric.forEach(function (row, ri) {
        var g = h('div', { 'class': 'rub', role: 'radiogroup', 'aria-label': row[0] });
        D.fac.levels.forEach(function (lv, li) { g.appendChild(h('button', { type: 'button', role: 'radio', 'aria-checked': st.self[ri] === li ? 'true' : 'false', 'class': st.self[ri] === li ? 'on' : '', title: row[li + 1], onclick: function () { st.self[ri] = li; saveNow(); render(); } }, [h('b', { text: lv }), h('span', { text: row[li + 1] })])); });
        k.push(h('div', { 'class': 'rubrow' }, [h('div', { 'class': 'lbl', text: row[0] }), g]));
      });
    }
    var done = !!st.done;
    k.push(h('div', { 'class': 'row' }, [h('button', { type: 'button', 'class': done ? 'b-teal' : 'b-gold', onclick: function () { if (st.done) delete st.done; else st.done = today(); saveNow(); if (st.done) toast('Build Project complete! 🔧'); render(); } }, [done ? '✓ Build complete (tap to undo)' : 'My build is complete ✓']), nextPart(m, 'build')]));
    return modShell(m, 'build', k);
  }

  function quiz(wr, qs, title, passAt, onScore, nextFn) {
    var ans = {};
    wr.appendChild(h('p', { 'class': 'muted', text: 'Pick one answer for each question, then tap Check My Answers. ' + passAt + ' of ' + qs.length + ' passes. Try as many times as you like — every scientist learns from mistakes!' }));
    var order = qs.map(function (q, i) { return { q: q, i: i, o: shuffle(q[1].map(function (t, k) { return { t: t, k: k }; })) }; });
    var bar = h('div', { 'class': 'bar wide' }, [h('i', { style: 'width:0%' })]), cnt = h('span', { 'class': 'muted', text: '0 of ' + qs.length + ' answered' });
    wr.appendChild(h('div', { 'class': 'qprog' }, [bar, cnt]));
    function prog() { var n = Object.keys(ans).length; bar.firstChild.style.width = (100 * n / qs.length) + '%'; cnt.textContent = n + ' of ' + qs.length + ' answered'; }
    order.forEach(function (it, idx) {
      var qd = h('fieldset', { 'class': 'q' }); qd.appendChild(h('legend', {}, [h('b', { text: (idx + 1) + '. ' }), it.q[0], speakBtn(it.q[0] + '. ' + it.o.map(function (o, j) { return 'Choice ' + (j + 1) + ': ' + o.t; }).join('. '), 'question ' + (idx + 1))]));
      var op = h('div', { 'class': 'opts', role: 'radiogroup' });
      it.o.forEach(function (o) { var b = h('button', { type: 'button', role: 'radio', 'aria-checked': 'false' }, [o.t]); b._k = o.k;
        b.addEventListener('click', function () { if (it.locked) return; ans[it.i] = o.k; Array.prototype.forEach.call(op.children, function (c) { c.classList.remove('sel'); c.setAttribute('aria-checked', 'false'); }); b.classList.add('sel'); b.setAttribute('aria-checked', 'true'); prog(); });
        op.appendChild(b); });
      qd.appendChild(op); it.el = qd; it.op = op; wr.appendChild(qd);
    });
    var res = h('div', { 'aria-live': 'polite' }), chk = h('button', { 'class': 'b-gold big', type: 'button' }, ['Check My Answers']);
    chk.addEventListener('click', function () {
      var miss = order.filter(function (it) { return ans[it.i] === undefined; });
      if (miss.length) { res.innerHTML = '<div class="card"><div class="in"><span class="fb-no">You still have ' + miss.length + ' question' + (miss.length > 1 ? 's' : '') + ' to answer.</span></div></div>'; try { miss[0].el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} return; }
      var sc = 0; order.forEach(function (it) { it.locked = true; var right = it.q[2]; if (ans[it.i] === right) sc++;
        Array.prototype.forEach.call(it.op.children, function (c) { if (c._k === right) c.classList.add('right'); else if (c._k === ans[it.i]) c.classList.add('wrong'); });
        it.el.appendChild(h('div', { 'class': 'why', html: (ans[it.i] === right ? '<span class="fb-ok">Correct!</span> ' : '<span class="fb-no">Not quite.</span> ') + esc(it.q[3]) })); });
      onScore(sc); var pass = sc >= passAt; chk.style.display = 'none';
      res.innerHTML = ''; res.appendChild(h('div', { 'class': 'card result' + (pass ? ' pass' : '') }, [h('div', { 'class': 'in' }, [h('h2', { text: 'You scored ' + sc + ' out of ' + qs.length }),
        h('p', { text: pass ? 'Amazing work — you passed! 🎉' : 'Good effort! Read the explanations, review the lessons, and try again.' }),
        h('div', { 'class': 'row' }, [h('button', { 'class': 'b-ghost', type: 'button', onclick: function () { render(); window.scrollTo(0, 0); } }, ['Try again']), pass && nextFn ? nextFn() : null])])]));
      if (pass) confetti();
      try { res.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    });
    wr.appendChild(chk); wr.appendChild(res);
  }
  function quizView(p, m) {
    var k = [h('h1', { text: 'Module ' + m.n + ' Quiz' })], q = p.quiz[m.n];
    if (q) k.push(h('p', { 'class': 'muted', text: 'Best score: ' + q.best + ' / 8' + (q.att && q.att.length ? ' · ' + q.att.length + ' tr' + (q.att.length > 1 ? 'ies' : 'y') : '') }));
    var box = h('div'); k.push(box);
    quiz(box, D.quiz[m.n], 'Module ' + m.n + ' Quiz', 6, function (sc) { var r = p.quiz[m.n] = p.quiz[m.n] || { best: 0, att: [] }; r.att = r.att || []; r.best = Math.max(r.best, sc); r.att.push({ s: sc, d: today() }); saveNow(); }, function () { return nextPart(m, 'quiz'); });
    return modShell(m, 'quiz', k);
  }

  function finalView(p) {
    var w = h('div', { 'class': 'wrap' }), passed = MODS.filter(function (m) { return quizPass(p, m.n); }).length;
    w.appendChild(h('div', { 'class': 'kicker', text: 'The Big Test' })); w.appendChild(h('h1', { text: 'Final Exam' }));
    w.appendChild(h('p', { text: '24 questions from all 8 modules, 1 point each. Score 22 or more (90%) to earn the STEM Master title, certificate and badge. Tip: pass the module quizzes first — you have passed ' + passed + ' of 8.' }));
    if (p.final && p.final.pass) w.appendChild(h('div', { 'class': 'card result pass' }, [h('div', { 'class': 'in' }, [h('h3', { text: '🏆 You are a STEM Master! Best score ' + p.final.best + ' / 24' }), h('div', { 'class': 'row' }, [btnLink('#/cert', 'See my certificate →')])])]));
    else if (p.final) w.appendChild(h('p', { 'class': 'muted', text: 'Best so far: ' + p.final.best + ' / 24.' }));
    quiz(w, D.final, 'Final Exam', 22, function (sc) { var f = p.final || { best: 0, pass: false, att: [] }; f.att = f.att || []; f.att.push({ s: sc, d: today() }); if (sc >= f.best) { f.best = sc; f.date = today(); } if (sc >= 22) { f.pass = true; f.date = f.date || today(); } p.final = f; saveNow(); }, function () { return btnLink('#/cert', 'See my certificate →'); });
    return [w];
  }

  function certView(p) {
    var w = h('div', { 'class': 'wrap' });
    if (!(p.final && p.final.pass)) { w.appendChild(h('h1', { text: 'Your certificate is waiting' })); w.appendChild(h('p', { text: 'Score 22 or more on the Final Exam to unlock your STEM Master certificate and badge.' })); w.appendChild(btnLink('#/final', 'Go to the Final Exam →')); return [w]; }
    var nm = h('input', { type: 'text', maxlength: '40', value: p.name, 'aria-label': 'Name on the certificate' }), c = h('div', { 'class': 'cert printable' });
    function draw() { c.innerHTML = '<img src="' + esc(D.img.badge) + '" alt="STEM Master badge" style="width:140px;height:140px;margin:0 auto 8px;display:block"><div style="letter-spacing:.2em;font-size:12px;font-weight:900;color:#7a5a12">THE LEGACY BLUEPRINT</div><h2>Certificate of STEM Mastery</h2><p>This certifies that</p><div class="nm">' + esc(p.name) + '</div><p>completed the 8 modules of the Master STEM Course — science, forces, measurement, architecture, engineering, energy, code, and the living body — and passed the final exam with a score of <b>' + p.final.best + ' / 24</b>.</p><p style="font-size:14px">' + esc(p.final.date || '') + '</p><p style="font-size:11px;letter-spacing:.12em;font-weight:800;color:#7a5a12;margin:14px 0 0">' + esc(D.footer) + '</p>'; }
    nm.addEventListener('input', function () { p.name = nm.value.slice(0, 40) || p.name; save(); draw(); });
    w.appendChild(h('div', { 'class': 'card noprint' }, [h('div', { 'class': 'in' }, [h('h2', { text: '🏆 You are a STEM Master!' }), h('p', { text: 'Check your name, then print your certificate or download your badge.' }),
      h('div', { 'class': 'row' }, [nm, h('button', { 'class': 'b-gold', type: 'button', onclick: function () { printNow('cert'); } }, ['Print certificate']), h('button', { 'class': 'b-teal', type: 'button', onclick: function () { badge(p); } }, ['Download my badge'])])])]));
    w.appendChild(c); draw(); return [w];
  }
  var CRCT = null; function crc32(b) { if (!CRCT) { CRCT = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRCT[n] = c >>> 0; } } var c2 = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c2 = CRCT[(c2 ^ b[i]) & 255] ^ (c2 >>> 8); return (c2 ^ 0xFFFFFFFF) >>> 0; }
  function pngWithText(buf, key, text) { var u = new Uint8Array(buf), enc = new TextEncoder(), kb = enc.encode(key), tb = enc.encode(text), data = new Uint8Array(kb.length + 5 + tb.length); data.set(kb, 0); data.set(tb, kb.length + 5);
    var type = enc.encode('iTXt'), chunk = new Uint8Array(12 + data.length), dv = new DataView(chunk.buffer); dv.setUint32(0, data.length); chunk.set(type, 4); chunk.set(data, 8); var cb = new Uint8Array(4 + data.length); cb.set(type, 0); cb.set(data, 4); dv.setUint32(8 + data.length, crc32(cb));
    var iend = u.length - 12, out = new Uint8Array(u.length + chunk.length); out.set(u.subarray(0, iend), 0); out.set(chunk, iend); out.set(u.subarray(iend), iend + chunk.length); return out; }
  function badge(p) {
    var img = new Image(); img.onload = function () { try {
      var cv = document.createElement('canvas'); cv.width = 900; cv.height = 1150; var x = cv.getContext('2d');
      x.fillStyle = '#0A1428'; x.fillRect(0, 0, 900, 1150); x.strokeStyle = '#C9A24B'; x.lineWidth = 10; x.strokeRect(20, 20, 860, 1110);
      x.drawImage(img, 150, 60, 600, 600); x.textAlign = 'center'; x.fillStyle = '#E4C173'; x.font = 'bold 30px Georgia, serif'; x.fillText('AWARDED TO', 450, 720);
      x.fillStyle = '#ECE7DA'; x.font = 'bold 54px Georgia, serif'; x.fillText(p.name.slice(0, 28), 450, 790);
      x.fillStyle = '#29A99E'; x.font = 'bold 28px sans-serif'; x.fillText('STEM MASTER · Master STEM Course', 450, 860);
      x.fillStyle = '#ECE7DA'; x.font = '26px sans-serif'; x.fillText('Final exam score: ' + p.final.best + ' / 24   ·   ' + (p.final.date || ''), 450, 910);
      x.fillStyle = '#C9A24B'; x.font = 'bold 20px sans-serif'; x.fillText('HANNIBAL MANSA PHALANX · THE LEGACY BLUEPRINT', 450, 1040); x.fillText('267-633-5716', 450, 1072);
      var award = { award: 'STEM Master', course: 'Master STEM Course', recipient: p.name, finalExamScore: p.final.best + '/24', passMark: '22/24 (90%)', date: p.final.date || '', issuer: 'Hannibal Mansa Phalanx · The Legacy Blueprint', contact: '267-633-5716' };
      cv.toBlob(function (bl) { bl.arrayBuffer().then(function (ab) { var url = URL.createObjectURL(new Blob([pngWithText(ab, 'award', JSON.stringify(award))], { type: 'image/png' })); var a = h('a', { href: url, download: 'STEM-Master-Badge-' + p.name.replace(/[^A-Za-z0-9]+/g, '-') + '.png' }); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 2000); }); }, 'image/png');
    } catch (e) { alert('Sorry, the badge could not be made on this device. You can still print your certificate.'); } };
    img.onerror = function () { alert('The badge picture could not load. Check your connection and try again.'); }; img.src = D.img.badge;
  }

  /* My Workbook — scorebook + every answer, printable */
  function workbookDoc(p, teacherView) {
    var d = h('div', { 'class': 'book printable' });
    d.appendChild(h('div', { 'class': 'bookhead' }, [h('div', {}, [h('div', { 'class': 'kicker', text: 'Master STEM Course · Student Workbook' }), h('h1', { text: p.avatar + ' ' + p.name }), h('p', { 'class': 'muted', text: 'Started ' + (p.created || '') + ' · Printed ' + today() })]), ring(overall(p))]));
    var rows = MODS.map(function (m) { var x = parts(p, m.n), q = p.quiz[m.n]; return '<tr><td>' + m.n + '. ' + esc(m.title) + '</td><td>' + x.lessons + '/' + x.lessonsT + '</td><td>' + (x.words ? '✓' : '—') + '</td><td>' + (x.lab ? '✓' : '—') + '</td><td>' + (x.build ? '✓' : '—') + '</td><td><b>' + (q ? q.best : '—') + '</b>/8</td><td>' + (stamp(p, m.n) ? '★' : '') + '</td></tr>'; }).join('');
    d.appendChild(h('h2', { text: 'Scorebook' }));
    d.appendChild(h('div', { 'class': 'tscroll', html: '<table class="dt score"><thead><tr><th>Module</th><th>Lessons</th><th>Words</th><th>Lab</th><th>Build</th><th>Quiz</th><th>Stamp</th></tr></thead><tbody>' + rows +
      '<tr class="tot"><td>Module quizzes total</td><td colspan="4"></td><td><b>' + quizTotal(p) + '</b>/64</td><td></td></tr><tr class="tot"><td>Final exam</td><td colspan="4">' + (p.final && p.final.pass ? 'STEM Master ★' : 'Pass mark 22/24') + '</td><td><b>' + (p.final ? p.final.best : '—') + '</b>/24</td><td></td></tr><tr class="tot"><td>Course total</td><td colspan="4"></td><td><b>' + (quizTotal(p) + (p.final ? p.final.best : 0)) + '</b>/88</td><td>' + Math.round(100 * (quizTotal(p) + (p.final ? p.final.best : 0)) / 88) + '%</td></tr></tbody></table>' }));
    MODS.forEach(function (m) {
      var sec = h('section', { 'class': 'bmod' }, [h('h2', { text: 'Module ' + m.n + ': ' + m.title })]), any = false;
      m.lessons.forEach(function (l) { if (p.tryit[l.num]) { any = true; sec.appendChild(h('div', { 'class': 'ans' }, [h('b', { text: 'TRY IT ' + l.num + ' — ' + l.title }), h('p', { text: p.tryit[l.num] })])); } });
      var b = p.build[m.n];
      if (b) {
        var lines = BUILDS.summary ? BUILDS.summary(m.n, b.tool) : [];
        var blk = h('div', { 'class': 'ans' }, [h('b', { text: 'Build: ' + m.build.title + (b.done ? ' ✓' : '') })]);
        if (lines.length) { any = true; blk.appendChild(h('pre', { text: lines.join('\n') })); }
        m.build.think.forEach(function (q, i) { if (b.think && b.think[i]) { any = true; blk.appendChild(h('p', { html: '<i>' + esc(q) + '</i><br>' + esc(b.think[i]) })); } });
        if (b.concl) { any = true; blk.appendChild(h('p', { html: '<i>My conclusion</i><br>' + esc(b.concl) })); }
        if (b.photo) { any = true; blk.appendChild(h('img', { src: b.photo, alt: 'Build photo', 'class': 'bphoto' })); }
        var fm = D.fac.mods[m.n], tr = (DB.teacher.rubric[p.id] || {})[m.n] || {};
        if (fm && fm.rubric && (b.self && Object.keys(b.self).length || Object.keys(tr).length)) { any = true; blk.appendChild(h('p', { html: fm.rubric.map(function (r, ri) { return '<b>' + esc(r[0]) + ':</b> self ' + esc(b.self && b.self[ri] != null ? D.fac.levels[b.self[ri]] : '—') + (tr[ri] != null ? ' · teacher ' + esc(D.fac.levels[tr[ri]]) : ''); }).join('<br>') })); }
        sec.appendChild(blk);
      }
      if (teacherView && DB.teacher.notes[p.id] && DB.teacher.notes[p.id][m.n]) { any = true; sec.appendChild(h('div', { 'class': 'ans tnote' }, [h('b', { text: 'Teacher note' }), h('p', { text: DB.teacher.notes[p.id][m.n] })])); }
      if (!any) sec.appendChild(h('p', { 'class': 'muted', text: 'No written work yet.' }));
      d.appendChild(sec);
    });
    d.appendChild(h('p', { 'class': 'pfoot', text: D.footer }));
    return d;
  }
  function bookView(p) {
    var w = h('div', { 'class': 'wrap' });
    w.appendChild(h('div', { 'class': 'noprint' }, [h('h1', { text: 'My Workbook' }), h('p', { 'class': 'muted', text: 'Every answer, data table and score you have saved. Print it, save it as a PDF, or send it to your teacher.' }),
      h('div', { 'class': 'row' }, [h('button', { type: 'button', 'class': 'b-gold', onclick: function () { printNow('book'); } }, ['🖨 Print / Save as PDF']), h('button', { type: 'button', 'class': 'b-teal', onclick: function () { exportLearner(p); } }, ['📤 Send my work to my teacher']), btnLink('#/settings', 'Backup & settings', 'b-ghost')])]));
    w.appendChild(workbookDoc(p, false)); return [w];
  }
  function exportLearner(p) { download('STEM-Workbook-' + p.name.replace(/[^A-Za-z0-9]+/g, '-') + '-' + today() + '.json', JSON.stringify({ type: 'hmp-stem-learner', v: 2, exported: new Date().toISOString(), profile: p })); toast('Saved a file. Email or upload it to your teacher.'); }
  function printNow(kind) { document.body.setAttribute('data-print', kind); setTimeout(function () { window.print(); }, 50); }
  window.addEventListener('afterprint', function () { document.body.removeAttribute('data-print'); });

  function glossView() {
    var w = h('div', { 'class': 'wrap' }, [h('h1', { text: 'STEM Glossary' }), h('p', { 'class': 'muted', text: 'Every big word from the course, A to Z.' })]);
    var all = [], seen = {}; Object.keys(D.vocab).forEach(function (k) { D.vocab[k].forEach(function (p) { all.push(p.concat([k])); }); }); D.xgloss.forEach(function (p) { all.push(p); });
    all = all.filter(function (p) { if (seen[p[0]]) return false; seen[p[0]] = 1; return true; }).sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
    var q = h('input', { type: 'search', placeholder: 'Search a word…', 'aria-label': 'Search the glossary' }), g = h('div', { 'class': 'gl' });
    function draw() { var s = q.value.trim().toLowerCase(); g.innerHTML = ''; all.forEach(function (p) { if (s && (p[0] + ' ' + p[1]).toLowerCase().indexOf(s) < 0) return; g.appendChild(h('div', {}, [h('b', { text: p[0] }), ' — ' + p[1] + ' ', p[2] ? h('a', { href: '#/m/' + p[2] + '/words', 'class': 'muted', text: '(Module ' + p[2] + ')' }) : null, speakBtn(p[0] + '. ' + p[1])])); }); if (!g.children.length) g.appendChild(h('p', { 'class': 'muted', text: 'No match.' })); }
    q.addEventListener('input', draw); w.appendChild(h('div', { 'class': 'row' }, [q])); w.appendChild(g); draw(); return [w];
  }

  function settingsView(p) {
    var w = h('div', { 'class': 'wrap' }, [h('h1', { text: 'Settings & backup' })]);
    if (p) {
      var nm = h('input', { type: 'text', maxlength: '40', value: p.name, 'aria-label': 'Learner name' });
      nm.addEventListener('change', function () { if (nm.value.trim()) { p.name = nm.value.trim(); saveNow(); render(); } });
      var avs = h('div', { 'class': 'avs' }, AVATARS.map(function (a) { return h('button', { type: 'button', 'class': p.avatar === a ? 'on' : '', text: a, 'aria-label': 'Avatar ' + a, onclick: function () { p.avatar = a; saveNow(); render(); } }); }));
      w.appendChild(card('Learner', [h('div', { 'class': 'row' }, [h('span', { 'class': 'av big', text: p.avatar }), nm]), avs, h('div', { 'class': 'row' }, [btnLink('#/who', 'Switch or add a learner', 'b-ghost')])]));
    }
    function seg(label, key, opts) { return h('div', { 'class': 'row' }, [h('span', { 'class': 'lbl', text: label })].concat(opts.map(function (o) { return h('button', { type: 'button', 'class': DB.settings[key] === o[0] ? 'b-gold sm' : 'b-dim sm', onclick: function () { DB.settings[key] = o[0]; saveNow(); applySettings(); render(); } }, [o[1]]); }))); }
    w.appendChild(card('Reading & listening', [seg('Text size', 'size', [['s', 'A'], ['m', 'A+'], ['l', 'A++']]), seg('Narration speed', 'rate', [[0.85, 'Slower'], [1, 'Normal'], [1.15, 'Faster']]), seg('High contrast', 'contrast', [[false, 'Off'], [true, 'On']]),
      h('p', { 'class': 'muted', text: canSpeak ? 'Tap 🔊 next to any question, TRY IT or word to hear it read aloud.' : 'Read-aloud (🔊) is not available in this browser; the Listen with Mia narration still works.' })]));
    var file = h('input', { type: 'file', accept: 'application/json,.json', 'aria-label': 'Choose a backup file' });
    file.addEventListener('change', function () { var f = file.files && file.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { try { var o = JSON.parse(rd.result);
      if (o.type === 'hmp-stem-learner' && o.profile) { var id = o.profile.id || uid(); if (DB.profiles[id] && !confirm('Replace ' + DB.profiles[id].name + '’s saved work on this device with the backup?')) return; o.profile.id = id; DB.profiles[id] = o.profile; if (DB.order.indexOf(id) < 0) DB.order.push(id); DB.active = id; saveNow(); toast('Restored ' + o.profile.name + '’s workbook.'); go('#/'); }
      else if (o.type === 'hmp-stem-device' && o.db) { if (!confirm('Replace ALL learners on this device with this backup?')) return; DB = o.db; saveNow(); toast('Device backup restored.'); go('#/who'); }
      else alert('That file is not a STEM Master Course backup.'); } catch (e) { alert('That file could not be read.'); } }; rd.readAsText(f); });
    w.appendChild(card('Backup & move to another device', [h('p', { 'class': 'muted', text: 'Your work is saved in this browser on this device. Save a backup file to keep it safe or to continue on another device.' }),
      h('div', { 'class': 'row' }, [p ? h('button', { type: 'button', 'class': 'b-gold', onclick: function () { exportLearner(p); } }, ['Save ' + p.name + '’s backup']) : null, h('button', { type: 'button', 'class': 'b-ghost', onclick: function () { download('STEM-Course-All-Learners-' + today() + '.json', JSON.stringify({ type: 'hmp-stem-device', v: 2, db: DB })); } }, ['Save all learners'])]),
      h('label', { 'class': 'lbl', text: 'Restore a backup' }), file]));
    w.appendChild(card('Use it without internet', [h('p', { 'class': 'muted', text: 'Download the complete course (videos, narration and all) as one folder. Unzip it and open index.html in any browser.' }), h('a', { 'class': 'btn b-teal', href: 'STEM-Master-Course-Offline.zip', download: true, text: '⬇ Download offline copy (about 45 MB)' })]));
    if (p) w.appendChild(card('Start over', [h('button', { type: 'button', 'class': 'b-danger', onclick: function () { if (confirm('Delete ' + p.name + '’s workbook from this device? Save a backup first if you might want it later.')) { delete DB.profiles[p.id]; DB.order = DB.order.filter(function (x) { return x !== p.id; }); DB.active = DB.order[0] || null; saveNow(); go(DB.active ? '#/' : '#/who'); } } }, ['Delete this learner'])]));
    return [w];
  }
  function card(title, kids) { return h('div', { 'class': 'card' }, [h('div', { 'class': 'in' }, [h('h3', { text: title })].concat(kids))]); }
  function applySettings() { var el = document.getElementById('hmpc'); el.setAttribute('data-size', DB.settings.size || 'm'); el.classList.toggle('hc', !!DB.settings.contrast); }

  /* ---------- Teacher Hub ---------- */
  function teacherOK() { try { return sessionStorage.getItem('hmp-stem-teacher') === TEACHER_HASH; } catch (e) { return !!window._hmpT; } }
  function teacherView(r) {
    var w = h('div', { 'class': 'wrap' });
    if (!teacherOK()) {
      var code = h('input', { type: 'text', autocomplete: 'off', placeholder: 'Teacher access code', 'aria-label': 'Teacher access code' }), m = h('div', { 'aria-live': 'polite' });
      function tryCode() { if (fnv(code.value.trim().toUpperCase()) === TEACHER_HASH) { try { sessionStorage.setItem('hmp-stem-teacher', TEACHER_HASH); } catch (e) { window._hmpT = 1; } render(); } else fb(m, false, 'That code did not work. Use the code that came with your Teacher’s Edition.'); }
      code.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryCode(); });
      w.appendChild(h('h1', { text: 'Teacher & Grown-up Hub' }));
      w.appendChild(h('p', { text: 'For teachers, homeschool parents and group leaders: the facilitator guide, answer key, rubric grading, class gradebook and the Family STEM Night Kit.' }));
      w.appendChild(h('div', { 'class': 'row' }, [code, h('button', { type: 'button', 'class': 'b-gold', onclick: tryCode }, ['Unlock'])])); w.appendChild(m);
      w.appendChild(h('p', { 'class': 'muted', text: 'Your access code comes with the Teacher’s Edition and the Complete Bundle. Need it? Text 267-633-5716.' }));
      return [w];
    }
    var tab = r[1] || 'class';
    w.appendChild(h('h1', { text: 'Teacher Hub' }));
    w.appendChild(h('nav', { 'class': 'tabs inline noprint' }, [['class', 'Class & grading'], ['guide', 'Facilitator guide'], ['key', 'Answer key'], ['family', 'Family STEM Night']].map(function (t) { return h('a', { href: '#/teacher/' + t[0], 'class': tab === t[0] ? 'on' : '', text: t[1] }); }).concat([h('a', { href: '#/teacher', onclick: function () { try { sessionStorage.removeItem('hmp-stem-teacher'); } catch (e) {} window._hmpT = 0; }, text: 'Lock' })])));
    if (tab === 'class') tClass(w);
    else if (tab === 'learner') tLearner(w, r[2]);
    else if (tab === 'guide') tGuide(w, r[2]);
    else if (tab === 'key') tKey(w);
    else if (tab === 'family') tFamily(w, r[2]);
    return [w];
  }
  function allLearners() { var L = []; DB.order.forEach(function (id) { if (DB.profiles[id]) L.push({ p: DB.profiles[id], src: 'This device' }); }); Object.keys(DB.teacher.roster).forEach(function (id) { var x = DB.teacher.roster[id]; if (!DB.profiles[id]) L.push({ p: x.profile, src: 'Imported ' + x.date }); }); return L; }
  function findLearner(id) { return DB.profiles[id] || (DB.teacher.roster[id] && DB.teacher.roster[id].profile) || null; }
  function tClass(w) {
    var L = allLearners();
    var file = h('input', { type: 'file', accept: '.json,application/json', multiple: true, 'aria-label': 'Import learner workbook files' });
    file.addEventListener('change', function () { var fs = Array.prototype.slice.call(file.files || []), n = 0, bad = 0, left = fs.length;
      fs.forEach(function (f) { var rd = new FileReader(); rd.onload = function () { try { var o = JSON.parse(rd.result); if (o.type === 'hmp-stem-learner' && o.profile && o.profile.id) { DB.teacher.roster[o.profile.id] = { profile: o.profile, date: today() }; n++; } else bad++; } catch (e) { bad++; } if (--left === 0) { saveNow(); toast('Imported ' + n + ' workbook' + (n === 1 ? '' : 's') + (bad ? ', ' + bad + ' file(s) skipped' : '')); render(); } }; rd.readAsText(f); }); });
    w.appendChild(h('p', { 'class': 'muted', text: 'Learners on this device appear automatically. For a class on many devices, each student taps My Workbook › Send my work to my teacher, and you import the files here.' }));
    w.appendChild(h('div', { 'class': 'row' }, [h('label', { 'class': 'lbl', text: 'Import student files' }), file, h('button', { type: 'button', 'class': 'b-ghost', onclick: function () { exportCSV(L); } }, ['⬇ Gradebook (CSV)'])]));
    if (!L.length) { w.appendChild(h('p', { text: 'No learners yet.' })); return; }
    var head = '<tr><th>Learner</th><th>Lessons</th>' + MODS.map(function (m) { return '<th title="' + esc(m.title) + '">Q' + m.n + '</th>'; }).join('') + '<th>Quiz /64</th><th>Builds</th><th>Final /24</th><th>Overall</th><th></th></tr>';
    var body = L.map(function (x) { var p = x.p, lessons = Object.keys(p.done || {}).length, builds = MODS.filter(function (m) { return buildDone(p, m.n); }).length;
      return '<tr><td><b>' + esc(p.avatar + ' ' + p.name) + '</b><br><span class="muted">' + esc(x.src) + '</span></td><td>' + lessons + '/32</td>' + MODS.map(function (m) { var q = p.quiz[m.n]; return '<td class="' + (q ? (q.best >= 6 ? 'ok' : 'lo') : '') + '">' + (q ? q.best : '—') + '</td>'; }).join('') +
        '<td><b>' + quizTotal(p) + '</b></td><td>' + builds + '/8</td><td class="' + (p.final ? (p.final.pass ? 'ok' : 'lo') : '') + '">' + (p.final ? p.final.best + (p.final.pass ? ' ★' : '') : '—') + '</td><td>' + overall(p) + '%</td><td><a href="#/teacher/learner/' + esc(p.id) + '">Open →</a></td></tr>'; }).join('');
    w.appendChild(h('div', { 'class': 'tscroll', html: '<table class="dt grade"><thead>' + head + '</thead><tbody>' + body + '</tbody></table>' }));
    w.appendChild(h('p', { 'class': 'muted', text: 'Quizzes: 6 of 8 passes (teal). Final: 22 of 24 earns STEM Master (★). Build projects are scored with the 4-level rubric — open a learner to grade.' }));
  }
  function exportCSV(L) {
    var cols = ['Learner', 'Lessons done'].concat(MODS.map(function (m) { return 'Quiz ' + m.n; })).concat(['Quiz total /64', 'Builds done', 'Final /24', 'STEM Master', 'Overall %']);
    var lines = [cols.join(',')].concat(L.map(function (x) { var p = x.p; return ['"' + p.name.replace(/"/g, '""') + '"', Object.keys(p.done || {}).length].concat(MODS.map(function (m) { return p.quiz[m.n] ? p.quiz[m.n].best : ''; })).concat([quizTotal(p), MODS.filter(function (m) { return buildDone(p, m.n); }).length, p.final ? p.final.best : '', p.final && p.final.pass ? 'yes' : 'no', overall(p)]).join(','); }));
    download('STEM-Gradebook-' + today() + '.csv', lines.join('\n'), 'text/csv');
  }
  function tLearner(w, id) {
    var p = findLearner(id); if (!p) { w.appendChild(h('p', { text: 'Learner not found.' })); return; }
    w.appendChild(crumbs([['#/teacher/class', 'Class'], [null, p.name]]));
    w.appendChild(h('div', { 'class': 'row noprint' }, [h('button', { type: 'button', 'class': 'b-gold', onclick: function () { printNow('book'); } }, ['🖨 Print progress report']), DB.teacher.roster[id] && !DB.profiles[id] ? h('button', { type: 'button', 'class': 'b-dim', onclick: function () { if (confirm('Remove ' + p.name + ' from your class list?')) { delete DB.teacher.roster[id]; saveNow(); go('#/teacher/class'); } } }, ['Remove from class']) : null]));
    w.appendChild(h('h2', { text: 'Grade the Build Projects', 'class': 'noprint' }));
    MODS.forEach(function (m) {
      var fm = D.fac.mods[m.n], b = p.build[m.n] || {}, tr = DB.teacher.rubric[id] = DB.teacher.rubric[id] || {}, mr = tr[m.n] = tr[m.n] || {};
      var box = h('details', { 'class': 'card tgrade noprint' }, [h('summary', { text: 'Module ' + m.n + ' · ' + m.build.title + (b.done ? ' ✓ done' : ' — not done yet') })]);
      var inn = h('div', { 'class': 'in' }); box.appendChild(inn);
      fm.rubric.forEach(function (row, ri) {
        var sel = h('select', { 'aria-label': row[0] }, [h('option', { value: '' }, ['Teacher score…'])].concat(D.fac.levels.map(function (lv, li) { var o = h('option', { value: String(li) }, [lv + ' — ' + row[li + 1]]); if (mr[ri] === li) o.selected = true; return o; })));
        sel.addEventListener('change', function () { if (sel.value === '') delete mr[ri]; else mr[ri] = +sel.value; saveNow(); });
        inn.appendChild(h('div', { 'class': 'rubrow' }, [h('b', { text: row[0] }), h('span', { 'class': 'muted', text: 'Self: ' + (b.self && b.self[ri] != null ? D.fac.levels[b.self[ri]] : '—') }), sel]));
      });
      var nt = h('textarea', { rows: '2', placeholder: 'Feedback for this module (prints on the report)', 'aria-label': 'Teacher note module ' + m.n }); nt.value = (DB.teacher.notes[id] || {})[m.n] || '';
      nt.addEventListener('input', function () { (DB.teacher.notes[id] = DB.teacher.notes[id] || {})[m.n] = nt.value; save(); });
      inn.appendChild(nt); w.appendChild(box);
    });
    w.appendChild(h('h2', { text: 'Workbook', 'class': 'noprint' }));
    w.appendChild(workbookDoc(p, true));
  }
  function list(a) { return h('ul', { 'class': 'dots' }, a.map(function (x) { return h('li', Array.isArray(x) ? { html: '<b>' + esc(x[0]) + '</b> — ' + esc(x[1]) } : { text: x }); })); }
  function tGuide(w, n) {
    var F = D.fac;
    w.appendChild(h('div', { 'class': 'chips noprint' }, [h('a', { href: '#/teacher/guide', 'class': 'pill' + (!n ? ' ok' : ''), text: 'Getting started' })].concat(MODS.map(function (m) { return h('a', { href: '#/teacher/guide/' + m.n, 'class': 'pill' + (String(m.n) === n ? ' ok' : ''), text: 'Module ' + m.n }); }))));
    if (!n) {
      w.appendChild(h('h2', { text: 'Welcome, lab assistant' })); w.appendChild(h('p', { text: F.intro.welcome }));
      w.appendChild(h('h3', { text: 'Ways to run the course' })); w.appendChild(list(F.intro.formats));
      w.appendChild(h('h3', { text: 'A session that works' })); w.appendChild(list(F.intro.session));
      w.appendChild(h('h3', { text: 'By age' })); w.appendChild(list(F.intro.ages));
      w.appendChild(h('h3', { text: 'Safety rules' })); w.appendChild(h('div', { 'class': 'safety' }, [list(F.safety)]));
      w.appendChild(h('h3', { text: 'Assessment' })); w.appendChild(h('p', { text: F.assess.overview })); w.appendChild(list(F.assess.scoring)); w.appendChild(list(F.assess.levels));
      w.appendChild(h('h3', { text: 'Giving the final exam' })); w.appendChild(list(F.finalAdmin));
      return;
    }
    var m = MOD[+n], g = F.mods[+n]; if (!m || !g) return;
    w.appendChild(h('h2', { text: 'Module ' + m.n + ': ' + m.title }));
    w.appendChild(h('div', { 'class': 'try' }, [h('b', { text: 'Big idea: ' }), g.big]));
    w.appendChild(h('h3', { text: 'Timing' })); w.appendChild(list(g.time));
    w.appendChild(h('h3', { text: 'Before you start: gather' })); w.appendChild(list(g.prep));
    w.appendChild(h('h3', { text: 'Coaching each lesson' })); w.appendChild(list(g.coach));
    w.appendChild(h('h3', { text: 'Watch for these mix-ups' })); w.appendChild(list(g.mis));
    w.appendChild(h('h3', { text: 'Support & stretch' })); w.appendChild(list([['Support', g.support], ['Stretch', g.stretch]]));
    w.appendChild(h('h3', { text: 'Discussion prompts' })); w.appendChild(list(g.prompts));
    w.appendChild(h('h3', { text: 'Build rubric: ' + g.build }));
    w.appendChild(h('div', { 'class': 'tscroll', html: '<table class="dt"><thead><tr><th></th>' + F.levels.map(function (l) { return '<th>' + esc(l) + '</th>'; }).join('') + '</tr></thead><tbody>' + g.rubric.map(function (r) { return '<tr><td><b>' + esc(r[0]) + '</b></td>' + r.slice(1).map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' }));
    w.appendChild(h('div', { 'class': 'row noprint' }, [btnLink('#/m/' + m.n, 'Open the student module →', 'b-ghost'), btnLink('#/teacher/family/' + m.n, 'Family Night for this module →', 'b-ghost'), h('button', { type: 'button', 'class': 'b-dim', onclick: function () { window.print(); } }, ['🖨 Print'])]));
  }
  function tKey(w) {
    w.appendChild(h('p', { 'class': 'muted', text: 'Accept any answer that matches the meaning of the key, even if worded differently. Quizzes: 6 of 8 to pass. Final: 22 of 24 earns STEM Master.' }));
    w.appendChild(h('button', { type: 'button', 'class': 'b-dim noprint', onclick: function () { window.print(); } }, ['🖨 Print answer key']));
    function block(title, qs) { var s = h('section', { 'class': 'key' }, [h('h3', { text: title })]); var ol = h('ol'); qs.forEach(function (q) { ol.appendChild(h('li', { html: esc(q[0]) + '<br><b class="fb-ok">' + String.fromCharCode(65 + q[2]) + '. ' + esc(q[1][q[2]]) + '</b> <span class="muted">— ' + esc(q[3]) + '</span>' })); }); s.appendChild(ol); return s; }
    MODS.forEach(function (m) { w.appendChild(block('Module ' + m.n + ' Quiz — ' + m.title, D.quiz[m.n])); });
    w.appendChild(block('Final Exam (24)', D.final));
    w.appendChild(h('p', { 'class': 'muted', text: 'Letters refer to the order in the printed workbook. In the interactive quiz the choices are shuffled each try.' }));
  }
  function tFamily(w, n) {
    var F = D.fam;
    w.appendChild(h('div', { 'class': 'chips noprint' }, [h('a', { href: '#/teacher/family', 'class': 'pill' + (!n ? ' ok' : ''), text: 'How it works' })].concat(F.nights.map(function (x) { return h('a', { href: '#/teacher/family/' + x.n, 'class': 'pill' + (String(x.n) === n ? ' ok' : ''), text: 'Night ' + x.n }); }))));
    if (!n) { w.appendChild(h('h2', { text: 'Family STEM Night Kit' })); w.appendChild(list(F.how)); w.appendChild(h('h3', { text: 'The 45-minute flow' })); w.appendChild(list(F.flow)); w.appendChild(h('h3', { text: 'Jobs (rotate each night)' })); w.appendChild(list(F.roles)); return; }
    var x = F.nights.filter(function (y) { return String(y.n) === n; })[0]; if (!x) return;
    w.appendChild(h('h2', { text: 'Night ' + x.n + ': ' + x.title })); w.appendChild(h('div', { 'class': 'try' }, [h('b', { text: 'Big idea: ' }), x.big]));
    w.appendChild(h('h3', { text: 'Materials' })); w.appendChild(list(x.materials));
    w.appendChild(h('h3', { text: 'Warm-up game (5 min)' })); w.appendChild(h('p', { text: x.warm }));
    w.appendChild(h('h3', { text: 'Main challenge (25 min)' })); w.appendChild(h('ol', { 'class': 'steps' }, x.steps.map(function (s) { return h('li', { text: s }); })));
    w.appendChild(h('h3', { text: 'Share and talk (10 min)' })); w.appendChild(list(x.talk));
    w.appendChild(h('div', { 'class': 'safety', text: x.safety }));
    w.appendChild(h('p', { 'class': 'muted', text: 'Passport stamp (5 min): each learner earns their Module ' + x.n + ' stamp in the course by finishing the lessons, Build Project and quiz.' }));
    w.appendChild(h('div', { 'class': 'row noprint' }, [btnLink('#/m/' + x.n, 'Watch Module ' + x.n + ' videos first →', 'b-ghost'), h('button', { type: 'button', 'class': 'b-dim', onclick: function () { window.print(); } }, ['🖨 Print'])]));
  }

  /* ---------- feedback bits ---------- */
  function toast(t) { var el = h('div', { 'class': 'toast', role: 'status', text: t }); document.body.appendChild(el); setTimeout(function () { el.classList.add('show'); }, 10); setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 400); }, 2600); }
  function confetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var c = h('div', { 'class': 'confetti', 'aria-hidden': 'true' }), cols = ['#E4C173', '#29A99E', '#ECE7DA', '#C9A24B'];
    for (var i = 0; i < 60; i++) c.appendChild(h('i', { style: 'left:' + Math.random() * 100 + '%;background:' + cols[i % 4] + ';animation-delay:' + Math.random() * .6 + 's;transform:rotate(' + Math.random() * 360 + 'deg)' }));
    document.body.appendChild(c); setTimeout(function () { c.remove(); }, 3200);
  }

  /* ---------- render ---------- */
  function render() {
    var r = route(), p = P();
    if (!p && r[0] !== 'teacher' && r[0] !== 'settings' && r[0] !== 'gloss') r = ['who'];
    root.innerHTML = '';
    root.appendChild(topbar(p, r));
    var main = h('main', { id: 'main' }), out = [];
    try {
      if (r[0] === 'who') out = whoView();
      else if (r[0] === 'm' && MOD[+r[1]]) { var m = MOD[+r[1]], s = r[2] || '';
        out = s === 'l' ? lessonView(p, m, r[3]) : s === 'words' ? wordsView(p, m) : s === 'lab' ? labView(p, m) : s === 'build' ? buildView(p, m) : s === 'quiz' ? quizView(p, m) : modOverview(p, m);
        p.last = location.hash; p.seen = today(); save(); }
      else if (r[0] === 'final') out = finalView(p);
      else if (r[0] === 'cert') out = certView(p);
      else if (r[0] === 'book') out = bookView(p);
      else if (r[0] === 'gloss') out = glossView();
      else if (r[0] === 'settings') out = settingsView(p);
      else if (r[0] === 'teacher') out = teacherView(r);
      else out = home(p);
    } catch (e) { console.error(e); out = [h('div', { 'class': 'wrap' }, [h('h2', { text: 'Something went wrong on this page.' }), h('p', { text: 'Your work is saved. Go back home and try again.' }), btnLink('#/', 'Home')])]; }
    out.forEach(function (x) { main.appendChild(x); });
    root.appendChild(main); root.appendChild(footer());
    var t = { who: 'Choose a learner', final: 'Final Exam', cert: 'Certificate', book: 'My Workbook', gloss: 'Glossary', settings: 'Settings', teacher: 'Teacher Hub' }[r[0]] || (r[0] === 'm' && MOD[+r[1]] ? 'Module ' + r[1] + ': ' + MOD[+r[1]].title : 'Home');
    document.title = t + ' · STEM Master Course';
  }

  load(); applySettings(); render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') { navigator.serviceWorker.register('sw.js').catch(function () {}); }
})();
