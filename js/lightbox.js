/* Lantern & Leaves — photo viewer.
   Desktop: golden-halo lightbox with arrows and keyboard.
   Phones: edge-to-edge photo, swipe left/right to browse (in the album's
   shuffled order), swipe down or tap X to close, browser Back closes it,
   pinch-zoom works (a sharper copy loads when you zoom in), the page behind
   stays put, and the neighbouring photos are preloaded. */
(function () {
  "use strict";

  function currentLinks() {
    var inGrid = Array.prototype.slice.call(document.querySelectorAll(".masonry .photo-link"));
    return inGrid.length ? inGrid : Array.prototype.slice.call(document.querySelectorAll(".photo-link"));
  }

  if (!currentLinks().length) return;

  var index = 0;
  var lastFocus = null;
  var isOpen = false;
  var pushed = false;
  var lockedY = 0;
  var coarse = window.matchMedia && matchMedia("(pointer: coarse)").matches;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var root = document.createElement("div");
  root.className = "lightbox";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Photograph viewer");
  root.innerHTML =
    '<button type="button" class="lightbox-btn lightbox-close" aria-label="Close">&times;</button>' +
    '<button type="button" class="lightbox-btn lightbox-prev" aria-label="Previous photograph">&#8249;</button>' +
    '<div class="lightbox-stage">' +
    '<figure class="lightbox-figure">' +
    '  <picture>' +
    '    <source class="lightbox-webp" type="image/webp">' +
    '    <img class="lightbox-image" alt="" draggable="false">' +
    "  </picture>" +
    '  <figcaption class="lightbox-caption"><span class="lightbox-name"></span><span class="lightbox-count"></span></figcaption>' +
    "</figure>" +
    "</div>" +
    '<span class="lightbox-spinner" aria-hidden="true"></span>' +
    '<p class="lightbox-hint" aria-hidden="true">Swipe to browse</p>' +
    '<button type="button" class="lightbox-btn lightbox-next" aria-label="Next photograph">&#8250;</button>';
  document.body.appendChild(root);

  var stage = root.querySelector(".lightbox-stage");
  var figure = root.querySelector(".lightbox-figure");
  var img = root.querySelector(".lightbox-image");
  var webp = root.querySelector(".lightbox-webp");
  var nameEl = root.querySelector(".lightbox-name");
  var countEl = root.querySelector(".lightbox-count");
  var hint = root.querySelector(".lightbox-hint");
  var btnClose = root.querySelector(".lightbox-close");
  var btnPrev = root.querySelector(".lightbox-prev");
  var btnNext = root.querySelector(".lightbox-next");
  var clearTimer = 0;
  var cache = {};
  var shownKey = "";

  function loaded() { root.classList.remove("is-loading"); }
  img.addEventListener("load", loaded);
  img.addEventListener("error", loaded);

  function photoData(link) {
    return {
      jpg: link.getAttribute("data-full-jpg") || link.getAttribute("href"),
      webp: link.getAttribute("data-full-webp") || "",
      mid: link.getAttribute("data-mid-webp") || "",
      width: +link.getAttribute("data-width") || 0,
      height: +link.getAttribute("data-height") || 0,
      // alt describes the photo (thumbnail alt); the caption is the photo's title (data-alt)
      alt: (link.querySelector("img") || {}).alt || link.getAttribute("data-alt") || "",
      caption: link.getAttribute("data-alt") || (link.querySelector("img") || {}).alt || "",
    };
  }

  /* Phones get the 1600px copy unless the screen really needs more pixels. */
  function bestWebp(d, forceFull) {
    if (!d.webp) return "";
    if (forceFull || !d.mid || !d.width || !d.height) return d.webp;
    var vw = window.innerWidth, vh = window.innerHeight;
    var cssW = Math.min(vw, vh * d.width / d.height);
    var need = cssW * Math.min(3, window.devicePixelRatio || 1);
    var midW = d.width >= d.height ? 1600 : 1600 * d.width / d.height;
    return midW >= need * 0.9 ? d.mid : d.webp;
  }

  function preload(i) {
    var list = currentLinks();
    if (list.length < 2) return;
    var d = photoData(list[(i + list.length) % list.length]);
    var u = bestWebp(d) || d.jpg;
    if (cache[u]) return;
    var im = new Image();
    im.decoding = "async";
    im.src = u;
    cache[u] = im;
  }

  function show(i) {
    var list = currentLinks();
    if (!list.length) return;
    index = (i + list.length) % list.length;
    var d = photoData(list[index]);
    img.alt = d.alt;
    if (d.width) img.setAttribute("width", d.width);
    if (d.height) img.setAttribute("height", d.height);
    var w = bestWebp(d);
    if (w) webp.setAttribute("srcset", w); else webp.removeAttribute("srcset");
    root.setAttribute("data-full", d.webp);
    if (shownKey !== (w || d.jpg)) {
      shownKey = w || d.jpg;
      root.classList.add("is-loading");
      img.src = d.jpg;
      if (img.complete && img.naturalWidth) loaded();
    }
    nameEl.textContent = d.caption;
    countEl.textContent = (index + 1) + " / " + list.length;
    btnPrev.disabled = list.length < 2;
    btnNext.disabled = list.length < 2;
    preload(index + 1);
    preload(index - 1);
    if (pushed) {
      try { history.replaceState({ llLightbox: index }, ""); } catch (e) {}
    }
  }

  function lockScroll() {
    lockedY = window.scrollY || window.pageYOffset;
    document.body.style.top = -lockedY + "px";
    document.body.classList.add("lightbox-open");
  }
  function unlockScroll() {
    document.body.classList.remove("lightbox-open");
    document.body.style.top = "";
    window.scrollTo(0, lockedY);
  }

  function open(i) {
    lastFocus = document.activeElement;
    if (clearTimer) { clearTimeout(clearTimer); clearTimer = 0; }
    isOpen = true;
    show(i);
    lockScroll();
    root.classList.add("is-open");
    if (coarse && !sessionStorageGet("ll-swipe-hint")) {
      root.classList.add("show-hint");
      setTimeout(function () { root.classList.remove("show-hint"); }, 2600);
      sessionStorageSet("ll-swipe-hint", "1");
    }
    try { history.pushState({ llLightbox: index }, ""); pushed = true; } catch (e) { pushed = false; }
    btnClose.focus({ preventScroll: true });
  }

  function finishClose() {
    if (!isOpen) return;
    isOpen = false;
    root.classList.remove("is-open", "is-dragging");
    figure.style.transform = "";
    root.style.removeProperty("--fade");
    unlockScroll();
    clearTimer = setTimeout(function () {
      clearTimer = 0;
      img.removeAttribute("src");
      webp.removeAttribute("srcset");
      shownKey = "";
    }, 500);
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus({ preventScroll: true });
  }

  /* Close from the UI: step back through history so Back isn't "used up". */
  function close() {
    if (!isOpen) return;
    if (pushed && history.state && history.state.llLightbox !== undefined) {
      pushed = false;
      finishClose();
      history.back();
    } else {
      pushed = false;
      finishClose();
    }
  }

  window.addEventListener("popstate", function () {
    if (isOpen) { pushed = false; finishClose(); }
  });

  function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  /* Slide to the next/previous photo. */
  function go(dir) {
    if (currentLinks().length < 2) return;
    if (reduce) { show(index + dir); return; }
    figure.style.transition = "transform 0.22s ease-in, opacity 0.22s ease-in";
    figure.style.transform = "translate3d(" + (-dir * 40) + "%,0,0)";
    figure.style.opacity = "0";
    setTimeout(function () {
      show(index + dir);
      figure.style.transition = "none";
      figure.style.transform = "translate3d(" + (dir * 40) + "%,0,0)";
      void figure.offsetWidth;
      figure.style.transition = "transform 0.32s cubic-bezier(0.2,0.7,0.2,1), opacity 0.32s ease";
      figure.style.transform = "";
      figure.style.opacity = "";
    }, 200);
  }

  document.addEventListener("click", function (event) {
    if (typeof event.target.closest !== "function") return;
    var link = event.target.closest(".photo-link");
    if (!link) return;
    var list = currentLinks();
    var i = list.indexOf(link);
    if (i < 0) return;
    event.preventDefault();
    open(i);
  });

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", function () { go(-1); });
  btnNext.addEventListener("click", function () { go(1); });

  root.addEventListener("click", function (event) {
    if (moved) return;
    if (event.target === root || event.target === stage) close();
  });

  document.addEventListener("keydown", function (event) {
    if (!isOpen) return;
    if (event.key === "Escape") { event.preventDefault(); close(); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
    else if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
    else if (event.key === "Tab") {
      var focusable = [btnClose, btnPrev, btnNext].filter(function (b) {
        return !b.disabled && b.offsetParent !== null;
      });
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  /* ---- Touch: swipe left/right to browse, swipe down to close ---- */
  function zoomed() {
    return window.visualViewport && window.visualViewport.scale > 1.05;
  }
  var sx = 0, sy = 0, dx = 0, dy = 0, st = 0, axis = "", tracking = false, moved = false;

  root.addEventListener("touchstart", function (e) {
    moved = false;
    if (e.touches.length !== 1 || zoomed()) { tracking = false; return; }
    tracking = true; axis = "";
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; dx = dy = 0; st = Date.now();
  }, { passive: true });

  root.addEventListener("touchmove", function (e) {
    if (!tracking) return;
    if (e.touches.length !== 1 || zoomed()) { tracking = false; resetDrag(); return; }
    dx = e.touches[0].clientX - sx; dy = e.touches[0].clientY - sy;
    if (!axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (!axis) return;
    moved = true;
    if (e.cancelable) e.preventDefault();
    root.classList.add("is-dragging");
    figure.style.transition = "none";
    if (axis === "x") {
      figure.style.transform = "translate3d(" + dx + "px,0,0)";
    } else if (dy > 0) {
      var p = Math.min(1, dy / 300);
      figure.style.transform = "translate3d(0," + dy + "px,0) scale(" + (1 - p * 0.12).toFixed(3) + ")";
      root.style.setProperty("--fade", (1 - p * 0.7).toFixed(3));
    }
  }, { passive: false });

  function resetDrag() {
    root.classList.remove("is-dragging");
    figure.style.transition = "transform 0.3s cubic-bezier(0.2,0.7,0.2,1)";
    figure.style.transform = "";
    root.style.removeProperty("--fade");
  }

  root.addEventListener("touchend", function () {
    if (!tracking) return;
    tracking = false;
    var dt = Math.max(1, Date.now() - st);
    var fast = Math.abs(dx) / dt > 0.45;
    if (axis === "x" && (Math.abs(dx) > window.innerWidth * 0.18 || (fast && Math.abs(dx) > 30))) {
      root.classList.remove("is-dragging");
      go(dx < 0 ? 1 : -1);
    } else if (axis === "y" && (dy > 110 || (dy / dt > 0.5 && dy > 40))) {
      close();
    } else {
      resetDrag();
    }
    setTimeout(function () { moved = false; }, 50);
  });
  root.addEventListener("touchcancel", function () { tracking = false; resetDrag(); });

  /* Pinch-zoomed in: swap in the full 2400px copy for detail. */
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", function () {
      if (!isOpen || !zoomed()) return;
      var full = root.getAttribute("data-full");
      if (full && webp.getAttribute("srcset") !== full) { webp.setAttribute("srcset", full); shownKey = full; }
    });
  }

  window.addEventListener("gallery:reshuffled", function () { if (isOpen) close(); });
  window.addEventListener("pageshow", function (event) { if (event.persisted && isOpen) close(); });
})();
