(function () {
  "use strict";

  var links = Array.prototype.slice.call(document.querySelectorAll(".photo-link"));
  if (!links.length) return;

  var index = 0;
  var lastFocus = null;

  var root = document.createElement("div");
  root.className = "lightbox";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Photograph viewer");
  root.innerHTML =
    '<button type="button" class="lightbox-btn lightbox-close" aria-label="Close">&times;</button>' +
    '<button type="button" class="lightbox-btn lightbox-prev" aria-label="Previous photograph">&#8249;</button>' +
    '<figure class="lightbox-figure">' +
    '  <picture>' +
    '    <source class="lightbox-webp" type="image/webp" srcset="">' +
    '    <img class="lightbox-image" src="" alt="">' +
    "  </picture>" +
    '  <figcaption class="lightbox-caption"></figcaption>' +
    "</figure>" +
    '<button type="button" class="lightbox-btn lightbox-next" aria-label="Next photograph">&#8250;</button>';
  document.body.appendChild(root);

  var img = root.querySelector(".lightbox-image");
  var webp = root.querySelector(".lightbox-webp");
  var caption = root.querySelector(".lightbox-caption");
  var btnClose = root.querySelector(".lightbox-close");
  var btnPrev = root.querySelector(".lightbox-prev");
  var btnNext = root.querySelector(".lightbox-next");
  var clearTimer = 0;

  function loaded() {
    root.classList.remove("is-loading");
  }
  img.addEventListener("load", loaded);
  img.addEventListener("error", loaded);

  function photoData(link) {
    return {
      jpg: link.getAttribute("data-full-jpg") || link.getAttribute("href"),
      webp: link.getAttribute("data-full-webp") || "",
      width: link.getAttribute("data-width") || "",
      height: link.getAttribute("data-height") || "",
      alt: link.getAttribute("data-alt") || (link.querySelector("img") || {}).alt || "",
    };
  }

  function show(i) {
    index = (i + links.length) % links.length;
    var data = photoData(links[index]);
    img.alt = data.alt;
    if (data.width) img.setAttribute("width", data.width);
    if (data.height) img.setAttribute("height", data.height);
    if (data.webp) {
      webp.setAttribute("srcset", data.webp);
    } else {
      webp.removeAttribute("srcset");
    }
    if (img.getAttribute("src") !== data.jpg) {
      root.classList.add("is-loading");
      img.src = data.jpg;
      if (img.complete && img.naturalWidth) loaded();
    }
    caption.textContent = data.alt + "  ·  " + (index + 1) + " of " + links.length;
    btnPrev.disabled = links.length < 2;
    btnNext.disabled = links.length < 2;
  }

  function open(i) {
    lastFocus = document.activeElement;
    if (clearTimer) {
      clearTimeout(clearTimer);
      clearTimer = 0;
    }
    show(i);
    root.classList.add("is-open");
    document.body.classList.add("lightbox-open");
    btnClose.focus();
  }

  function close() {
    root.classList.remove("is-open");
    document.body.classList.remove("lightbox-open");
    // Let the fade-out finish before clearing the image.
    clearTimer = setTimeout(function () {
      clearTimer = 0;
      img.removeAttribute("src");
      webp.removeAttribute("srcset");
    }, 500);
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  links.forEach(function (link, i) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      open(i);
    });
  });

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", function () {
    show(index - 1);
  });
  btnNext.addEventListener("click", function () {
    show(index + 1);
  });

  root.addEventListener("click", function (event) {
    if (event.target === root) close();
  });

  document.addEventListener("keydown", function (event) {
    if (!root.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      show(index + 1);
    } else if (event.key === "Tab") {
      var focusable = [btnClose, btnPrev, btnNext].filter(function (b) {
        return !b.disabled;
      });
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
})();
