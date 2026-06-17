/* =========================================================================
   Expedition Yorkshire — main.js
   Framework-free behaviour: nav, mobile drawer, FAQ accordion, enquiry form
   (mock submit + inline validation + dataLayer events), modal, sticky bar,
   consent bar. No external dependencies.
   ========================================================================= */
(function () {
  "use strict";
  window.dataLayer = window.dataLayer || [];
  function track(event, params) {
    window.dataLayer.push(Object.assign({ event: event }, params || {}));
  }
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Desktop mega-menu ---------- */
  function initMegaMenu() {
    var items = $$(".nav-item");
    items.forEach(function (item) {
      var trigger = $(".nav-trigger", item);
      if (!trigger) return;
      function open() { close(); item.classList.add("open"); trigger.setAttribute("aria-expanded", "true"); }
      function close() { items.forEach(function (i) { i.classList.remove("open"); var t = $(".nav-trigger", i); if (t) t.setAttribute("aria-expanded", "false"); }); }
      item.addEventListener("mouseenter", open);
      item.addEventListener("mouseleave", function () { item.classList.remove("open"); trigger.setAttribute("aria-expanded", "false"); });
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        if (item.classList.contains("open")) { item.classList.remove("open"); trigger.setAttribute("aria-expanded", "false"); }
        else { open(); }
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") items.forEach(function (i) { i.classList.remove("open"); var t = $(".nav-trigger", i); if (t) t.setAttribute("aria-expanded", "false"); });
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".nav-item")) items.forEach(function (i) { i.classList.remove("open"); });
    });
  }

  /* ---------- Mobile drawer + accordions ---------- */
  function initMobileNav() {
    var drawer = $("#mobile-drawer");
    var openBtn = $("#nav-toggle");
    var closeBtn = $("#drawer-close");
    if (!drawer || !openBtn) return;
    function open() { drawer.classList.add("open"); openBtn.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; }
    function close() { drawer.classList.remove("open"); openBtn.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }
    openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    $$(".m-acc-trigger", drawer).forEach(function (t) {
      t.addEventListener("click", function () {
        var panel = t.nextElementSibling;
        var isOpen = panel.classList.toggle("open");
        t.setAttribute("aria-expanded", isOpen ? "true" : "false");
        var pm = $(".pm", t); if (pm) pm.textContent = isOpen ? "–" : "+";
      });
    });
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    $$(".faq-item").forEach(function (item) {
      var q = $(".faq-q", item);
      if (!q) return;
      q.addEventListener("click", function () {
        var isOpen = item.classList.toggle("open");
        q.setAttribute("aria-expanded", isOpen ? "true" : "false");
        var pm = $(".pm", q); if (pm) pm.textContent = isOpen ? "–" : "+";
      });
    });
  }

  /* ---------- Enquiry form (mock) ---------- */
  function validateForm(form) {
    var ok = true;
    var name = $('[name="name"]', form);
    var email = $('[name="email"]', form);
    var group = $('[name="group"]', form);
    function setInvalid(field, bad) { var w = field.closest(".field"); if (w) w.classList.toggle("invalid", bad); }
    if (name) { var b = !name.value.trim(); setInvalid(name, b); if (b) ok = false; }
    if (email) { var be = !/^\S+@\S+\.\S+$/.test(email.value); setInvalid(email, be); if (be) ok = false; }
    if (group) { var bg = !group.value; setInvalid(group, bg); if (bg) ok = false; }
    return ok;
  }
  function initForms() {
    $$("form.enquiry-form").forEach(function (form) {
      // fire view_item when an enquiry form becomes available on the page
      track("view_item", { item_name: form.getAttribute("data-tour") || "General enquiry" });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validateForm(form)) return;
        var data = {};
        $$("input,select,textarea", form).forEach(function (el) { if (el.name) data[el.name] = el.value; });
        // MOCK SUBMISSION — no backend. Replace with real endpoint before launch.
        track("generate_lead", {
          currency: "GBP", value: 985,
          tour: data.tour || form.getAttribute("data-tour") || "General enquiry",
          group_size: data.group || ""
        });
        var card = form.closest(".enquiry") || form.parentNode;
        var success = $(".form-success", card);
        form.style.display = "none";
        if (success) success.classList.add("show");
      });
      // clear invalid state as the user types
      $$("input,select,textarea", form).forEach(function (el) {
        el.addEventListener("input", function () { var w = el.closest(".field"); if (w) w.classList.remove("invalid"); });
      });
    });
  }

  /* ---------- Enquiry modal (opened by "Check availability") ---------- */
  function initModal() {
    var overlay = $("#enquiry-modal");
    if (!overlay) return;
    var lastFocus = null;
    function open(tourName) {
      lastFocus = document.activeElement;
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      // reset to form view if a previous submit left success showing
      var form = $(".enquiry-form", overlay);
      var success = $(".form-success", overlay);
      if (form && success) { form.style.display = ""; success.classList.remove("show"); }
      if (tourName && form) {
        var tourField = $('[name="tour"]', form);
        if (tourField) {
          tourField.value = tourName;
          if (tourField.tagName === "SELECT") {
            var match = $$("option", tourField).some(function (o) { return o.value === tourName; });
            if (!match) { var opt = document.createElement("option"); opt.value = tourName; opt.textContent = tourName; opt.selected = true; tourField.appendChild(opt); }
          }
          form.setAttribute("data-tour", tourName);
        }
        var label = $(".modal-tour-label", overlay);
        if (label) label.textContent = tourName;
      }
      var first = $("input,select,textarea,button", overlay);
      if (first) first.focus();
      track("begin_checkout", { item_name: tourName || "General enquiry" });
    }
    function close() {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    $$('[data-open-enquiry]').forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        open(btn.getAttribute("data-tour") || document.body.getAttribute("data-page-tour") || "");
      });
    });
    $$(".modal-close", overlay).forEach(function (b) { b.addEventListener("click", close); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && overlay.classList.contains("open")) close(); });
  }

  /* ---------- Sticky mobile CTA ---------- */
  function initStickyBar() {
    var bar = $("#sticky-cta");
    if (!bar) return;
    var hero = $(".hero");
    var threshold = hero ? hero.offsetHeight : 400;
    function onScroll() { bar.classList.toggle("show", window.scrollY > threshold * 0.6); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Consent bar ---------- */
  function initConsent() {
    var bar = $("#consent");
    if (!bar) return;
    if (localStorage.getItem("ey-consent")) { bar.classList.add("hide"); return; }
    $$("[data-consent]", bar).forEach(function (btn) {
      btn.addEventListener("click", function () {
        try { localStorage.setItem("ey-consent", btn.getAttribute("data-consent")); } catch (e) {}
        bar.classList.add("hide");
      });
    });
  }

  /* ---------- Comparison helper tiles ---------- */
  function initCompareTiles() {
    $$(".compare-tile").forEach(function (tile) {
      tile.addEventListener("click", function () {
        var target = tile.getAttribute("data-target");
        if (target) window.location.href = target;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMegaMenu();
    initMobileNav();
    initFaq();
    initForms();
    initModal();
    initStickyBar();
    initConsent();
    initCompareTiles();
  });
})();
