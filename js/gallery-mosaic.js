/* Lantern & Leaves — mosaic album layout.
   Runs right after gallery-shuffle.js and lays the shuffled prints out as a
   gallery wall: justified rows of whole photos (never cropped, each keeps its
   own shape and white matte) broken up by "feature" groups, where one larger
   print sits beside a column (or two, on wide screens) of smaller stacked
   prints. Which photos are featured is picked at random on every shuffle.
   The DOM is reordered to match the visual reading order, so the lightbox
   and keyboard order follow what you see. Each thumbnail's `sizes` is set to
   its real tile width, so phones download small thumbnails.
   Without JS the grid keeps the plain CSS column layout. */
(function () {
  "use strict";

  var grid = document.querySelector(".masonry");
  if (!grid) return;

  var seed = 1;
  function newSeed() {
    if (window.crypto && crypto.getRandomValues) {
      var b = new Uint32Array(1); crypto.getRandomValues(b); seed = b[0] || 1;
    } else {
      seed = (Math.random() * 4294967295) >>> 0 || 1;
    }
  }
  function rngFrom(s) {            // mulberry32: same seed -> same layout on resize
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function ratioOf(a) {
    var img = a.querySelector("img");
    var w = +(img && img.getAttribute("width")) || +a.getAttribute("data-width") || 3;
    var h = +(img && img.getAttribute("height")) || +a.getAttribute("data-height") || 2;
    return w / h;
  }

  function settings(W) {
    if (W < 600) return { gap: 6, rowH: Math.max(108, W * 0.33), cols: 1, maxH: W * 1.15, minH: W * 0.42, every: [2, 3] };
    if (W < 1000) return { gap: 10, rowH: 190, cols: 1, maxH: 560, minH: 260, every: [2, 3] };
    return { gap: 14, rowH: Math.min(300, Math.max(230, W * 0.19)), cols: 2, maxH: Math.min(760, window.innerHeight * 0.92), minH: 380, every: [2, 3] };
  }

  /* Feature group: big print (ratio a) + k stacked columns of two prints.
     All prints keep their shape; solve for the shared height H. */
  function solveFeature(a, cols, W, g) {
    var inv = 0;
    for (var j = 0; j < cols.length; j++) inv += 1 / (1 / cols[j][0] + 1 / cols[j][1]);
    var H = (W - cols.length * g + g * inv) / (a + inv);
    return { H: H, bigW: a * H };
  }

  function layout() {
    var W = grid.clientWidth;
    if (!W) return;
    var s = settings(W), g = s.gap, rnd = rngFrom(seed);
    var items = [];
    var kids = grid.children;
    for (var i = 0; i < kids.length; i++) if (kids[i].classList.contains("photo-link")) items.push(kids[i]);
    if (!items.length) return;
    var r = items.map(ratioOf);
    var order = [], boxes = [], y = 0;
    var rowsUntilFeature = rnd() < 0.65 ? 0 : 1;
    var side = rnd() < 0.5 ? 0 : 1;
    var idx = items.map(function (_, k) { return k; });   // remaining, in shuffled order

    function place(k, x, yy, w, h) { order.push(k); boxes.push([k, x, yy, w, h]); }

    function tryFeature() {
      var need = 1 + 2 * s.cols;
      if (idx.length < need + 1) return false;
      var look = Math.min(idx.length, need + 4);
      var best = null;
      for (var t = 0; t < 8; t++) {
        // pick a big print among the next few, then fill the columns in order
        var bi = Math.floor(rnd() * Math.min(look, 4));
        var rest = idx.slice(0, look).filter(function (_, q) { return q !== bi; });
        var cols = [], used = [];
        for (var c = 0; c < s.cols; c++) {
          var p1 = rest[c * 2], p2 = rest[c * 2 + 1];
          cols.push([r[p1], r[p2]]); used.push(p1, p2);
        }
        var f = solveFeature(r[idx[bi]], cols, W, g);
        var frac = f.bigW / W;
        if (f.H >= s.minH && f.H <= s.maxH && frac >= 0.42 && frac <= 0.74) {
          best = { big: idx[bi], used: used, f: f, cols: cols }; break;
        }
        if (bi === 0 && t > 3) break;
      }
      if (!best) return false;
      var H = best.f.H, bigW = best.f.bigW;
      var bigLeft = side === 0;
      side = 1 - side;
      var x = bigLeft ? bigW + g : 0;
      var colsOut = [];
      for (var c2 = 0; c2 < best.cols.length; c2++) {
        var a1 = best.cols[c2][0], a2 = best.cols[c2][1];
        var cw = (H - g) / (1 / a1 + 1 / a2);
        colsOut.push([x, cw, best.used[c2 * 2], best.used[c2 * 2 + 1], cw / a1]);
        x += cw + g;
      }
      // reading order: big first when on the left, else stacked first
      if (bigLeft) place(best.big, 0, y, bigW, H);
      colsOut.forEach(function (co) {
        place(co[2], co[0], y, co[1], co[4]);
        place(co[3], co[0], y + co[4] + g, co[1], H - co[4] - g);
      });
      if (!bigLeft) place(best.big, W - bigW, y, bigW, H);
      var taken = [best.big].concat(best.used);
      idx = idx.filter(function (k) { return taken.indexOf(k) < 0; });
      y += H + g;
      return true;
    }

    function row() {
      var sum = 0, take = [];
      while (idx.length) {
        var k = idx[0];
        take.push(k); idx.shift(); sum += r[k];
        if (sum * s.rowH + (take.length - 1) * g >= W) break;
      }
      // don't leave a single orphan for the last row
      if (idx.length === 1 && take.length >= 2) { var k2 = idx.shift(); take.push(k2); sum += r[k2]; }
      var H = (W - (take.length - 1) * g) / sum;
      var x = 0, left = 0;
      if (!idx.length && H > s.rowH * 1.35) {          // short last row: keep it natural size, centred
        H = s.rowH * 1.15;
        left = (W - (sum * H + (take.length - 1) * g)) / 2;
      }
      x = left;
      take.forEach(function (k) { var w = r[k] * H; place(k, x, y, w, H); x += w + g; });
      y += H + g;
    }

    while (idx.length) {
      if (rowsUntilFeature <= 0 && tryFeature()) {
        rowsUntilFeature = s.every[0] + Math.floor(rnd() * (s.every[1] - s.every[0] + 1));
        continue;
      }
      row();
      rowsUntilFeature--;
    }

    // Reorder the DOM to reading order (top-left to bottom-right per block).
    var frag = document.createDocumentFragment();
    var dpr = Math.min(3, window.devicePixelRatio || 1);
    var lcpSet = false;
    boxes.forEach(function (b) {
      var a = items[b[0]];
      a.style.left = b[1].toFixed(2) + "px";
      a.style.top = b[2].toFixed(2) + "px";
      a.style.width = b[3].toFixed(2) + "px";
      a.style.height = b[4].toFixed(2) + "px";
      a.classList.toggle("is-feature", b[3] > W * 0.4 && b[4] > s.rowH * 1.3);
      // Tile-sized thumbnails; on 3x phones ask for 2x pixels (looks the same, much lighter).
      var src = a.querySelector("source");
      if (src) src.setAttribute("sizes", Math.ceil(b[3] * (dpr > 2 ? 2 / dpr : 1)) + "px");
      if (!lcpSet && b[3] * b[4] > W * W * 0.12) {           // first big print: load it first
        var im = a.querySelector("img");
        if (im) { im.setAttribute("fetchpriority", "high"); im.setAttribute("loading", "eager"); }
        lcpSet = true;
      }
      frag.appendChild(a);
    });
    grid.appendChild(frag);
    grid.style.height = Math.max(0, y - g).toFixed(0) + "px";
    if (!deferred) deferFar();
  }

  /* The wall packs many prints into the first screens, so hold back the
     ones far below until the visitor scrolls near them; the first screens
     then get the bandwidth. (Browsers' own lazy loading reaches ~1250px.) */
  var deferred = false;
  function deferFar() {
    deferred = true;
    if (!("IntersectionObserver" in window)) return;
    var limit = (window.scrollY || 0) + window.innerHeight * 1.6;
    var gridTop = grid.getBoundingClientRect().top + (window.scrollY || 0);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var a = en.target;
        io.unobserve(a);
        var s = a.querySelector("source[data-srcset]"), im = a.querySelector("img[data-src]");
        if (s) { s.setAttribute("srcset", s.getAttribute("data-srcset")); s.removeAttribute("data-srcset"); }
        if (im) { im.setAttribute("src", im.getAttribute("data-src")); im.removeAttribute("data-src"); }
      });
    }, { rootMargin: "600px 0px" });
    Array.prototype.forEach.call(grid.children, function (a) {
      if (gridTop + a.offsetTop < limit) return;
      var s = a.querySelector("source"), im = a.querySelector("img");
      if (s && s.getAttribute("srcset")) { s.setAttribute("data-srcset", s.getAttribute("srcset")); s.removeAttribute("srcset"); }
      if (im && im.getAttribute("src")) { im.setAttribute("data-src", im.getAttribute("src")); im.removeAttribute("src"); }
      io.observe(a);
    });
  }

  grid.classList.add("mosaic");
  newSeed();
  layout();

  var lastW = grid.clientWidth, t = 0;
  function onResize() {
    if (grid.clientWidth === lastW) return;
    lastW = grid.clientWidth;
    clearTimeout(t);
    t = setTimeout(layout, 120);
  }
  if ("ResizeObserver" in window) new ResizeObserver(onResize).observe(grid);
  else window.addEventListener("resize", onResize);

  window.addEventListener("gallery:reshuffled", function () { newSeed(); layout(); });
  window.__mosaicLayout = layout;
})();

/* Phones: tuck the menu away while scrolling down an album, bring it back on scroll up. */
(function () {
  "use strict";
  var header = document.querySelector(".site-header");
  if (!header || !window.matchMedia) return;
  var mq = matchMedia("(max-width: 560px)");
  var lastY = window.scrollY, ticking = false;
  header.classList.add("can-hide");
  function update() {
    ticking = false;
    var y = window.scrollY;
    if (!mq.matches || document.body.classList.contains("lightbox-open")) { lastY = y; return; }
    var dy = y - lastY;
    if (y < header.offsetHeight + 40 || dy < -6) header.classList.remove("is-tucked");
    else if (dy > 6) header.classList.add("is-tucked");
    if (Math.abs(dy) > 6) lastY = y;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  header.addEventListener("focusin", function () { header.classList.remove("is-tucked"); });
})();
