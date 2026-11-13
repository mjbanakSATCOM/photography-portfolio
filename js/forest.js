/* Lantern & Leaf — forest effects: firefly motes, scroll reveals, parallax,
   lantern-light thumbnails, vine scroll progress, and sparse falling leaves.
   Plain JS, no libraries. Everything motion-related is skipped when the
   visitor prefers reduced motion. */
(function () {
  "use strict";

  window.__forest = true;
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasIO = "IntersectionObserver" in window;

  if (reduce || !hasIO) doc.classList.remove("fx");

  var thumbs = Array.prototype.slice.call(document.querySelectorAll(".masonry > a"));

  /* ---- Lantern-light thumbnails ---- */
  if (canHover) {
    thumbs.forEach(function (a) {
      a.addEventListener("pointermove", function (e) {
        var r = a.getBoundingClientRect();
        a.style.setProperty("--mx", (e.clientX - r.left) + "px");
        a.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
      a.addEventListener("pointerleave", function () {
        a.style.removeProperty("--mx");
        a.style.removeProperty("--my");
      });
    });
  } else if (hasIO) {
    // Touch: photos warm up as they pass through the middle of the screen.
    var litIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target.classList.toggle("is-lit", en.isIntersecting);
      });
    }, { rootMargin: "-25% 0px -25% 0px" });
    thumbs.forEach(function (a) { litIO.observe(a); });
  }

  /* ---- Header state on the home page ---- */
  var header = document.querySelector(".site-header");
  function headerState() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  headerState();

  /* ---- Vine scroll progress (static when motion is reduced) ---- */
  var vine = document.createElement("div");
  vine.className = "vine";
  vine.setAttribute("aria-hidden", "true");
  vine.innerHTML =
    '<div class="vine-fill"></div>' +
    '<svg class="vine-leaf" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6 7 5 13 8 18c1 1.6 2.4 2.7 4 3.5 1.6-.8 3-1.9 4-3.5 3-5 2-11-4-16zm0 4.5v13"/><path d="M12 6.5V20" stroke="#0f1a14" stroke-width="1" fill="none"/></svg>';
  document.body.appendChild(vine);
  var vineFill = vine.querySelector(".vine-fill");
  var vineLeaf = vine.querySelector(".vine-leaf");

  /* ---- Reveal-on-scroll ---- */
  var revealEls = [];
  if (doc.classList.contains("fx")) {
    var groups = document.querySelectorAll(".album-copy, .page-header, .prose, .masonry");
    Array.prototype.forEach.call(groups, function (g) {
      if (g.classList.contains("masonry")) {
        Array.prototype.forEach.call(g.children, function (item, i) {
          item.classList.add("reveal");
          item.style.setProperty("--d", ((i % 8) * 0.07).toFixed(2) + "s");
          revealEls.push(item);
        });
      } else {
        g.classList.add("reveal");
        revealEls.push(g);
      }
    });
    var revIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          revIO.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    revealEls.forEach(function (el) { revIO.observe(el); });
  }

  /* ---- Parallax (hero background/content and section headings) ---- */
  var hero = document.querySelector(".hero");
  var heroBg = hero && hero.querySelector(".hero-bg");
  var heroContent = hero && hero.querySelector(".hero-content");
  var heads = reduce ? [] : Array.prototype.slice.call(document.querySelectorAll(".album-copy h2, .page-header h1"));
  heads.forEach(function (h) { h.classList.add("parallax"); });

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }
  function update() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight;
    headerState();

    var max = Math.max(1, doc.scrollHeight - vh);
    var p = Math.min(1, Math.max(0, y / max));
    vineFill.style.transform = "scaleY(" + p.toFixed(4) + ")";
    vineLeaf.style.transform = "translateY(" + (p * vh).toFixed(1) + "px)";

    if (reduce) return;
    if (heroBg && y < vh * 1.2) {
      heroBg.style.transform = "translate3d(0," + (y * 0.3).toFixed(1) + "px,0)";
      heroContent.style.transform = "translate3d(0," + (y * 0.16).toFixed(1) + "px,0)";
      heroContent.style.opacity = Math.max(0, 1 - y / (vh * 0.75)).toFixed(3);
    }
    for (var i = 0; i < heads.length; i++) {
      var r = heads[i].getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      var off = ((r.top + r.height / 2) - vh / 2) / vh; // -0.5..0.5 roughly
      heads[i].style.transform = "translate3d(0," + (off * -26).toFixed(1) + "px,0)";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();

  if (reduce) return;

  /* ---- Sparse falling leaves between sections ---- */
  var leafSvg =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 3C11 3 4 8 4 16c0 1.6.4 3 1 4l1.5-1.5C9 13 13 10 17 8c-3.5 2.6-7 6.3-9.3 11.2C9 20.4 10.5 21 12 21c6 0 9-6 8-18z"/></svg>';
  var leafColors = ["#b9862f", "#a5582a", "#c79a3e", "#7f8f4e"];
  var sections = document.querySelectorAll(".album-section");
  Array.prototype.forEach.call(sections, function (sec, si) {
    if (si === 0) return;
    var layer = document.createElement("div");
    layer.className = "leaf-layer";
    layer.setAttribute("aria-hidden", "true");
    for (var k = 0; k < 2; k++) {
      var leaf = document.createElement("span");
      leaf.className = "falling-leaf";
      leaf.innerHTML = leafSvg;
      leaf.style.left = (8 + Math.random() * 84).toFixed(1) + "%";
      leaf.style.color = leafColors[(si + k) % leafColors.length];
      leaf.style.setProperty("--dur", (14 + Math.random() * 10).toFixed(1) + "s");
      leaf.style.setProperty("--delay", (-Math.random() * 18).toFixed(1) + "s");
      leaf.style.setProperty("--drift", (Math.random() * 140 - 70).toFixed(0) + "px");
      var s = 12 + Math.random() * 10;
      leaf.style.width = leaf.style.height = s.toFixed(0) + "px";
      layer.appendChild(leaf);
    }
    sec.insertBefore(layer, sec.firstChild);
  });

  /* ---- Firefly / lantern-mote canvas in the hero ---- */
  var canvas = document.querySelector(".motes");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var W = 0, H = 0, motes = [], running = false, visible = true, raf = 0, last = 0;

  function makeMote(initial) {
    return {
      x: Math.random() * W,
      y: initial ? Math.random() * H : H + 20,
      r: 0.8 + Math.random() * 1.9,
      vy: 6 + Math.random() * 16,          // px per second, upward
      sway: 8 + Math.random() * 22,
      phase: Math.random() * Math.PI * 2,
      freq: 0.2 + Math.random() * 0.5,
      tw: 0.6 + Math.random() * 1.6,       // twinkle speed
      hue: Math.random() < 0.8 ? 42 : 70   // amber, a few pale green
    };
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var target = Math.min(W < 600 ? 26 : 60, Math.round((W * H) / 18000));
    while (motes.length < target) motes.push(makeMote(true));
    motes.length = target;
  }

  function frame(t) {
    raf = 0;
    if (!running) return;
    var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
    last = t;
    var time = t / 1000;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      m.y -= m.vy * dt;
      if (m.y < -20) { motes[i] = makeMote(false); continue; }
      var x = m.x + Math.sin(time * m.freq + m.phase) * m.sway;
      var a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * m.tw + m.phase));
      var fade = Math.min(1, m.y / (H * 0.25)); // fade out near the top
      a *= Math.max(0, fade);
      var g = ctx.createRadialGradient(x, m.y, 0, x, m.y, m.r * 7);
      g.addColorStop(0, "hsla(" + m.hue + ",95%,78%," + (0.9 * a).toFixed(3) + ")");
      g.addColorStop(0.25, "hsla(" + m.hue + ",90%,60%," + (0.35 * a).toFixed(3) + ")");
      g.addColorStop(1, "hsla(" + m.hue + ",90%,50%,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, m.y, m.r * 7, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = window.requestAnimationFrame(frame);
  }

  function setRunning() {
    var should = visible && !document.hidden;
    if (should && !running) {
      running = true; last = 0;
      if (!raf) raf = window.requestAnimationFrame(frame);
    } else if (!should && running) {
      running = false;
      if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
    }
  }

  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", setRunning);
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    setRunning();
  }).observe(canvas);
  setRunning();
})();
