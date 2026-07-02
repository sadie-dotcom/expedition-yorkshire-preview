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

  // Map tour names (or button data-tour values) to Bókun experience IDs
  function mapExperience(tourName) {
    if (!tourName) return null;
    if (/Whitby/i.test(tourName)) return '1230929';
    if (/Dales/i.test(tourName)) return '1230928';
    if (/Bront/i.test(tourName)) return '1230928';
    if (/York to Edinburgh/i.test(tourName) || /York to Edinburgh transfer/i.test(tourName)) return '1230927';
    if (/Edinburgh to York/i.test(tourName) || /Edinburgh to York transfer/i.test(tourName)) return '1230926';
    if (/All Creatures/i.test(tourName)) return '1230925';
    return null;
  }

  function getPageTourName() {
    var bodyTour = document.body && document.body.getAttribute('data-page-tour');
    if (bodyTour) return bodyTour;

    var path = (window.location.pathname || '').toLowerCase();
    if (path === '/' || path === '') return 'Whitby, Moors & Coast';
    if (path.indexOf('/whitby-moors-coast') === 0) return 'Whitby, Moors & Coast';
    if (path.indexOf('/luxury-yorkshire-day-tours') === 0) return 'Dales, Castles & Villages';
    if (path.indexOf('/york-to-edinburgh') === 0) return 'York to Edinburgh Scenic Transfer';
    if (path.indexOf('/yorkshire-tours-from-london') === 0) return 'Yorkshire Tours from London';
    if (path.indexOf('/yorkshire-tours-from-york') === 0) return 'Yorkshire Tours from York';
    if (path.indexOf('/private-yorkshire-tours') === 0) return 'Private Yorkshire Tours';

    var title = document.title || '';
    if (/Whitby/i.test(title)) return 'Whitby, Moors & Coast';
    if (/Dales/i.test(title)) return 'Dales, Castles & Villages';
    if (/All Creatures/i.test(title)) return 'All Creatures Great & Small';
    if (/Bront/i.test(title)) return 'Brontë Country';
    if (/York to Edinburgh/i.test(title)) return 'York to Edinburgh Scenic Transfer';
    if (/Edinburgh to York/i.test(title)) return 'Edinburgh to York Scenic Transfer';

    var heading = document.querySelector('h1');
    if (heading) return heading.textContent.trim();
    return '';
  }

  function resolveTourName(btn) {
    if (btn && btn.getAttribute('data-tour')) return btn.getAttribute('data-tour');
    var pageTour = getPageTourName();
    if (pageTour) return pageTour;
    return '';
  }

  function resolveExperienceId(btn, tourName, widget) {
    // 1. Explicit per-button experience id wins (data-bokun-id or data-experience-id).
    if (btn) {
      var explicit = btn.getAttribute('data-bokun-id') || btn.getAttribute('data-experience-id');
      if (explicit) return explicit.trim();
    }
    // 2. Fall back to mapping the button's tour name / page tour.
    var id = mapExperience(tourName);
    if (id) return id;
    // 3. Last resort: whatever the on-page widget already points at.
    if (widget) {
      var src = widget.getAttribute('data-src') || '';
      var match = src.match(/experience-calendar\/(\d+)/);
      if (match) return match[1];
    }
    return null;
  }

  // Build a Bókun experience-calendar URL for a given experience id.
  function bokunExperienceUrl(experienceId) {
    return 'https://widgets.bokun.io/online-sales/f801b108-03a7-44e9-8900-425ec30f6886/experience-calendar/' + experienceId;
  }

  // (Re)render a Bókun widget for `experienceId` inside `container`.
  // Bókun renders once into a .bokunWidget node and ignores later data-src
  // changes, so we always remove the old widget (and any iframe it created)
  // and insert a fresh node the loader can initialise from scratch.
  function renderBokunExperience(container, experienceId) {
    if (!container || !experienceId) return null;
    // Remove any previously rendered widget + Bókun-generated markup.
    container.querySelectorAll('.bokunWidget, iframe[src*="bokun.io"]').forEach(function (n) { n.remove(); });
    var widget = document.createElement('div');
    widget.className = 'bokunWidget';
    widget.setAttribute('data-src', bokunExperienceUrl(experienceId));
    // Mark as an explicitly-chosen experience so the heading-based remap in
    // initBokunWidgets() leaves it alone.
    widget.setAttribute('data-ey-explicit', '1');
    container.appendChild(widget);
    initBokunWidgets();
    return widget;
  }

  /* ---------- Desktop full-width mega-menu ---------- */
  function initMegaMenu() {
    var header = document.getElementById("site-header");
    if (!header) return;
    var items = $$(".nav-item[data-menu]", header);
    var panels = {};
    $$(".mega-panel[data-panel]", header).forEach(function (p) { panels[p.getAttribute("data-panel")] = p; });
    var closeTimer = null;

    function openMenu(key) {
      clearTimeout(closeTimer);
      items.forEach(function (i) {
        var on = i.getAttribute("data-menu") === key;
        i.classList.toggle("active", on);
        var t = $(".nav-trigger", i);
        if (t) t.setAttribute("aria-expanded", on ? "true" : "false");
      });
      Object.keys(panels).forEach(function (k) { panels[k].classList.toggle("open", k === key); });
      header.classList.add("menu-open");
    }
    function closeMenu() {
      items.forEach(function (i) {
        i.classList.remove("active");
        var t = $(".nav-trigger", i);
        if (t) t.setAttribute("aria-expanded", "false");
      });
      Object.keys(panels).forEach(function (k) { panels[k].classList.remove("open"); });
      header.classList.remove("menu-open");
    }
    function scheduleClose() { clearTimeout(closeTimer); closeTimer = setTimeout(closeMenu, 150); }

    items.forEach(function (item) {
      var key = item.getAttribute("data-menu");
      var trigger = $(".nav-trigger", item);
      item.addEventListener("mouseenter", function () { openMenu(key); });
      item.addEventListener("mouseleave", scheduleClose);
      if (trigger) {
        trigger.addEventListener("focus", function () { openMenu(key); });
        trigger.addEventListener("click", function (e) {
          e.preventDefault();
          if (item.classList.contains("active")) closeMenu(); else openMenu(key);
        });
      }
      var panel = panels[key];
      if (panel) {
        panel.addEventListener("mouseenter", function () { clearTimeout(closeTimer); });
        panel.addEventListener("mouseleave", scheduleClose);
      }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    document.addEventListener("click", function (e) { if (!header.contains(e.target)) closeMenu(); });
    document.addEventListener("focusin", function (e) { if (!header.contains(e.target)) closeMenu(); });
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

  /* ---------- Bókun booking widget loader ---------- */
  function initBokunWidgets() {
    // Ensure widgets use the correct experience id based on the page or nearby headings.
    var mapExperience = function (tourName) {
      if (!tourName) return null;
      if (/Whitby/i.test(tourName)) return '1230929';
      if (/Dales/i.test(tourName)) return '1230928';
      if (/York to Edinburgh/i.test(tourName) || /York to Edinburgh transfer/i.test(tourName)) return '1230927';
      if (/Edinburgh to York/i.test(tourName) || /Edinburgh to York transfer/i.test(tourName)) return '1230926';
      if (/All Creatures/i.test(tourName)) return '1230925';
      return null;
    };

    // Update any static bokunWidget data-srcs we find to the mapped id where possible
    document.querySelectorAll('.bokunWidget').forEach(function (el) {
      try {
        // Leave explicitly-chosen experiences (set via a clicked button) untouched.
        if (el.getAttribute('data-ey-explicit') === '1') return;
        var nearest = el.closest('.booking-section') || document.body;
        var heading = nearest.querySelector('.booking-intro h2') || document.querySelector('h1');
        var tourName = heading ? heading.textContent.trim() : '';
        var id = mapExperience(tourName) || mapExperience(document.body.getAttribute('data-page-tour'));
        var src = el.getAttribute('data-src') || '';
        if (id && /experience-calendar\/(\d+)/.test(src)) {
          var newSrc = src.replace(/experience-calendar\/\d+/, 'experience-calendar/' + id);
          el.setAttribute('data-src', newSrc);
        }
      } catch (e) {}
    });

    if (window.__eyBokunLoaderInjected) return;
    var existing = document.querySelector('script[src*="BokunWidgetsLoader.js"]');
    if (existing) {
      window.__eyBokunLoaderInjected = true;
      return;
    }
    var widget = document.querySelector('.bokunWidget');
    if (!widget) return;
    var script = document.createElement('script');
    script.src = 'https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js?bookingChannelUUID=f801b108-03a7-44e9-8900-425ec30f6886';
    script.async = true;
    document.head.appendChild(script);
    window.__eyBokunLoaderInjected = true;
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
    var bookingShell = document.querySelector(".bokun-booking-shell");
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
        var tourName = resolveTourName(btn);
        var widget = bookingShell ? bookingShell.querySelector('.bokunWidget') : null;
        // Experience id is resolved per clicked button (data-bokun-id first).
        var experienceId = resolveExperienceId(btn, tourName, widget);
        if (bookingShell) {
          // On-page booking shell: rebuild its widget for the requested experience
          // so each button opens its own calendar (Bókun ignores data-src edits).
          if (experienceId) {
            renderBokunExperience(bookingShell, experienceId);
            console.log('EY: rendered bookingShell experience', experienceId);
          }
          bookingShell.scrollIntoView({ behavior: "smooth", block: "start" });
          bookingShell.setAttribute("tabindex", "-1");
          try { bookingShell.focus({ preventScroll: true }); } catch (err) { bookingShell.focus(); }
          return;
        }
        // No booking shell on page — if this button maps to an experience, inject one into the modal
        if (experienceId) {
          var modalShell = overlay.querySelector('.bokun-booking-shell');
          if (!modalShell) {
            modalShell = document.createElement('div');
            modalShell.className = 'bokun-booking-shell';
            overlay.querySelector('.modal').appendChild(modalShell);
          }
          renderBokunExperience(modalShell, experienceId);
          console.log('EY: injected modal experience', experienceId);
          // hide the enquiry form when launching the widget
          var form = $('.enquiry-form', overlay);
          if (form) form.style.display = 'none';
          modalShell.scrollIntoView({ behavior: 'smooth', block: 'center' });
          modalShell.setAttribute('tabindex', '-1');
          try { modalShell.focus({ preventScroll: true }); } catch (err) { modalShell.focus(); }
          overlay.classList.add('open');
          document.body.style.overflow = 'hidden';
          return;
        }
        open(tourName || '');
      });
    });
    $$(".modal-close", overlay).forEach(function (b) { b.addEventListener("click", close); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && overlay.classList.contains("open")) close(); });
  }

  /* ---------- Sticky-on-scroll site header ---------- */
  function initStickyHeader() {
    var header = document.getElementById("site-header");
    if (!header) return;
    var hero = header.closest(".hero") || header.parentNode;
    var baseHeight = header.offsetHeight; // natural in-flow height (≈72px)
    var stuck = false;
    function apply(should) {
      if (should === stuck) return;
      stuck = should;
      header.classList.toggle("is-stuck", stuck);
      // Compensate the space the header vacated so content doesn't jump.
      if (hero) hero.style.paddingTop = stuck ? baseHeight + "px" : "";
    }
    function onScroll() { apply(window.scrollY > baseHeight); }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      if (!stuck) baseHeight = header.offsetHeight;
    }, { passive: true });
    onScroll();
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
    var c = document.getElementById('consent');
    if (!c) return;
    c.addEventListener('click', function (e) {
      var t = e.target.closest('[data-consent]');
      if (!t) return;
      var val = t.getAttribute('data-consent');
      try { localStorage.setItem('ey.consent', val); } catch (err) {}
      c.style.display = 'none';
    });
  }

  /* ---------- Compare tiles (small helper used on Tours page) ---------- */
  function initCompareTiles() {
    $$('.compare-tile').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.getAttribute('data-target');
        if (t && t !== '#') window.location.href = t;
      });
    });
  }

  /* ---------- Initialize everything on DOM ready ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    try { initMegaMenu(); } catch (e) {}
    try { initMobileNav(); } catch (e) {}
    try { initFaq(); } catch (e) {}
    try { initForms(); } catch (e) {}
    try { initModal(); } catch (e) {}
    try { initBokunWidgets(); } catch (e) {}
    try { initStickyHeader(); } catch (e) {}
    try { initStickyBar(); } catch (e) {}
    try { initConsent(); } catch (e) {}
    try { initCompareTiles(); } catch (e) {}
  });

})();
