/* Lantern & Leaves: a short shutter-close on the Contact form's Send
   button, then the form submits as usual. If this script does not run, or
   the visitor prefers reduced motion, the form posts on its own. */
(function () {
  "use strict";
  var form = document.querySelector(".contact-form");
  if (!form) return;
  var btn = form.querySelector(".shutter-submit");
  if (!btn) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  form.addEventListener("submit", function (e) {
    if (reduce) return;
    if (form.getAttribute("data-sent") === "1") return;
    e.preventDefault();
    if (typeof form.checkValidity === "function" && !form.checkValidity()) {
      if (typeof form.reportValidity === "function") form.reportValidity();
      return;
    }
    form.setAttribute("data-sent", "1");
    btn.classList.add("is-shutting");
    btn.setAttribute("aria-busy", "true");
    window.setTimeout(function () {
      HTMLFormElement.prototype.submit.call(form);
    }, 420);
  });
})();
