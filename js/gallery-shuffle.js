/* Lantern & Leaves — shuffle album photos into a new order on every visit.
   Runs synchronously right after the masonry grid so the static HTML order
   is gone before first paint. Lightbox and other scripts then see the live
   DOM order. sessionStorage (when available) remembers the last order for
   this album so a reload or return visit does not repeat the same leading
   photo or the same sequence back-to-back. */
(function () {
  "use strict";

  var STORAGE_PREFIX = "ll-gallery-order:";
  var MAX_TRIES = 24;

  function randInt(n) {
    if (n <= 1) return 0;
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      var max = 0x100000000;
      var limit = max - (max % n);
      var buf = new Uint32Array(1);
      var x;
      do {
        window.crypto.getRandomValues(buf);
        x = buf[0];
      } while (x >= limit);
      return x % n;
    }
    return Math.floor(Math.random() * n);
  }

  function fisherYates(items) {
    var i, j, tmp;
    for (i = items.length - 1; i > 0; i--) {
      j = randInt(i + 1);
      tmp = items[i];
      items[i] = items[j];
      items[j] = tmp;
    }
    return items;
  }

  function photoId(link) {
    return link.getAttribute("data-full-jpg") || link.getAttribute("href") || "";
  }

  function collectLinks(grid) {
    var out = [];
    var kids = grid.children;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].classList && kids[i].classList.contains("photo-link")) {
        out.push(kids[i]);
      }
    }
    return out;
  }

  function idsOf(links) {
    var ids = [];
    for (var i = 0; i < links.length; i++) ids.push(photoId(links[i]));
    return ids;
  }

  function sameArray(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function storageKey() {
    return STORAGE_PREFIX + location.pathname;
  }

  function readLast() {
    try {
      var raw = sessionStorage.getItem(storageKey());
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function writeLast(ids) {
    try {
      sessionStorage.setItem(storageKey(), JSON.stringify({
        order: ids,
        first: ids[0] || ""
      }));
    } catch (err) {}
  }

  function isRepeat(ids, last) {
    if (!last || !ids.length) return false;
    return last.first === ids[0] || sameArray(last.order, ids);
  }

  function avoidRepeat(items, last) {
    if (!last || items.length < 2) return items;
    var i, tmp;
    if (photoId(items[0]) === last.first) {
      for (i = 1; i < items.length; i++) {
        if (photoId(items[i]) !== last.first) {
          tmp = items[0];
          items[0] = items[i];
          items[i] = tmp;
          break;
        }
      }
    }
    if (sameArray(idsOf(items), last.order) && items.length >= 2) {
      tmp = items[0];
      items[0] = items[1];
      items[1] = tmp;
    }
    return items;
  }

  function applyOrder(grid, items) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < items.length; i++) frag.appendChild(items[i]);
    grid.appendChild(frag);
  }

  function announce() {
    try {
      window.dispatchEvent(new CustomEvent("gallery:reshuffled"));
    } catch (err) {}
  }

  function reshuffle() {
    var grid = document.querySelector(".masonry");
    if (!grid) return;
    var items = collectLinks(grid);
    if (items.length < 2) return;

    var last = readLast();
    var next, ids, tries = 0;
    do {
      next = items.slice();
      fisherYates(next);
      ids = idsOf(next);
      tries++;
    } while (isRepeat(ids, last) && tries < MAX_TRIES);

    if (isRepeat(idsOf(next), last)) next = avoidRepeat(next, last);

    applyOrder(grid, next);
    writeLast(idsOf(next));
    announce();
  }

  reshuffle();

  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    reshuffle();
  });
})();
