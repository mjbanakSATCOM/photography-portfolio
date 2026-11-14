/* Lantern & Leaves: rotating Bible verses (left) and quotes (right) in the
   home hero. Verses: Legacy Standard Bible (see the footer notice). Sources
   for every quote: /workspace/gallery-keeper/hero-quotes.json.
   Opacity-only fades on small text blocks; paused while the tab is hidden;
   static when the visitor prefers reduced motion. */
(function () {
  "use strict";
  var VERSES = [
 {
  "t": "Your word is a lamp to my feet\nAnd a light to my path.",
  "r": "Psalm 119:105 (LSB)"
 },
 {
  "t": "Yahweh is my light and my salvation;\nWhom shall I fear?\nYahweh is the strong defense of my life;\nWhom shall I dread?",
  "r": "Psalm 27:1 (LSB)"
 },
 {
  "t": "For with You is the fountain of life;\nIn Your light we see light.",
  "r": "Psalm 36:9 (LSB)"
 },
 {
  "t": "Oh send out Your light and Your truth, let them lead me;\nLet them bring me to Your holy mountain\nAnd to Your dwelling places.",
  "r": "Psalm 43:3 (LSB)"
 },
 {
  "t": "I am the Light of the world; he who follows Me will never walk in the darkness, but will have the Light of life.",
  "r": "John 8:12 (LSB)"
 },
 {
  "t": "But the path of the righteous is like the light of dawn,\nThat shines brighter and brighter until the fullness of day.",
  "r": "Proverbs 4:18 (LSB)"
 },
 {
  "t": "For You light my lamp;\nYahweh my God illumines my darkness.",
  "r": "Psalm 18:28 (LSB)"
 },
 {
  "t": "Though I fall I will rise;\nThough I inhabit the darkness, Yahweh is a light for me.",
  "r": "Micah 7:8 (LSB)"
 },
 {
  "t": "God is Light, and in Him there is no darkness at all.",
  "r": "1 John 1:5 (LSB)"
 },
 {
  "t": "The unfolding of Your words gives light;\nIt gives understanding to the simple.",
  "r": "Psalm 119:130 (LSB)"
 }
];
  var QUOTES = [
 {
  "t": "The clearest way into the Universe is through a forest wilderness.",
  "r": "John Muir"
 },
 {
  "t": "The forests of America, however slighted by man, must have been a great delight to God; for they were the best he ever planted.",
  "r": "John Muir"
 },
 {
  "t": "…in Wildness is the preservation of the World.",
  "r": "Henry David Thoreau"
 },
 {
  "t": "May it be a light to you in dark places, when all other lights go out.",
  "r": "J.R.R. Tolkien"
 },
 {
  "t": "Not all those who wander are lost.",
  "r": "J.R.R. Tolkien"
 },
 {
  "t": "In all my works I take the part of trees as against all their enemies.",
  "r": "J.R.R. Tolkien"
 },
 {
  "t": "He does not despise real woods because he has read of enchanted woods: the reading makes all real woods a little enchanted.",
  "r": "C.S. Lewis"
 },
 {
  "t": "I believe in Christianity as I believe that the sun has risen. Not only because I see it, but because by it I see everything else.",
  "r": "C.S. Lewis"
 },
 {
  "t": "There are always two people in every picture: the photographer and the viewer.",
  "r": "Ansel Adams"
 },
 {
  "t": "If what I see in my mind excites me, there is a good chance it will make a good photograph.",
  "r": "Ansel Adams"
 }
];

  var hero = document.querySelector(".hero");
  if (!hero) return;
  var FADE = 1200, HOLD = 5000, STAGGER = 2500;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var sideMQ = window.matchMedia("(min-width: 1240px) and (min-height: 600px)");

  // Placement (desktop): verses lean left, quotes lean right. Spots above and
  // below the title block are used only when they keep the full CLEAR (~1.5in);
  // side spots hug the block at CLEAR, or at the most clearance the window
  // allows while keeping the side block SIDEW wide.
  var CLEAR = 150, MINW = 180, SIDEW = 215, MAXW = 300, EDGE = 24;
  var SIDE_Y = [0.06, 0.3, 0.5, 0.7, 0.94], TB_X = [0.12, 0.6];

  function bag(items) {             // shuffle bag: no repeats until all shown
    var order = [], last = -1;
    return function () {
      if (!order.length) {
        order = items.map(function (_, i) { return i; });
        for (var i = order.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t;
        }
        if (order.length > 1 && order[order.length - 1] === last) order.unshift(order.pop());
      }
      last = order.pop();
      return items[last];
    };
  }

  function fill(el, item) {
    el.textContent = "";
    var p = document.createElement("p");
    p.className = "hq-text";
    item.t.split("\n").forEach(function (line, i) {
      if (i) p.appendChild(document.createElement("br"));
      p.appendChild(document.createTextNode(line));
    });
    var c = document.createElement("p");
    c.className = "hq-ref";
    c.textContent = item.r;
    el.appendChild(p);
    el.appendChild(c);
  }

  var timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function stopAll() { timers.forEach(clearTimeout); timers = []; }

  function sideCycler(side, items) {
    var box = hero.querySelector(".hq-" + side);
    var el = box.querySelector(".hq-item");
    var next = bag(items), lastSlot = "";
    var L = side === "left";
    function rel(sel, text) {
      var e = hero.querySelector(sel) || document.querySelector(sel), r;
      if (!e) return null;
      if (text) { var g = document.createRange(); g.selectNodeContents(e); r = g.getBoundingClientRect(); }
      else r = e.getBoundingClientRect();
      var h = hero.getBoundingClientRect();
      return { l: r.left - h.left, t: r.top - h.top, r: r.right - h.left, b: r.bottom - h.top };
    }
    function hits(a, b, m) {
      return b && a.l < b.r + m && b.l < a.r + m && a.t < b.b + m && b.t < a.b + m;
    }
    function heightAt(w) { el.style.width = w + "px"; return el.offsetHeight; }
    function candidates() {
      var W = hero.clientWidth, H = hero.clientHeight;
      var hc = hero.querySelector(".hero-content");
      var pad = (hc && parseFloat(getComputedStyle(hc).paddingLeft)) || 40;
      var parts = [rel(".hero-eyebrow", true), rel(".hero-name", true), rel(".hero-tagline", true)].filter(Boolean);
      var blk = { l: Math.min.apply(0, parts.map(function (p) { return p.l; })),
                  t: Math.min.apply(0, parts.map(function (p) { return p.t; })),
                  r: Math.max.apply(0, parts.map(function (p) { return p.r; })),
                  b: Math.max.apply(0, parts.map(function (p) { return p.b; })) };
      var head = rel(".site-header"), cue = rel(".scroll-cue");
      var top = (head ? Math.max(0, head.b) : 0) + EDGE, bottom = H - EDGE;
      var room = L ? blk.l - pad : W - pad - blk.r;            // beside the block
      var cs = Math.max(EDGE, Math.min(CLEAR, room - SIDEW));   // side clearance
      var sw = Math.min(MAXW, room - cs), out = [];
      function add(id, x, y, w, h, clear) {
        var c = { l: x, t: y, r: x + w, b: y + h };
        if (w < MINW || c.l < pad - 1 || c.r > W - pad + 1 || c.t < top || c.b > bottom) return;
        if (hits(c, blk, clear - 1) || hits(c, cue, 16)) return;
        if (L ? c.r > W / 2 - 12 : c.l < W / 2 + 12) return;   // own half only
        out.push({ id: id, x: x, y: y, w: w, clear: clear });
      }
      if (sw >= MINW) {
        var sh = heightAt(sw);
        SIDE_Y.forEach(function (f, i) {
          add("S" + i, L ? blk.l - cs - sw : blk.r + cs, top + f * Math.max(0, bottom - top - sh), sw, sh, cs);
        });
      }
      var tw = Math.min(MAXW, W / 2 - 12 - pad), th = heightAt(tw);
      TB_X.forEach(function (f, i) {
        var x = L ? pad + f * (W / 2 - 12 - pad - tw) : W / 2 + 12 + (1 - f) * (W / 2 - 12 - pad - tw);
        add("T" + i, x, Math.max(top, blk.t - CLEAR - th - 24), tw, th, CLEAR);
        add("B" + i, x, blk.b + CLEAR + 24, tw, th, CLEAR);
      });
      return out;
    }
    function place() {
      var c = candidates(), pool = c.filter(function (s) { return s.id !== lastSlot; });
      if (!pool.length) pool = c;
      if (!pool.length) { el.style.visibility = "hidden"; return; }   // nowhere clear
      var s = pool[Math.floor(Math.random() * pool.length)];
      lastSlot = s.id;
      el.style.visibility = "";
      el.style.width = s.w + "px";
      el.style.left = Math.round(s.x) + "px";
      el.style.top = Math.round(s.y) + "px";
      el.setAttribute("data-slot", s.id);
      el.setAttribute("data-clear", Math.round(s.clear));
    }
    function show(firstHold) {
      fill(el, next());
      place();
      el.classList.add("is-on");
      later(function () {
        el.classList.remove("is-on");
        later(function () { show(0); }, FADE + 150);
      }, FADE + HOLD + (firstHold || 0));
    }
    return { start: function (delay, firstHold) { later(function () { show(firstHold); }, delay); },
             still: function () { fill(el, items[0]); lastSlot = ""; place(); el.classList.add("is-on"); },
             replace: function () { if (el.classList.contains("is-on")) { lastSlot = ""; place(); } },
             hide: function () { el.classList.remove("is-on"); } };
  }

  function lineCycler() {
    var el = hero.querySelector(".hq-line .hq-item");
    var nv = bag(VERSES), nq = bag(QUOTES), n = 0;
    function show() {
      fill(el, n++ % 2 === 0 ? nv() : nq());
      el.classList.add("is-on");
      later(function () {
        el.classList.remove("is-on");
        later(show, FADE + 150);
      }, FADE + HOLD);
    }
    return { start: function (delay) { later(show, delay); },
             still: function () {
               el.textContent = "";
               var a = document.createElement("div"), b = document.createElement("div");
               fill(a, VERSES[0]); fill(b, QUOTES[0]); b.className = "hq-second";
               el.appendChild(a); el.appendChild(b); el.classList.add("is-on");
             },
             hide: function () { el.classList.remove("is-on"); } };
  }

  var left = sideCycler("left", VERSES), right = sideCycler("right", QUOTES), line = lineCycler();

  function run() {
    stopAll();
    var side = sideMQ.matches;
    hero.classList.toggle("hq-mode-side", side);
    hero.classList.toggle("hq-mode-line", !side);
    left.hide(); right.hide(); line.hide();
    if (reduce) {
      if (side) { left.still(); right.still(); } else { line.still(); }
      return;
    }
    if (side) {
      left.start(300, 0);
      right.start(300, STAGGER);    // right holds 2.5s longer the first time
    } else {
      line.start(300);
    }
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { stopAll(); } else { run(); }
  });
  function replaceSides() { if (sideMQ.matches) { left.replace(); right.replace(); } }
  // the title's real width is known only once its web font has loaded
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(replaceSides);
  var rz;
  window.addEventListener("resize", function () {
    clearTimeout(rz);
    rz = setTimeout(replaceSides, 200);
  });
  if (sideMQ.addEventListener) sideMQ.addEventListener("change", run);
  else if (sideMQ.addListener) sideMQ.addListener(run);
  run();
})();
