/* Varandas · v2 — JS puro, sem build, sem CDN */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ====== DADOS DO CLIENTE (confirmar) ====== */
  var CFG = {
    whatsapp: '5567999102539',
    waText: 'Olá, Varandas! Vim pelo site e gostaria de fazer um pedido.'
  };
  var L = [11, 13.5], D = [18, 23], D2 = [18, 23.5];
  /* 0 = domingo */
  var SCHEDULE = [[D], [L, D], [L], [L, D], [L, D], [L, D2], [L, D2]];
  var DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  var fmt = function (h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60); return mm ? hh + 'h' + String(mm).padStart(2, '0') : hh + 'h'; };
  var span = function (d) { return SCHEDULE[d].map(function (s) { return fmt(s[0]) + ' às ' + fmt(s[1]); }).join(' e '); };
  var isOpen = function (d, h) { return SCHEDULE[d].some(function (s) { return h >= s[0] && h < s[1]; }); };

  function nowCG() {
    var p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Campo_Grande', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    var g = function (t) { return p.filter(function (x) { return x.type === t; })[0].value; };
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), h: (parseInt(g('hour'), 10) % 24) + parseInt(g('minute'), 10) / 60 };
  }
  function nextOpening(now) {
    for (var k = 0; k < 8; k++) {
      var d = (now.day + k) % 7;
      for (var i = 0; i < SCHEDULE[d].length; i++) {
        var a = SCHEDULE[d][i][0];
        if (k > 0 || a > now.h) return { k: k, d: d, a: a };
      }
    }
  }
  function statusText(now) {
    var cur = SCHEDULE[now.day].filter(function (s) { return now.h >= s[0] && now.h < s[1]; })[0];
    if (cur) return { open: true, text: 'Aberto agora, fecha às ' + fmt(cur[1]) };
    var n = nextOpening(now);
    var when = n.k === 0 ? 'hoje' : n.k === 1 ? 'amanhã' : DAYS[n.d].toLowerCase();
    return { open: false, text: 'Fechado agora, abre ' + when + ' às ' + fmt(n.a) };
  }

  /* ====== WhatsApp ====== */
  var waBase = 'https://wa.me/' + CFG.whatsapp + '?text=';
  $$('[data-wa]').forEach(function (a) { a.href = waBase + encodeURIComponent(CFG.waText); });

  /* ====== status ao vivo ====== */
  function renderLive() {
    var st = statusText(nowCG());
    var dot = $('#liveDot');
    $('#liveText').textContent = st.text;
    dot.className = 'dot ' + (st.open ? 'on' : 'off');
  }
  renderLive(); setInterval(renderLive, 30000);

  /* ====== menu móvel ====== */
  var burger = $('#burger'), links = $('#navlinks');
  burger.addEventListener('click', function () {
    var o = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', o);
    burger.textContent = o ? 'Fechar' : 'Menu';
  });
  $$('#navlinks a').forEach(function (a) { a.addEventListener('click', function () { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.textContent = 'Menu'; }); });

  /* ====== entradas escalonadas ====== */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('[data-r]').forEach(function (el) { io.observe(el); });

  /* ====== O RELÓGIO: o anel, 24h, meia-noite embaixo, meio-dia no alto ====== */
  var NS = 'http://www.w3.org/2000/svg';
  var CX = 300, CY = 300, R = 226, SW = 38;
  function pt(h, r) { var t = (h / 24 * 360 + 180) * Math.PI / 180; return [CX + r * Math.sin(t), CY - r * Math.cos(t)]; }
  function arc(a, b) {
    var p1 = pt(a, R), p2 = pt(b, R), large = (b - a) > 12 ? 1 : 0;
    return 'M' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + p2[0].toFixed(2) + ' ' + p2[1].toFixed(2);
  }
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }

  function Dial(host, opts) {
    opts = opts || {};
    var svg = el('svg', { viewBox: '-40 -40 680 680', 'aria-hidden': 'true' });
    host.appendChild(svg);
    el('circle', { cx: CX, cy: CY, r: R, fill: 'none', 'stroke-width': SW, 'class': 'trk' }, svg);
    var arcs = el('g', {}, svg);
    [[0, 'MEIA-NOITE'], [6, '6h'], [12, '12h'], [18, '18h']].forEach(function (t) {
      var p = pt(t[0], R + SW / 2 + 34), tx = el('text', { x: p[0], y: p[1] + 9, 'text-anchor': 'middle', 'class': 'tick' }, svg);
      tx.textContent = t[0] === 0 ? '0h' : t[1];
    });
        var mark = el('circle', { r: 30, 'class': 'mark' }, svg);
    var markIn = el('circle', { r: 11, 'class': 'mark-in' }, svg);
    var time = el('text', { x: CX, y: CY + 22, 'text-anchor': 'middle', 'class': 'dial-time' }, svg);
    var state = el('text', { x: CX, y: CY + 82, 'text-anchor': 'middle', 'class': 'dial-state' }, svg);
    var api = { hour: opts.hour || 12, day: opts.day, svg: svg };

    api.setDay = function (d) {
      api.day = d; arcs.textContent = '';
      SCHEDULE[d].forEach(function (s) { el('path', { d: arc(s[0], s[1]), fill: 'none', 'stroke-width': SW, 'class': 'srv' }, arcs); });
    };
    api.set = function (h, label) {
      api.hour = h;
      var p = pt(h, R);
      mark.setAttribute('cx', p[0]); mark.setAttribute('cy', p[1]);
      markIn.setAttribute('cx', p[0]); markIn.setAttribute('cy', p[1]);
      var hh = Math.floor(h), mm = Math.round((h - hh) * 60);
      time.textContent = hh + 'h' + (mm ? String(mm).padStart(2, '0') : '');
      state.textContent = label != null ? label : (isOpen(api.day, h) ? 'Letreiro aceso' : 'Letreiro apagado');
    };
    api.setDay(opts.day);
    api.set(api.hour);
    return api;
  }

  /* ====== CENA: um dia na varanda (fixa, muda com a rolagem) ====== */
  (function () {
    var track = $('.day-track'), stage = $('#dayStage'), host = $('#dayDial');
    if (!track) return;
    var dial = Dial(host, { day: 3, hour: 11 });
    var chaps = $$('.chap');
    var RANGES = [[10.5, 13.5], [13.5, 17.9], [17.9, 19.5], [19.5, 21.5], [21.5, 23.7]];
    var cur = -1, ticking = false;
    function apply() {
      ticking = false;
      var r = track.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(0.9999, -r.top / (r.height - vh)));
      var i = Math.floor(p * 5), f = p * 5 - i;
      var h = RANGES[i][0] + (RANGES[i][1] - RANGES[i][0]) * f;
      h = Math.round(h * 4) / 4;
      dial.set(h);
      if (i !== cur) {
        cur = i;
        chaps.forEach(function (c, k) { c.classList.toggle('on', k === i); });
        stage.setAttribute('data-phase', chaps[i].getAttribute('data-phase'));
      }
    }
    if (reduce) { chaps.forEach(function (c) { c.classList.add('on'); }); return; }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
    window.addEventListener('resize', apply);
    apply();
  })();

  /* ====== hero: o anel gira devagar com a rolagem ====== */
  (function () {
    var c = $('#crescent'); if (!c || reduce) return;
    var t = false;
    window.addEventListener('scroll', function () {
      if (t) return; t = true;
      requestAnimationFrame(function () { t = false; c.style.setProperty('--rot', (window.scrollY * 0.045).toFixed(2) + 'deg'); });
    }, { passive: true });
  })();

  /* ====== CARDÁPIO (dados de exemplo, a confirmar) ====== */
  var MENU = [
    { id: 'almoco', t: 'Almoço', items: [
      ['rice', 'Almoço tradicional', 'O prato do dia, caprichado, para quem tem pouco tempo e muita fome.', 'Almoço'],
      ['meat', 'Churrasco no almoço', 'Carnes na brasa servidas na hora, com os acompanhamentos da casa.', 'Almoço'],
      ['beans', 'Feijoada de sábado', 'Todo sábado, no almoço.', 'Sábado'],
      ['rice', 'Grelhados do dia', 'Opções grelhadas com acompanhamentos variados.', 'Almoço']
    ] },
    { id: 'grelhados', t: 'Grelhados', items: [
      ['skewer', 'Espetada', 'Carne no espeto, suculenta, boa para dividir.', 'Jantar'],
      ['meat', 'Picada de carnes', 'Seleção de cortes para a mesa toda.', 'Jantar'],
      ['meat', 'Porco com bacon', 'Carne de porco bem temperada, com bacon crocante.', 'Jantar'],
      ['rice', 'Prato da casa', 'Sugestões do dia para jantar com calma.', 'Jantar']
    ] },
    { id: 'peixes', t: 'Peixes', items: [
      ['fish', 'Tilápia', 'Um dos pratos mais lembrados pelos clientes.', 'Almoço e jantar'],
      ['fish', 'Peixe frito', 'Crocante por fora, macio por dentro.', 'Jantar'],
      ['fish', 'Isca de peixe', 'Para beliscar com chopp gelado.', 'Petisco']
    ] },
    { id: 'porcoes', t: 'Porções', items: [
      ['fries', 'Batata frita com bacon', 'Porção farta, das que acabam rápido.', 'Para dividir'],
      ['fish', 'Isca de tilápia', 'Empanada na hora, com molho.', 'Para dividir'],
      ['meat', 'Picada mista', 'Carnes variadas para a mesa toda.', 'Para dividir']
    ] },
    { id: 'bebidas', t: 'Bebidas', items: [
      ['beer', 'Chopp gelado', 'Bem tirado, no ponto.', 'Gelado'],
      ['drinkr', 'Daiquiri de morango', 'Drink refrescante da casa.', 'Drink'],
      ['drinky', 'Drink de manga', 'Tropical, bem gelado.', 'Drink'],
      ['drinkg', 'Caipirinhas e cervejas', 'Clássicos de bar, sempre geladinhos.', 'Gelado'],
      ['wine', 'Carta de vinhos', 'Seleção para acompanhar os pratos.', 'Vinho']
    ] }
  ];

  function plate(kind) {
    var s = '<svg class="plate" viewBox="0 0 72 72" aria-hidden="true"><circle class="p-bg" cx="36" cy="36" r="36"/><circle class="p-rim" cx="36" cy="36" r="30"/>';
    var shapes = {
      rice: '<circle cx="27" cy="31" r="11" fill="#f3f2ee"/><circle cx="45" cy="30" r="10" fill="#6b4a1f"/><ellipse cx="36" cy="47" rx="14" ry="8" fill="#c0662f"/>',
      meat: '<ellipse cx="36" cy="37" rx="20" ry="13" fill="#c0662f" transform="rotate(-18 36 37)"/><path d="M22 36q14-10 28-6M24 43q14-8 26-4" stroke="#7a3a14" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="52" cy="50" r="5" fill="#8dbb3f"/>',
      skewer: '<path d="M12 54 60 18" stroke="#f3f2ee" stroke-width="3" stroke-linecap="round"/><rect x="20" y="40" width="13" height="13" rx="4" fill="#c0662f" transform="rotate(-37 26 46)"/><rect x="31" y="31" width="13" height="13" rx="4" fill="#e29a52" transform="rotate(-37 37 37)"/><rect x="42" y="23" width="12" height="12" rx="4" fill="#c0662f" transform="rotate(-37 48 29)"/>',
      fish: '<ellipse cx="33" cy="36" rx="19" ry="11" fill="#e4e1d8"/><path d="M50 36 62 27v18Z" fill="#e4e1d8"/><circle cx="23" cy="33" r="2.6" fill="#050403"/><path d="M30 44q8 6 16 0" stroke="#ffb400" stroke-width="3" fill="none" stroke-linecap="round"/>',
      fries: '<g fill="#ffb400"><rect x="18" y="22" width="7" height="30" rx="2" transform="rotate(-12 21 37)"/><rect x="27" y="18" width="7" height="32" rx="2" transform="rotate(-4 30 34)"/><rect x="36" y="20" width="7" height="32" rx="2" transform="rotate(5 39 36)"/><rect x="45" y="22" width="7" height="30" rx="2" transform="rotate(13 48 37)"/></g><path d="M20 52q14-8 32 0" stroke="#c0662f" stroke-width="5" fill="none" stroke-linecap="round"/>',
      beans: '<circle cx="36" cy="36" r="19" fill="#3a2410"/><g fill="#6b4a1f"><circle cx="28" cy="30" r="3"/><circle cx="40" cy="27" r="3"/><circle cx="45" cy="38" r="3"/><circle cx="33" cy="43" r="3"/></g><ellipse cx="36" cy="36" rx="9" ry="6" fill="#c0662f"/>',
      beer: '<circle cx="34" cy="36" r="19" fill="#ffb400"/><circle cx="34" cy="36" r="13" fill="#f3f2ee"/><rect x="50" y="29" width="14" height="14" rx="7" fill="none" stroke="#ffb400" stroke-width="5"/>',
      drinkr: '<circle cx="36" cy="38" r="20" fill="none" stroke="#f3f2ee" stroke-width="3"/><circle cx="36" cy="38" r="16" fill="#d6405a"/><path d="M44 12 36 34" stroke="#f3f2ee" stroke-width="3" stroke-linecap="round"/><circle cx="46" cy="30" r="6" fill="#8dbb3f"/>',
      drinky: '<circle cx="36" cy="38" r="20" fill="none" stroke="#f3f2ee" stroke-width="3"/><circle cx="36" cy="38" r="16" fill="#ffb400"/><path d="M44 12 36 34" stroke="#f3f2ee" stroke-width="3" stroke-linecap="round"/><circle cx="46" cy="30" r="6" fill="#ff8a2b"/>',
      drinkg: '<circle cx="36" cy="38" r="20" fill="none" stroke="#f3f2ee" stroke-width="3"/><circle cx="36" cy="38" r="16" fill="#cfe58a"/><circle cx="30" cy="34" r="6" fill="#8dbb3f"/><circle cx="43" cy="44" r="6" fill="#8dbb3f"/>',
      wine: '<circle cx="36" cy="36" r="21" fill="none" stroke="#f3f2ee" stroke-width="3"/><circle cx="36" cy="36" r="16" fill="#7a1230"/><ellipse cx="30" cy="30" rx="5" ry="3" fill="#b53a58"/>'
    };
    return s + shapes[kind] + '</svg>';
  }

  (function () {
    var body = $('#menuBody'), jump = $('#menuJump');
    MENU.forEach(function (c) {
      var a = document.createElement('a'); a.href = '#cat-' + c.id; a.textContent = c.t; jump.appendChild(a);
      var s = document.createElement('div'); s.className = 'cat'; s.id = 'cat-' + c.id;
      s.innerHTML = '<div class="cat-head" data-r><h3>' + c.t + '</h3><span>' + c.items.length + ' itens</span></div><div class="items">' +
        c.items.map(function (it, i) { return '<div class="item" data-r style="--i:' + (i % 2) + '">' + plate(it[0]) + '<div><div class="item-top"><h4>' + it[1] + '</h4><span class="tag">' + it[3] + '</span></div><p>' + it[2] + '</p></div></div>'; }).join('') + '</div>';
      body.appendChild(s);
      $$('[data-r]', s).forEach(function (n) { io.observe(n); });
    });
    var links = $$('a', jump);
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (l) { l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id); }); } });
    }, { rootMargin: '-35% 0px -55% 0px' });
    $$('.cat').forEach(function (c) { spy.observe(c); });
  })();

  /* ====== RESERVA: o relógio é o campo de horário ====== */
  (function () {
    var host = $('#resDial'); if (!host) return;
    var now = nowCG();
    var sel = $('#rDay'), out = $('#pOut'), sum = $('#resSum'), go = $('#resGo'), name = $('#rName');
    var people = 2;
    for (var k = 0; k < 7; k++) {
      var d = (now.day + k) % 7, o = document.createElement('option');
      o.value = d; o.textContent = (k === 0 ? 'Hoje · ' : k === 1 ? 'Amanhã · ' : '') + DAYS[d];
      sel.appendChild(o);
    }
    var dial = Dial(host, { day: now.day, hour: 20 });
    var hour = SCHEDULE[now.day].length === 1 && SCHEDULE[now.day][0] === L ? 12 : 20;
    var dayLabel = function (d) { return DAYS[d].toLowerCase(); };

    function refresh() {
      var d = parseInt(sel.value, 10);
      dial.set(hour, isOpen(d, hour) ? 'Mesa disponível' : 'Casa fechada');
      host.setAttribute('aria-valuenow', hour); host.setAttribute('aria-valuetext', fmt(hour));
      out.textContent = people + (people === 1 ? ' pessoa' : ' pessoas');
      var ok = isOpen(d, hour);
      go.disabled = !ok; sum.className = 'res-sum' + (ok ? '' : ' bad');
      sum.textContent = ok
        ? DAYS[d] + ', ' + fmt(hour) + ', ' + people + (people === 1 ? ' pessoa' : ' pessoas') + '. A casa confirma pelo WhatsApp.'
        : 'Nesse horário a casa está fechada. ' + DAYS[d] + ' abre das ' + span(d) + '.';
    }
    function fromPointer(e) {
      var r = host.getBoundingClientRect();
      var x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      var th = (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360;
      var h = ((th - 180 + 360) % 360) / 360 * 24;
      hour = Math.round(h * 2) / 2; if (hour >= 24) hour = 0;
      refresh();
    }
    var drag = false;
    host.addEventListener('pointerdown', function (e) { drag = true; host.setPointerCapture(e.pointerId); host.focus({ preventScroll: true }); fromPointer(e); });
    host.addEventListener('pointermove', function (e) { if (drag) fromPointer(e); });
    host.addEventListener('pointerup', function () { drag = false; });
    host.addEventListener('keydown', function (e) {
      var s = { ArrowRight: .5, ArrowUp: .5, ArrowLeft: -.5, ArrowDown: -.5, PageUp: 2, PageDown: -2 }[e.key];
      if (s) { e.preventDefault(); hour = (hour + s + 24) % 24; refresh(); }
    });
    sel.addEventListener('change', function () { dial.setDay(parseInt(sel.value, 10)); refresh(); });
    $('#pMinus').addEventListener('click', function () { people = Math.max(1, people - 1); refresh(); });
    $('#pPlus').addEventListener('click', function () { people = Math.min(30, people + 1); refresh(); });
    $('#resForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = parseInt(sel.value, 10); if (!isOpen(d, hour)) return;
      var who = name.value.trim();
      var msg = 'Olá, Varandas! Quero reservar uma mesa para ' + people + (people === 1 ? ' pessoa' : ' pessoas') + ', ' + (parseInt(sel.selectedIndex, 10) === 0 ? 'hoje' : parseInt(sel.selectedIndex, 10) === 1 ? 'amanhã' : 'na ' + dayLabel(d)) + ' (' + DAYS[d] + ') às ' + fmt(hour) + '.' + (who ? ' Nome: ' + who + '.' : '') + ' Pode confirmar?';
      window.open(waBase + encodeURIComponent(msg), '_blank', 'noopener');
    });
    refresh();
  })();

  /* ====== números ====== */
  (function () {
    var els = $$('[data-count]');
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; cio.unobserve(e.target);
        var el = e.target, to = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec, 10) || 0, suf = el.dataset.suf || '';
        if (reduce) return;
        var t0 = performance.now();
        (function f(t) {
          var p = Math.min(1, (t - t0) / 1500), v = to * (1 - Math.pow(1 - p, 4));
          el.textContent = v.toFixed(dec).replace('.', ',') + suf;
          if (p < 1) requestAnimationFrame(f);
        })(t0);
      });
    }, { threshold: .4 });
    els.forEach(function (e) { cio.observe(e); });
  })();

  /* ====== horários (tabela) ====== */
  (function () {
    var tb = $('#hoursTable tbody'), today = nowCG().day;
    [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
      var tr = document.createElement('tr'); if (d === today) tr.className = 'today';
      tr.innerHTML = '<td>' + DAYS[d] + '</td><td>' + span(d) + '</td><td>' + (d === today ? 'Hoje' : '') + '</td>';
      tb.appendChild(tr);
    });
  })();

  /* ====== rodapé: a marca construída em blocos ====== */
  (function () {
    var host = $('#footMark'); if (!host) return;
    var hs = [72, 100, 86, 100, 64, 96, 80, 100], cs = ['#ffb400', '#f3f2ee', '#ffb400', '#f3f2ee', '#ffb400', '#e4e1d8', '#ffb400', '#f3f2ee'];
    'VARANDAS'.split('').forEach(function (ch, i) {
      var s = document.createElement('span'); s.textContent = ch; s.style.background = cs[i]; s.style.height = reduce ? hs[i] + '%' : '0%'; host.appendChild(s);
    });
    if (reduce) return;
    var fo = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { $$('span', host).forEach(function (s, i) { setTimeout(function () { s.style.height = hs[i] + '%'; }, i * 70); }); fo.disconnect(); }
    }, { threshold: .3 });
    fo.observe(host);
  })();
})();
