/* STEM Master Course — interactive Build Simulation workbook tools (one per module).
   Each tool(el, st, save, U) draws into el, keeps its data in st (an object saved per learner),
   and calls save() after every change. U = shared helpers from app.js. */
window.STEM_BUILDS = function (U) {
  "use strict";
  var h = U.h, esc = U.esc;
  var GOLD = '#E4C173', TEAL = '#29A99E', RED = '#e0675a', CREAM = '#ECE7DA', MUT = '#a9b0bf';

  function num(v) { if (v === '' || v == null) return null; var n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; }
  function r1(n) { return Math.round(n * 10) / 10; }
  function field(st, key, save, attrs, after) {
    var a = { type: 'text', value: st[key] == null ? '' : st[key] }; for (var k in attrs) a[k] = attrs[k];
    var i = h('input', a);
    i.addEventListener('input', function () { st[key] = i.value; save(); if (after) after(); });
    return i;
  }
  function area(st, key, save, ph, rows) {
    var t = h('textarea', { rows: String(rows || 3), placeholder: ph || '' }); t.value = st[key] || '';
    t.addEventListener('input', function () { st[key] = t.value; save(); });
    return t;
  }
  /* bar chart: groups = [{label, bars:[{v, color, name}]}] */
  function chart(groups, title, unit) {
    var all = []; groups.forEach(function (g) { g.bars.forEach(function (b) { if (b.v != null) all.push(b.v); }); });
    if (!all.length) return '<p class="muted">Your graph appears here as you fill in your data.</p>';
    var max = Math.max.apply(null, all.concat([1])); var W = 360, H = 210, base = 170, top = 24, gw = (W - 40) / groups.length;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:560px" role="img" aria-label="' + esc(title) + '">';
    s += '<text x="' + W / 2 + '" y="14" text-anchor="middle" fill="' + GOLD + '" font-size="12" font-weight="800">' + esc(title) + '</text>';
    s += '<line x1="30" y1="' + base + '" x2="' + (W - 6) + '" y2="' + base + '" stroke="#4a5578"/>';
    groups.forEach(function (g, gi) {
      var n = g.bars.length, bw = Math.min(34, (gw - 14) / n), x0 = 34 + gi * gw + (gw - bw * n) / 2;
      g.bars.forEach(function (b, bi) {
        if (b.v == null) return;
        var hh = (base - top) * (b.v / max), x = x0 + bi * bw;
        s += '<rect x="' + x + '" y="' + (base - hh) + '" width="' + (bw - 3) + '" height="' + hh + '" rx="3" fill="' + b.color + '"><title>' + esc((b.name || '') + ' ' + b.v + (unit || '')) + '</title></rect>';
        s += '<text x="' + (x + (bw - 3) / 2) + '" y="' + (base - hh - 4) + '" text-anchor="middle" fill="' + CREAM + '" font-size="10" font-weight="800">' + r1(b.v) + '</text>';
      });
      s += '<text x="' + (34 + gi * gw + gw / 2) + '" y="' + (base + 16) + '" text-anchor="middle" fill="' + CREAM + '" font-size="10.5">' + esc(String(g.label).slice(0, 16)) + '</text>';
    });
    var legend = []; groups[0].bars.forEach(function (b) { if (b.name) legend.push(b); });
    legend.forEach(function (b, i) { s += '<rect x="' + (40 + i * 120) + '" y="' + (H - 14) + '" width="10" height="10" fill="' + b.color + '"/><text x="' + (54 + i * 120) + '" y="' + (H - 5) + '" fill="' + MUT + '" font-size="10.5">' + esc(b.name) + '</text>'; });
    return s + '</svg>';
  }
  function tbl(head, rows) {
    var t = h('table', { 'class': 'dt' });
    t.appendChild(h('thead', {}, [h('tr', {}, head.map(function (x) { return h('th', { text: x }); }))]));
    var b = h('tbody'); rows.forEach(function (r) { b.appendChild(h('tr', {}, r.map(function (c) { var td = h('td'); if (typeof c === 'string') td.textContent = c; else if (c) td.appendChild(c); return td; }))); });
    t.appendChild(b); return h('div', { 'class': 'tscroll' }, [t]);
  }
  function out() { return h('div', { 'class': 'calc', 'aria-live': 'polite' }); }

  var B = {};

  /* 1 · Mystery Powder */
  B[1] = function (el, st, save) {
    st.rows = st.rows || { A: {}, B: {}, C: {} };
    var cols = [['color', 'Color'], ['grain', 'Grains (size, shape)'], ['feel', 'How it feels'], ['water', 'In water after 2 min']];
    var rows = ['A', 'B', 'C'].map(function (k) {
      var r = st.rows[k];
      var sel = h('select', { 'aria-label': 'Powder ' + k + ' is' }, ['I think it is…', 'Salt', 'Sugar', 'Baking soda', 'Not sure yet'].map(function (o, i) { var op = h('option', { value: i ? o : '' }, [o]); if (r.id === o) op.selected = true; return op; }));
      sel.addEventListener('change', function () { r.id = sel.value; save(); });
      return [h('b', { text: 'Powder ' + k })].concat(cols.map(function (c) { return field(r, c[0], save, { 'aria-label': 'Powder ' + k + ' ' + c[1], placeholder: '…' }); })).concat([sel]);
    });
    el.appendChild(h('h4', { text: 'My data table' }));
    el.appendChild(tbl(['Powder'].concat(cols.map(function (c) { return c[1]; })).concat(['My answer']), rows));
    el.appendChild(h('label', { 'class': 'lbl', text: 'My evidence: which clue told the powders apart?' }));
    el.appendChild(area(st, 'evidence', save, 'Example: Powder B fizzed a little and felt soft and chalky, so…'));
    el.appendChild(h('p', { 'class': 'muted', text: 'When your table is done, ask your grown-up which powder was which and check your answers.' }));
  };

  /* 2 · Ramp Racers */
  B[2] = function (el, st, save) {
    st.d = st.d || { low: [], med: [], high: [] };
    var H = [['low', 'LOW (1 book)'], ['med', 'MEDIUM (2 books)'], ['high', 'HIGH (3 books)']];
    el.appendChild(h('label', { 'class': 'lbl', text: 'My hypothesis (what I think will happen, and why)' }));
    el.appendChild(area(st, 'hyp', save, 'I think the car will roll farther from the higher ramp because…', 2));
    var o = out(), ch = h('div', { 'class': 'diagram' });
    function avg(k) { var v = st.d[k].map(num).filter(function (x) { return x != null; }); return v.length ? r1(v.reduce(function (a, b) { return a + b; }, 0) / v.length) : null; }
    function upd() {
      var a = H.map(function (x) { return avg(x[0]); });
      H.forEach(function (x, i) { avgCells[i].textContent = a[i] == null ? '—' : a[i] + ' in'; });
      ch.innerHTML = chart(H.map(function (x, i) { return { label: x[1].split(' ')[0], bars: [{ v: a[i], color: [TEAL, GOLD, '#f08a5d'][i], name: 'Average distance' }] }; }), 'Average distance rolled (inches)', ' in');
      if (a[0] != null && a[2] != null) o.innerHTML = 'From the LOW ramp to the HIGH ramp, the average distance changed by <b>' + r1(a[2] - a[0]) + ' inches</b>. ' + (a[2] > a[0] ? 'Higher ramp → farther roll.' : a[2] < a[0] ? 'Surprise! The higher ramp went less far. What could explain it?' : 'No change. Did height matter?');
      else o.textContent = 'Fill in at least the LOW and HIGH runs to see your result.';
    }
    var avgCells = [];
    var rows = H.map(function (x) {
      var c = h('td'); var cells = [0, 1, 2].map(function (i) { var inp = h('input', { type: 'number', inputmode: 'decimal', min: '0', step: '0.5', 'aria-label': x[1] + ' run ' + (i + 1) + ' inches', value: st.d[x[0]][i] == null ? '' : st.d[x[0]][i] }); inp.addEventListener('input', function () { st.d[x[0]][i] = inp.value; save(); upd(); }); return inp; });
      var a = h('b', { text: '—' }); avgCells.push(a);
      return [h('b', { text: x[1] })].concat(cells).concat([a]);
    });
    el.appendChild(h('h4', { text: 'My runs (distance in inches)' }));
    el.appendChild(tbl(['Ramp height', 'Run 1', 'Run 2', 'Run 3', 'Average'], rows));
    el.appendChild(o); el.appendChild(ch); upd();
  };

  /* 3 · Measure Your World */
  B[3] = function (el, st, save) {
    st.rows = st.rows || [{}, {}, {}, {}, {}];
    var o = out(), ch = h('div', { 'class': 'diagram' }), errCells = [];
    function upd() {
      var errs = [];
      st.rows.forEach(function (r, i) { var e = num(r.est), m = num(r.real); if (e != null && m != null) { var d = r1(Math.abs(e - m)); errs.push(d); errCells[i].textContent = d + ' in'; } else errCells[i].textContent = '—'; });
      ch.innerHTML = chart(st.rows.map(function (r, i) { return { label: r.name || ('Object ' + (i + 1)), bars: [{ v: num(r.est), color: GOLD, name: 'My estimate' }, { v: num(r.real), color: TEAL, name: 'Real length' }] }; }), 'Estimate vs. real length (inches)', ' in');
      if (errs.length) { var av = r1(errs.reduce(function (a, b) { return a + b; }, 0) / errs.length); o.innerHTML = 'Average error: <b>' + av + (av === 1 ? ' inch' : ' inches') + '</b> across ' + errs.length + ' object' + (errs.length > 1 ? 's' : '') + '. ' + (av < 1 ? '🎯 Goal met: under 1 inch!' : 'Goal: get it under 1 inch next time.'); }
      else o.textContent = 'Type an estimate AND a real measurement to see your error.';
    }
    var rows = st.rows.map(function (r, i) {
      var e = h('b', { text: '—' }); errCells.push(e);
      return [field(r, 'name', save, { 'aria-label': 'Object ' + (i + 1) + ' name', placeholder: 'Object ' + (i + 1) }, upd),
        field(r, 'est', save, { type: 'number', inputmode: 'decimal', step: '0.25', 'aria-label': 'Estimate inches' }, upd),
        field(r, 'real', save, { type: 'number', inputmode: 'decimal', step: '0.25', 'aria-label': 'Measured inches' }, upd), e];
    });
    el.appendChild(h('p', { 'class': 'muted', text: 'Step 1: write ALL your estimates first. Step 2: then measure. No peeking with the ruler!' }));
    el.appendChild(tbl(['Object', 'Estimate (in)', 'Measured (in)', 'Error'], rows));
    el.appendChild(o); el.appendChild(ch); upd();
  };

  /* 4 · Dream Room Floor Plan — to-scale planner, 1 square = 1 foot */
  B[4] = function (el, st, save) {
    st.L = st.L || 12; st.W = st.W || 10; st.door = st.door || { wall: 'bottom', at: 2 }; st.win = st.win || { wall: 'top', at: 4, len: 3 };
    st.f = st.f || [{ name: 'Bed', w: 4, l: 6, x: 1, y: 1 }, { name: 'Desk', w: 4, l: 2, x: 7, y: 1 }];
    var svg = h('div', { 'class': 'diagram plan' }), o = out(), list = h('div');
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function draw() {
      var L = clamp(num(st.L) || 1, 4, 30), W = clamp(num(st.W) || 1, 4, 30), s = Math.min(320 / L, 260 / W), pad = 22;
      var w = L * s, hgt = W * s, g = '';
      for (var x = 0; x <= L; x++) g += '<line x1="' + (pad + x * s) + '" y1="' + pad + '" x2="' + (pad + x * s) + '" y2="' + (pad + hgt) + '" stroke="#22305a" stroke-width="1"/>';
      for (var y = 0; y <= W; y++) g += '<line x1="' + pad + '" y1="' + (pad + y * s) + '" x2="' + (pad + w) + '" y2="' + (pad + y * s) + '" stroke="#22305a" stroke-width="1"/>';
      g += '<rect x="' + pad + '" y="' + pad + '" width="' + w + '" height="' + hgt + '" fill="none" stroke="' + CREAM + '" stroke-width="5"/>';
      function wallPos(o2, len) { var at = clamp(num(o2.at) || 0, 0, (o2.wall === 'top' || o2.wall === 'bottom' ? L : W) - len);
        if (o2.wall === 'top') return [pad + at * s, pad, pad + (at + len) * s, pad]; if (o2.wall === 'bottom') return [pad + at * s, pad + hgt, pad + (at + len) * s, pad + hgt];
        if (o2.wall === 'left') return [pad, pad + at * s, pad, pad + (at + len) * s]; return [pad + w, pad + at * s, pad + w, pad + (at + len) * s]; }
      var wp = wallPos(st.win, clamp(num(st.win.len) || 3, 1, 8));
      g += '<line x1="' + wp[0] + '" y1="' + wp[1] + '" x2="' + wp[2] + '" y2="' + wp[3] + '" stroke="#0A0E16" stroke-width="7"/><line x1="' + wp[0] + '" y1="' + wp[1] + '" x2="' + wp[2] + '" y2="' + wp[3] + '" stroke="' + TEAL + '" stroke-width="2" stroke-dasharray="1 0"/>';
      var dp = wallPos(st.door, 3); g += '<line x1="' + dp[0] + '" y1="' + dp[1] + '" x2="' + dp[2] + '" y2="' + dp[3] + '" stroke="#0A0E16" stroke-width="8"/>';
      // door swing: quarter circle, 3 ft radius, into the room
      var r = 3 * s, hx = dp[0], hy = dp[1], arc;
      if (st.door.wall === 'bottom') arc = 'M' + hx + ' ' + hy + ' L' + hx + ' ' + (hy - r) + ' A' + r + ' ' + r + ' 0 0 1 ' + (hx + r) + ' ' + hy;
      else if (st.door.wall === 'top') arc = 'M' + hx + ' ' + hy + ' L' + hx + ' ' + (hy + r) + ' A' + r + ' ' + r + ' 0 0 0 ' + (hx + r) + ' ' + hy;
      else if (st.door.wall === 'left') arc = 'M' + hx + ' ' + hy + ' L' + (hx + r) + ' ' + hy + ' A' + r + ' ' + r + ' 0 0 1 ' + hx + ' ' + (hy + r);
      else arc = 'M' + hx + ' ' + hy + ' L' + (hx - r) + ' ' + hy + ' A' + r + ' ' + r + ' 0 0 0 ' + hx + ' ' + (hy + r);
      g += '<path d="' + arc + '" fill="rgba(228,193,115,.12)" stroke="' + GOLD + '" stroke-width="2"/>';
      var warn = [];
      // door swing zone in feet
      var dAt = clamp(num(st.door.at) || 0, 0, (st.door.wall === 'top' || st.door.wall === 'bottom' ? L : W) - 3), zone;
      if (st.door.wall === 'bottom') zone = [dAt, W - 3, 3, 3]; else if (st.door.wall === 'top') zone = [dAt, 0, 3, 3]; else if (st.door.wall === 'left') zone = [0, dAt, 3, 3]; else zone = [L - 3, dAt, 3, 3];
      function hit(a, b) { return a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3]; }
      var used = 0;
      st.f.forEach(function (f, i) {
        var fw = clamp(num(f.w) || 1, 1, 30), fl = clamp(num(f.l) || 1, 1, 30), fx = num(f.x) || 0, fy = num(f.y) || 0, rc = [fx, fy, fw, fl];
        used += fw * fl;
        var bad = fx < 0 || fy < 0 || fx + fw > L || fy + fl > W;
        if (bad) warn.push((f.name || 'Item ' + (i + 1)) + ' sticks out of the room.');
        if (hit(rc, zone)) warn.push('The door would hit the ' + (f.name || 'item') + ' when it swings.');
        st.f.forEach(function (o2, j) { if (j > i && hit(rc, [num(o2.x) || 0, num(o2.y) || 0, num(o2.w) || 1, num(o2.l) || 1])) warn.push((f.name || 'Item') + ' and ' + (o2.name || 'item') + ' overlap.'); });
        g += '<rect x="' + (pad + fx * s) + '" y="' + (pad + fy * s) + '" width="' + fw * s + '" height="' + fl * s + '" rx="3" fill="' + (bad ? 'rgba(224,103,90,.35)' : 'rgba(41,169,158,.28)') + '" stroke="' + (bad ? RED : TEAL) + '" stroke-width="2"/>';
        g += '<text x="' + (pad + (fx + fw / 2) * s) + '" y="' + (pad + (fy + fl / 2) * s + 4) + '" text-anchor="middle" fill="' + CREAM + '" font-size="11" font-weight="800">' + esc((f.name || '').slice(0, 12)) + '</text>';
      });
      g += '<text x="' + (pad + w / 2) + '" y="14" text-anchor="middle" fill="' + GOLD + '" font-size="12" font-weight="800">' + L + ' ft</text><text x="8" y="' + (pad + hgt / 2) + '" fill="' + GOLD + '" font-size="12" font-weight="800">' + W + '</text>';
      svg.innerHTML = '<svg viewBox="0 0 ' + (w + pad * 2) + ' ' + (hgt + pad * 2) + '" width="100%" style="max-width:520px" role="img" aria-label="Floor plan drawn to scale">' + g + '</svg><p class="muted" style="margin:6px 0 0">Scale: 1 square = 1 foot · thick line = wall · teal = window · gold arc = door swing</p>';
      var A = L * W, P = 2 * (L + W);
      o.innerHTML = 'Room: <b>' + L + ' × ' + W + ' ft</b> · Perimeter <b>' + P + ' ft</b> · Area <b>' + A + ' sq ft</b> · Furniture covers <b>' + used + ' sq ft</b> · Open floor <b>' + Math.max(0, A - used) + ' sq ft</b>' +
        (warn.length ? '<br><span class="fb-no">Check: ' + esc(warn.slice(0, 4).join(' ')) + '</span>' : '<br><span class="fb-ok">✓ Everything fits and the door swings freely.</span>');
    }
    function wallSel(o2, label) {
      var s2 = h('select', { 'aria-label': label + ' wall' }, ['top', 'bottom', 'left', 'right'].map(function (w2) { var op = h('option', { value: w2 }, [w2 + ' wall']); if (o2.wall === w2) op.selected = true; return op; }));
      s2.addEventListener('change', function () { o2.wall = s2.value; save(); draw(); }); return s2;
    }
    function items() {
      list.innerHTML = '';
      st.f.forEach(function (f, i) {
        function nudge(k, d) { return h('button', { type: 'button', 'class': 'b-dim sm', 'aria-label': 'Move ' + (f.name || 'item') + ' ' + ({ x: d > 0 ? 'right' : 'left', y: d > 0 ? 'down' : 'up' })[k], onclick: function () { f[k] = (num(f[k]) || 0) + d; save(); items(); draw(); } }, [({ x: d > 0 ? '→' : '←', y: d > 0 ? '↓' : '↑' })[k]]); }
        list.appendChild(h('div', { 'class': 'furn' }, [
          field(f, 'name', save, { 'aria-label': 'Furniture name', placeholder: 'Name' }, draw),
          h('span', { 'class': 'muted', text: 'W' }), field(f, 'w', save, { type: 'number', min: '1', max: '30', 'aria-label': 'Width feet', 'class': 'n' }, draw),
          h('span', { 'class': 'muted', text: 'L' }), field(f, 'l', save, { type: 'number', min: '1', max: '30', 'aria-label': 'Length feet', 'class': 'n' }, draw),
          nudge('x', -1), nudge('x', 1), nudge('y', -1), nudge('y', 1),
          h('button', { type: 'button', 'class': 'b-dim sm', 'aria-label': 'Remove ' + (f.name || 'item'), onclick: function () { st.f.splice(i, 1); save(); items(); draw(); } }, ['✕'])]));
      });
    }
    el.appendChild(h('div', { 'class': 'row' }, [h('label', { 'class': 'lbl', text: 'Room length (ft)' }), field(st, 'L', save, { type: 'number', min: '4', max: '30', 'class': 'n' }, draw),
      h('label', { 'class': 'lbl', text: 'width (ft)' }), field(st, 'W', save, { type: 'number', min: '4', max: '30', 'class': 'n' }, draw)]));
    el.appendChild(h('div', { 'class': 'row' }, [h('span', { 'class': 'lbl', text: 'Door on' }), wallSel(st.door, 'Door'), h('span', { 'class': 'muted', text: 'at ft' }), field(st.door, 'at', save, { type: 'number', min: '0', 'class': 'n', 'aria-label': 'Door position feet' }, draw)]));
    el.appendChild(h('div', { 'class': 'row' }, [h('span', { 'class': 'lbl', text: 'Window on' }), wallSel(st.win, 'Window'), h('span', { 'class': 'muted', text: 'at ft' }), field(st.win, 'at', save, { type: 'number', min: '0', 'class': 'n', 'aria-label': 'Window position feet' }, draw),
      h('span', { 'class': 'muted', text: 'length' }), field(st.win, 'len', save, { type: 'number', min: '1', max: '8', 'class': 'n', 'aria-label': 'Window length feet' }, draw)]));
    el.appendChild(svg); el.appendChild(o);
    el.appendChild(h('h4', { text: 'Furniture (feet) — use the arrows to move each piece' }));
    el.appendChild(list);
    el.appendChild(h('button', { type: 'button', 'class': 'b-ghost', onclick: function () { st.f.push({ name: 'New item', w: 2, l: 2, x: 0, y: 0 }); save(); items(); draw(); } }, ['+ Add furniture']));
    items(); draw();
  };

  /* 5 · Paper Bridge Challenge */
  B[5] = function (el, st, save) {
    st.rows = st.rows || [{ name: 'Flat beam bridge' }, { name: 'Accordion fold' }, { name: 'My third design' }];
    var o = out(), ch = h('div', { 'class': 'diagram' }), dCells = [];
    function upd() {
      var best = null;
      st.rows.forEach(function (r, i) { var p = num(r.pred), a = num(r.act); dCells[i].textContent = (p != null && a != null) ? ((a - p >= 0 ? '+' : '') + (a - p)) : '—'; if (a != null && (!best || a > best.a)) best = { a: a, n: r.name || ('Design ' + (i + 1)) }; });
      ch.innerHTML = chart(st.rows.map(function (r, i) { return { label: r.name || ('Design ' + (i + 1)), bars: [{ v: num(r.pred), color: GOLD, name: 'Predicted' }, { v: num(r.act), color: TEAL, name: 'Actually held' }] }; }), 'Pennies held', ' pennies');
      var f = num(st.rows[0].act);
      if (best) o.innerHTML = '🏆 Strongest so far: <b>' + esc(best.n) + '</b> with <b>' + best.a + ' pennies</b>' + (f && best.a > f ? ' — that is <b>' + r1(best.a / f) + '× stronger</b> than the flat beam!' : '.');
      else o.textContent = 'Load pennies one at a time and record the number held just before the bridge failed.';
    }
    var rows = st.rows.map(function (r, i) { var d = h('b', { text: '—' }); dCells.push(d);
      return [field(r, 'name', save, { 'aria-label': 'Design name' }, upd), field(r, 'pred', save, { type: 'number', min: '0', inputmode: 'numeric', 'aria-label': 'Predicted pennies' }, upd), field(r, 'act', save, { type: 'number', min: '0', inputmode: 'numeric', 'aria-label': 'Pennies held' }, upd), d]; });
    el.appendChild(tbl(['Design', 'Prediction', 'Pennies held', 'Difference'], rows));
    el.appendChild(o); el.appendChild(ch);
    el.appendChild(h('label', { 'class': 'lbl', text: 'Where did each bridge fail first (middle or ends)?' }));
    el.appendChild(area(st, 'fail', save, 'The flat bridge sagged in the middle…', 2)); upd();
  };

  /* 6 · Paper Circuit Card — circuit checker + debug log */
  B[6] = function (el, st, save) {
    st.sim = st.sim || { loop: false, leg: false, sw: false };
    var bulb = h('div', { 'class': 'diagram center' }), msg = out();
    var checks = [['loop', 'The copper tape makes ONE complete loop from the battery, through the LED, and back'], ['leg', 'The LED\'s LONG leg touches the tape from the battery\'s + (top) side'], ['sw', 'My paperclip switch is closed (touching both sides of the gap)']];
    function upd() {
      var ok = st.sim.loop && st.sim.leg && st.sim.sw;
      bulb.innerHTML = '<svg viewBox="0 0 200 120" width="160" role="img" aria-label="' + (ok ? 'LED lit' : 'LED off') + '"><circle cx="100" cy="55" r="' + (ok ? 34 : 0) + '" fill="rgba(228,193,115,.25)"/><circle cx="100" cy="55" r="22" fill="' + (ok ? GOLD : '#2a3352') + '" stroke="' + (ok ? '#fff6d8' : '#4a5578') + '" stroke-width="3"/><line x1="92" y1="77" x2="92" y2="110" stroke="#a9b0bf" stroke-width="3"/><line x1="108" y1="77" x2="108" y2="100" stroke="#a9b0bf" stroke-width="3"/></svg>';
      msg.innerHTML = ok ? '<span class="fb-ok">💡 It lights! Electricity flows around a closed loop.</span>' : '<span class="fb-no">Not lit. Debug: ' + esc(!st.sim.loop ? 'find the break in your tape loop.' : !st.sim.leg ? 'flip the LED around — the long leg goes to +.' : 'close the switch so the gap is bridged.') + '</span>';
    }
    el.appendChild(h('p', { 'class': 'muted', text: 'Check each box only when it is TRUE on your real card. This checker shows what your LED should do.' }));
    checks.forEach(function (c) { var cb = h('input', { type: 'checkbox' }); cb.checked = !!st.sim[c[0]]; cb.addEventListener('change', function () { st.sim[c[0]] = cb.checked; save(); upd(); }); el.appendChild(h('label', { 'class': 'chk' }, [cb, ' ' + c[1]])); });
    el.appendChild(bulb); el.appendChild(msg);
    el.appendChild(h('h4', { text: 'Debug log' }));
    st.log = st.log || [{}, {}, {}];
    el.appendChild(tbl(['Try', 'What went wrong?', 'How I fixed it', 'Lit?'], st.log.map(function (r, i) { return ['#' + (i + 1), field(r, 'bug', save, { 'aria-label': 'Bug ' + (i + 1) }), field(r, 'fix', save, { 'aria-label': 'Fix ' + (i + 1) }), field(r, 'lit', save, { 'aria-label': 'Did it light', placeholder: 'yes / no' })]; })));
    upd();
  };

  /* 7 · Human Robot Maze — algorithm builder + bug log */
  B[7] = function (el, st, save) {
    st.prog = st.prog || []; st.bugs = st.bugs || [{}, {}, {}];
    var CMD = ['STEP FORWARD', 'TURN LEFT', 'TURN RIGHT'];
    var listEl = h('ol', { 'class': 'prog-list' }), o = out(), rep = h('input', { type: 'number', min: '2', max: '9', value: '3', 'class': 'n', 'aria-label': 'Repeat how many times' });
    function upd() {
      listEl.innerHTML = '';
      st.prog.forEach(function (c, i) {
        listEl.appendChild(h('li', {}, [h('span', { text: c.rep ? 'REPEAT ' + c.rep + ' TIMES: ' + c.cmd : c.cmd }), h('span', { 'class': 'acts' }, [
          h('button', { type: 'button', 'class': 'b-dim sm', 'aria-label': 'Move up', onclick: function () { if (i) { var t = st.prog[i - 1]; st.prog[i - 1] = c; st.prog[i] = t; save(); upd(); } } }, ['↑']),
          h('button', { type: 'button', 'class': 'b-dim sm', 'aria-label': 'Delete step', onclick: function () { st.prog.splice(i, 1); save(); upd(); } }, ['✕'])])]));
      });
      var moves = 0, loops = 0; st.prog.forEach(function (c) { moves += c.rep || 1; if (c.rep) loops++; });
      o.innerHTML = st.prog.length ? 'Your program has <b>' + st.prog.length + ' lines</b> and makes the robot do <b>' + moves + ' moves</b>.' + (loops ? ' You used <b>' + loops + ' loop' + (loops > 1 ? 's' : '') + '</b> — it saved ' + (moves - st.prog.length) + ' lines! ✅' : ' Challenge: add a LOOP to make it shorter.') : 'Tap the command buttons to write your algorithm.';
    }
    el.appendChild(h('p', { 'class': 'muted', text: 'Write the program the robot will follow EXACTLY. Then test it on your tape maze.' }));
    el.appendChild(h('div', { 'class': 'row' }, CMD.map(function (c) { return h('button', { type: 'button', 'class': 'b-teal', onclick: function () { st.prog.push({ cmd: c }); save(); upd(); } }, ['+ ' + c]); })));
    el.appendChild(h('div', { 'class': 'row' }, [h('span', { 'class': 'lbl', text: 'Loop: repeat' }), rep, h('span', { 'class': 'muted', text: 'times' }),
      h('button', { type: 'button', 'class': 'b-ghost', onclick: function () { var n = Math.max(2, Math.min(9, parseInt(rep.value, 10) || 3)); st.prog.push({ cmd: 'STEP FORWARD', rep: n }); save(); upd(); } }, ['+ REPEAT: STEP FORWARD'])]));
    el.appendChild(h('div', { 'class': 'prog' }, [listEl])); el.appendChild(o);
    el.appendChild(h('h4', { text: 'Bug log' }));
    el.appendChild(tbl(['Run', 'Bug at line #', 'What happened', 'My fix'], st.bugs.map(function (r, i) { return ['#' + (i + 1), field(r, 'line', save, { type: 'number', min: '1', 'class': 'n', 'aria-label': 'Bug line' }), field(r, 'what', save, { 'aria-label': 'What happened' }), field(r, 'fix', save, { 'aria-label': 'Fix' })]; })));
    upd();
  };

  /* 8 · Pulse Lab */
  B[8] = function (el, st, save) {
    st.c = st.c || {};
    var P = [['rest', 'Resting (after sitting 2 min)'], ['act', 'Active (right after 1 min of jumping jacks)'], ['rec', 'Recovery (after resting 2 min)']];
    var o = out(), ch = h('div', { 'class': 'diagram' }), bpm = [], tmr = h('button', { type: 'button', 'class': 'b-gold' }, ['⏱ Start 15-second timer']), t = null;
    tmr.addEventListener('click', function () { if (t) return; var s = 15; tmr.textContent = '⏱ Count! ' + s; t = setInterval(function () { s--; tmr.textContent = s > 0 ? '⏱ Count! ' + s : '⏹ STOP — write your count'; if (s <= 0) { clearInterval(t); t = null; try { navigator.vibrate && navigator.vibrate(300); } catch (e) {} setTimeout(function () { tmr.textContent = '⏱ Start 15-second timer'; }, 2500); } }, 1000); });
    function upd() {
      var v = P.map(function (p, i) { var c = num(st.c[p[0]]); bpm[i].textContent = c == null ? '—' : (c * 4) + ' bpm'; return c == null ? null : c * 4; });
      ch.innerHTML = chart(P.map(function (p, i) { return { label: ['Resting', 'Active', 'Recovery'][i], bars: [{ v: v[i], color: [TEAL, '#e0675a', GOLD][i], name: 'Beats per minute' }] }; }), 'My heart rate (beats per minute)', ' bpm');
      var s = [];
      if (v[0] != null && v[1] != null) s.push('Active minus resting: <b>' + (v[1] - v[0]) + ' bpm</b>.');
      if (v[1] != null && v[2] != null) s.push('Active minus recovery: <b>' + (v[1] - v[2]) + ' bpm</b>.');
      o.innerHTML = s.length ? s.join(' ') : 'Count beats for 15 seconds, then type the number. We multiply by 4 for you.';
    }
    el.appendChild(h('div', { 'class': 'row' }, [tmr]));
    el.appendChild(tbl(['When', 'Beats in 15 sec', '× 4 = per minute'], P.map(function (p) { var b = h('b', { text: '—' }); bpm.push(b); return [p[1], field(st.c, p[0], save, { type: 'number', min: '5', max: '60', inputmode: 'numeric', 'class': 'n', 'aria-label': p[1] + ' count' }, upd), b]; })));
    el.appendChild(o); el.appendChild(ch);
    el.appendChild(h('div', { 'class': 'safety', text: 'Only exercise if you feel well. Stop and tell a grown-up if you feel dizzy, short of breath, or have chest pain. This lab is for learning, not medical advice.' }));
    upd();
  };

  /* plain-text summary of a tool's data, for the printable workbook and the teacher view */
  B.summary = function (n, st) {
    if (!st) return [];
    var L = [], f = function (x) { return x == null || x === '' ? '—' : String(x); };
    try {
      if (n === 1 && st.rows) ['A', 'B', 'C'].forEach(function (k) { var r = st.rows[k] || {}; L.push('Powder ' + k + ': color ' + f(r.color) + '; grains ' + f(r.grain) + '; feel ' + f(r.feel) + '; in water ' + f(r.water) + ' → ' + f(r.id)); });
      if (n === 1 && st.evidence) L.push('Evidence: ' + st.evidence);
      if (n === 2) { if (st.hyp) L.push('Hypothesis: ' + st.hyp); if (st.d) ['low', 'med', 'high'].forEach(function (k) { L.push(k.toUpperCase() + ' ramp runs: ' + (st.d[k] || []).map(f).join(', ')); }); }
      if (n === 3 && st.rows) st.rows.forEach(function (r) { if (r.name || r.est || r.real) L.push(f(r.name) + ': estimate ' + f(r.est) + ' in, measured ' + f(r.real) + ' in'); });
      if (n === 4) { L.push('Room ' + f(st.L) + ' × ' + f(st.W) + ' ft; door on ' + (st.door ? st.door.wall : '—') + ' wall; window on ' + (st.win ? st.win.wall : '—') + ' wall'); (st.f || []).forEach(function (x) { L.push('  ' + f(x.name) + ' ' + f(x.w) + '×' + f(x.l) + ' ft at (' + f(x.x) + ', ' + f(x.y) + ')'); }); }
      if (n === 5 && st.rows) { st.rows.forEach(function (r) { L.push(f(r.name) + ': predicted ' + f(r.pred) + ', held ' + f(r.act)); }); if (st.fail) L.push('Failure point: ' + st.fail); }
      if (n === 6) { (st.log || []).forEach(function (r, i) { if (r.bug || r.fix) L.push('Try ' + (i + 1) + ': ' + f(r.bug) + ' → ' + f(r.fix) + ' (lit: ' + f(r.lit) + ')'); }); }
      if (n === 7) { (st.prog || []).forEach(function (c, i) { L.push((i + 1) + '. ' + (c.rep ? 'REPEAT ' + c.rep + ': ' : '') + c.cmd); }); (st.bugs || []).forEach(function (r, i) { if (r.what || r.fix) L.push('Bug run ' + (i + 1) + ' (line ' + f(r.line) + '): ' + f(r.what) + ' → ' + f(r.fix)); }); }
      if (n === 8 && st.c) [['rest', 'Resting'], ['act', 'Active'], ['rec', 'Recovery']].forEach(function (p) { var c = num(st.c[p[0]]); L.push(p[1] + ': ' + (c == null ? '—' : c + ' beats/15 s = ' + c * 4 + ' bpm')); });
    } catch (e) {}
    return L;
  };
  return B;
};
