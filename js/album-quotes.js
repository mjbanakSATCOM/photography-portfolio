/* Lantern & Leaves: rotating Ansel Adams quotes in the Black & White album
   header. Sources for every quote: /workspace/gallery-keeper/album-quotes.json.
   All quotes are in the HTML, stacked in one grid cell, so the height never
   changes. Opacity-only fades; paused while the tab is hidden; static when the
   visitor prefers reduced motion. */
(function () {
  "use strict";
  var FADE = 1200, HOLD = 7000;
  var box = document.querySelector(".album-quote");
  if (!box) return;
  var items = box.querySelectorAll(".aq-item");
  if (items.length < 2) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var cur = 0, timer = null;

  function step() {
    var prev = items[cur];
    prev.classList.remove("is-on");
    prev.setAttribute("aria-hidden", "true");
    cur = (cur + 1) % items.length;
    timer = setTimeout(function () {
      items[cur].classList.add("is-on");
      items[cur].removeAttribute("aria-hidden");
      timer = setTimeout(step, FADE + HOLD);
    }, FADE + 150);
  }

  function start() { if (!timer) timer = setTimeout(step, HOLD); }
  function stop() { clearTimeout(timer); timer = null; }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });
  if (!document.hidden) start();
})();
