/* =========================================================================
   Chén Lù-Wēi — Photography & Text
   1. State + routing   2. Views   3. Map   4. Lightbox   5. Mobile
   ========================================================================= */
(function () {
    'use strict';

    var MOBILE = 900;
    var EASE_MS = 170;                       // 视图切换的柔化间隔
    var VIEWS = ['home', 'photo', 'text', 'notes'];
    var LABELS = { home: 'Selected', photo: 'Fotography', text: 'Texts', notes: 'Notes' };
    var NAV = [['01', 'Home', 'home'], ['02', 'Fotography', 'photo'],
               ['03', 'Texts', 'text'], ['04', 'Notes', 'notes']];
    // 首页图文交替的 12 栏几何
    var GEOM = [
        ['1 / 9',  '9 / 12'],
        ['5 / 13', '1 / 4'],
        ['1 / 6',  '6 / 9'],
        ['8 / 13', '1 / 4'],
        ['4 / 12', '1 / 4']
    ];

    var D = null;
    var state = { view: 'home', text: 'txt-1', photo: 'p1', note: 'n1' };
    var world = null, dimTimer = null;

    var $ = function (id) { return document.getElementById(id); };
    var isMobile = function () { return window.innerWidth <= MOBILE; };

    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    /* ---------------------------------------------------------------------
       柔化切换：先淡出，170ms 后换内容再淡入
       --------------------------------------------------------------------- */
    function soft(fn) {
        var fades = document.querySelectorAll('.fade');
        fades.forEach(function (f) { f.classList.add('is-dim'); });
        clearTimeout(dimTimer);
        dimTimer = setTimeout(function () {
            fn();
            fades.forEach(function (f) { f.classList.remove('is-dim'); });
        }, EASE_MS);
    }

    /* ---------------------------------------------------------------------
       1. 视图切换
       --------------------------------------------------------------------- */
    function setView(v, opts) {
        opts = opts || {};
        if (VIEWS.indexOf(v) === -1) v = 'home';
        state.view = v;
        if (opts.text)  state.text  = opts.text;
        if (opts.photo) state.photo = opts.photo;

        VIEWS.forEach(function (name) {
            $('view-' + name).classList.toggle('is-on', name === v);
        });

        $('viewLabel').textContent = LABELS[v];
        $('viewMark').textContent =
            String(VIEWS.indexOf(v) + 1).padStart(2, '0') + ' / ' +
            String(VIEWS.length).padStart(2, '0');

        document.querySelectorAll('.nav-item').forEach(function (a) {
            a.classList.toggle('is-active', a.dataset.view === v);
        });

        document.body.classList.toggle('has-index', v !== 'home');
        closeIndex();
        closeMenu();

        if (v === 'photo') renderPhoto();
        if (v === 'text')  renderText();
        if (v === 'notes') renderNotes();

        if ($('main')) $('main').scrollTop = 0;
        if (isMobile()) window.scrollTo(0, 0);

        var hash = '#' + v;
        if (window.location.hash !== hash) history.replaceState(null, '', hash);
    }

    function go(v, opts) {
        if (v === state.view && !opts) return;
        soft(function () { setView(v, opts); });
    }

    /* ---------------------------------------------------------------------
       2. 渲染
       --------------------------------------------------------------------- */
    function renderNav() {
        var box = $('navList');
        box.textContent = '';
        NAV.forEach(function (n) {
            var a = el('a', 'nav-item');
            a.href = '#' + n[2];
            a.dataset.view = n[2];
            a.appendChild(el('span', 'nav-num', n[0]));
            a.appendChild(el('span', 'nav-label', n[1]));
            a.addEventListener('click', function (e) { e.preventDefault(); go(n[2]); });
            box.appendChild(a);
        });
        $('tagline').textContent = new Date().toLocaleDateString('en-GB', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    }

    function renderHome() {
        var items = D.homeCols.reduce(function (a, c) { return a.concat(c.items); }, []);
        var box = $('homeItems');
        box.textContent = '';

        items.forEach(function (it, i) {
            var g = GEOM[i % GEOM.length];
            var row = el('div', 'home-item');

            var imgCol = el('div', 'home-img-col');
            imgCol.style.gridColumn = g[0];
            var img = el('img');
            img.src = it.img;
            img.alt = it.subItalic ? it.subItalic + ' — ' + it.left : (it.left || '');
            img.loading = i === 0 ? 'eager' : 'lazy';
            img.decoding = 'async';
            if (it.gray) img.classList.add('is-gray');
            imgCol.appendChild(img);

            var capCol = el('div', 'home-cap-col');
            capCol.style.gridColumn = g[1];
            capCol.appendChild(el('div', 'home-left', it.left || ''));
            capCol.appendChild(el('div', 'home-sub', it.subItalic || ''));
            (it.body || []).forEach(function (p) {
                capCol.appendChild(el('p', 'home-body', p));
            });

            row.appendChild(imgCol);
            row.appendChild(capCol);
            box.appendChild(row);
        });

        var flow = $('homeFlow');
        flow.textContent = '';
        (D.flow || []).forEach(function (f) {
            var a = el('a', 'flow-item');
            a.href = '#';
            a.appendChild(el('span', 'flow-num', f.num));
            a.appendChild(el('span', 'flow-text', String(f.text).replace(/,$/, '')));
            a.addEventListener('click', function (e) {
                e.preventDefault();
                if (f.section === 'text') go('text', { text: f.id });
                else go('photo', { photo: f.id });
            });
            flow.appendChild(a);
        });
    }

    function renderRows(boxId, list, activeId, onPick) {
        var box = $(boxId);
        box.textContent = '';
        (list || []).forEach(function (r) {
            var b = el('button', 'index-row');
            b.type = 'button';
            if (r.id === activeId) b.classList.add('is-active');
            b.setAttribute('aria-current', r.id === activeId ? 'true' : 'false');
            b.appendChild(el('span', 'index-title', r.title));
            b.appendChild(el('span', 'index-year', r.year || ''));
            b.addEventListener('click', function () {
                if (r.id === activeId) { closeIndex(); return; }
                soft(function () { onPick(r.id); });
            });
            box.appendChild(b);
        });
    }

    function renderPhoto() {
        renderRows('photoRows', D.photoIndex, state.photo, function (id) {
            state.photo = id; renderPhoto();
        });
        var meta = (D.photoIndex || []).filter(function (p) { return p.id === state.photo; })[0] || {};
        $('photoTitle').textContent = meta.title || '';

        var g = $('photoGallery');
        g.textContent = '';
        ((D.galleries || {})[state.photo] || []).forEach(function (src, i) {
            var img = el('img');
            img.src = src;
            img.alt = (meta.title || 'Photograph') + ' — ' + (i + 1);
            img.loading = 'lazy';
            img.decoding = 'async';
            g.appendChild(img);
        });

        var loc = (D.places || {})[state.photo];
        $('mapPlace').textContent = loc ? loc.place : '';
        $('mapCoords').textContent = loc
            ? Math.abs(loc.lat).toFixed(3) + '° ' + (loc.lat >= 0 ? 'N' : 'S') +
              '  /  ' + Math.abs(loc.lon).toFixed(3) + '° ' + (loc.lon >= 0 ? 'E' : 'W')
            : '';
        drawMap();
        closeIndex();
    }

    function renderText() {
        renderRows('textRows', D.textIndex, state.text, function (id) {
            state.text = id; renderText();
        });
        var a = (D.articles || {})[state.text] || { title: '', paragraphs: [] };
        $('articleTitle').textContent = a.title || '';
        var body = $('articleBody');
        body.textContent = '';
        (a.paragraphs || []).forEach(function (p) { body.appendChild(el('p', null, p)); });

        var cover = (D.covers || {})[state.text] || '';
        var img = $('coverImg');
        if (cover) { img.src = cover; img.alt = (a.title || '') + ' — cover'; img.style.display = ''; }
        else { img.removeAttribute('src'); img.style.display = 'none'; }
        closeIndex();
    }

    function renderNotes() {
        var notes = D.notes || [];
        var rows = notes.map(function (n, i) {
            return { id: n.id, title: n.title || 'Note ' + String(i + 1).padStart(2, '0'), year: n.date };
        });
        renderRows('noteRows', rows, state.note, function (id) {
            state.note = id; renderNotes();
        });
        var active = notes.filter(function (n) { return n.id === state.note; })[0] || notes[0] || {};
        var idx = notes.indexOf(active);
        $('noteTitle').textContent = active.title || 'Note ' + String(Math.max(0, idx) + 1).padStart(2, '0');
        var g = $('noteGallery');
        g.textContent = '';
        if (active.img) {
            var img = el('img');
            img.src = active.img;
            img.alt = active.caption || $('noteTitle').textContent;
            img.loading = 'lazy';
            img.decoding = 'async';
            g.appendChild(img);
        }
        closeIndex();
    }

    /* ---------------------------------------------------------------------
       3. 地图：自绘墨卡托，无外部依赖
       --------------------------------------------------------------------- */
    var SPAN = 9;                                  // 视野 ±9°

    function mercY(latDeg) {
        var p = latDeg * Math.PI / 180;
        return Math.log(Math.tan(Math.PI / 4 + p / 2));
    }

    function drawMap() {
        var host = $('mapCanvas');
        if (!host || !world) return;
        var loc = (D.places || {})[state.photo];
        if (!loc) return;
        var w = host.clientWidth, h = host.clientHeight;
        if (!w || !h) return;

        var key = state.photo + ':' + w + 'x' + h;
        if (host.dataset.drawn === key) return;
        host.dataset.drawn = key;

        var k = (w / (SPAN * Math.PI / 180)) / 2;
        var y0 = mercY(loc.lat);
        var px = function (lon, lat) {
            return [k * (lon - loc.lon) * Math.PI / 180 + w / 2,
                    h / 2 - k * (mercY(lat) - y0)];
        };

        var NS = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('width', w);
        svg.setAttribute('height', h);
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.style.display = 'block';

        // 可视经纬范围
        var halfLon = (w / 2) / k * 180 / Math.PI;
        var lonMin = loc.lon - halfLon, lonMax = loc.lon + halfLon;
        var latSpan = (h / 2) / k * 180 / Math.PI;
        var latMin = Math.max(-84, loc.lat - latSpan * 1.4);
        var latMax = Math.min(84, loc.lat + latSpan * 1.4);

        // 1° 经纬网
        var grat = document.createElementNS(NS, 'path');
        var gd = '';
        for (var lon = Math.ceil(lonMin); lon <= lonMax; lon++) {
            var a = px(lon, latMin), b = px(lon, latMax);
            gd += 'M' + a[0].toFixed(1) + ',' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ',' + b[1].toFixed(1);
        }
        for (var lat = Math.ceil(latMin); lat <= latMax; lat++) {
            var c = px(lonMin, lat), e2 = px(lonMax, lat);
            gd += 'M' + c[0].toFixed(1) + ',' + c[1].toFixed(1) + 'L' + e2[0].toFixed(1) + ',' + e2[1].toFixed(1);
        }
        grat.setAttribute('d', gd);
        grat.setAttribute('fill', 'none');
        grat.setAttribute('stroke', 'rgba(27,28,27,0.13)');
        grat.setAttribute('stroke-width', '0.5');
        svg.appendChild(grat);

        // 陆地
        var land = document.createElementNS(NS, 'path');
        var d = '';
        var pad = 40;
        world.f.forEach(function (feat) {
            var polys = feat.t === 'P' ? [feat.c] : feat.c;
            polys.forEach(function (poly) {
                poly.forEach(function (ring) {
                    var seg = '', on = false, any = false;
                    for (var i = 0; i < ring.length; i++) {
                        var p = px(ring[i][0], ring[i][1]);
                        if (!isFinite(p[0]) || !isFinite(p[1])) { on = false; continue; }
                        var vis = p[0] > -pad && p[0] < w + pad && p[1] > -pad && p[1] < h + pad;
                        if (vis) any = true;
                        seg += (on ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1);
                        on = true;
                    }
                    if (any && seg) d += seg + 'Z';
                });
            });
        });
        land.setAttribute('d', d);
        land.setAttribute('fill', 'rgba(27,28,27,0.045)');
        land.setAttribute('stroke', 'rgba(27,28,27,0.3)');
        land.setAttribute('stroke-width', '0.5');
        land.setAttribute('fill-rule', 'evenodd');
        svg.appendChild(land);

        host.textContent = '';
        host.appendChild(svg);
    }

    /* ---------------------------------------------------------------------
       4. 灯箱
       --------------------------------------------------------------------- */
    function initLightbox() {
        var box = $('lightbox'), img = $('lbImg');
        if (!box || !img) return;
        var group = [], idx = 0, last = null, timer = null;

        function paint() {
            var src = group[idx];
            if (!src) return;
            img.classList.add('is-swapping');
            var pre = new Image();
            pre.onload = pre.onerror = function () {
                img.src = src.src;
                img.alt = src.alt || '';
                img.classList.remove('is-swapping');
            };
            pre.src = src.src;
            $('lbCaption').textContent = (src.alt || '').replace(/\s*[—-]\s*\d+\s*$/, '');
            $('lbCount').textContent = group.length > 1 ? (idx + 1) + ' / ' + group.length : '';
        }

        function open(target) {
            var scope = target.closest('.gallery') || target.closest('#homeItems');
            group = scope ? Array.prototype.slice.call(scope.querySelectorAll('img')) : [target];
            idx = Math.max(0, group.indexOf(target));
            last = document.activeElement;
            clearTimeout(timer);
            box.hidden = false;
            document.body.classList.add('is-locked');
            paint();
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    box.classList.add('is-on');
                    box.querySelector('[data-lb-close]').focus();
                });
            });
        }

        function close() {
            box.classList.remove('is-on');
            document.body.classList.remove('is-locked');
            timer = setTimeout(function () { box.hidden = true; img.removeAttribute('src'); }, 450);
            if (last && last.focus) last.focus();
        }

        function step(n) {
            if (group.length < 2) { close(); return; }
            idx = (idx + n + group.length) % group.length;
            paint();
        }

        document.addEventListener('click', function (e) {
            var t = e.target;
            if (t.tagName !== 'IMG') return;
            if (!t.closest('.gallery') && !t.closest('#homeItems')) return;
            open(t);
        });

        box.querySelector('[data-lb-close]').addEventListener('click', close);
        box.querySelector('[data-lb-prev]').addEventListener('click', function () { step(-1); });
        box.querySelector('[data-lb-next]').addEventListener('click', function () { step(1); });

        document.addEventListener('keydown', function (e) {
            if (box.hidden) return;
            if (e.key === 'Escape')     { e.preventDefault(); close(); }
            if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        });
    }

    /* ---------------------------------------------------------------------
       5. 移动端
       --------------------------------------------------------------------- */
    function closeMenu() {
        var n = $('nav'), t = $('menuToggle');
        if (!n || !t) return;
        n.classList.remove('is-open');
        t.textContent = 'Menu';
        t.setAttribute('aria-expanded', 'false');
    }

    function closeIndex() {
        document.querySelectorAll('.side').forEach(function (s) { s.classList.remove('is-open'); });
        var b = $('indexToggle');
        if (b) { b.textContent = 'Index'; b.setAttribute('aria-expanded', 'false'); }
    }

    function initMobile() {
        var t = $('menuToggle');
        if (t) t.addEventListener('click', function () {
            var n = $('nav');
            var open = !n.classList.contains('is-open');
            closeIndex();
            n.classList.toggle('is-open', open);
            t.textContent = open ? 'Close' : 'Menu';
            t.setAttribute('aria-expanded', String(open));
        });

        var b = $('indexToggle');
        if (b) b.addEventListener('click', function () {
            var side = $('view-' + state.view).querySelector('.side');
            if (!side) return;
            var open = !side.classList.contains('is-open');
            closeMenu();
            side.classList.toggle('is-open', open);
            b.textContent = open ? 'Close' : 'Index';
            b.setAttribute('aria-expanded', String(open));
        });

        window.addEventListener('resize', function () {
            if (!isMobile()) { closeMenu(); closeIndex(); }
            var host = $('mapCanvas');
            if (host) { delete host.dataset.drawn; drawMap(); }
        });
    }

    /* ---------------------------------------------------------------------
       启动
       --------------------------------------------------------------------- */
    document.addEventListener('DOMContentLoaded', function () {
        try {
            D = JSON.parse($('site-data').textContent);
        } catch (e) {
            document.body.innerHTML = '<p style="padding:40px;font-family:serif">Site data failed to load.</p>';
            return;
        }

        renderNav();
        renderHome();
        initLightbox();
        initMobile();

        var start = (window.location.hash || '#home').slice(1);
        setView(VIEWS.indexOf(start) === -1 ? 'home' : start);

        window.addEventListener('hashchange', function () {
            var v = (window.location.hash || '#home').slice(1);
            if (v !== state.view) go(VIEWS.indexOf(v) === -1 ? 'home' : v);
        });

        fetch('assets/data/world.json')
            .then(function (r) { return r.json(); })
            .then(function (w) { world = w; drawMap(); })
            .catch(function () {});
    });
})();
