/* =========================================================================
   Expedition Yorkshire — main.js
   Framework-free behaviour: nav, mobile drawer, FAQ accordion, enquiry form
   (mock submit + inline validation + dataLayer events), modal, sticky bar,
   consent bar. No external dependencies.
   ========================================================================= */
(function () {
  "use strict";

  /* ---------- Microsoft Clarity ----------
     Loaded once from this shared script (which is included on every page),
     so Clarity runs site-wide from a single source. Guarded so it can never
     be injected twice on a page. */
  (function initClarity() {
    if (window.__eyClarityLoaded) return;
    if (document.querySelector('script[src^="https://www.clarity.ms/tag/"]')) { window.__eyClarityLoaded = true; return; }
    window.__eyClarityLoaded = true;
    // Define the clarity() command queue synchronously (so no early calls are
    // lost), but defer the actual network load until the browser is idle so it
    // never competes with first paint. Same tag id, same data captured.
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    function loadClarity() {
      var l = document, r = "script", i = "xu29b40cn6", t, y;
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    }
    if ("requestIdleCallback" in window) requestIdleCallback(loadClarity, { timeout: 3000 });
    else setTimeout(loadClarity, 1500);
  })();

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
    if (/Bront/i.test(tourName)) return '1264811';
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

  // Bókun booking channel + the confirmed Booking Calendar embed pattern.
  // Each tour has its OWN dedicated calendar widget; only the experience id
  // changes between tours. We never mutate a widget between products.
  var BOKUN_CHANNEL_UUID = 'f801b108-03a7-44e9-8900-425ec30f6886';
  function bokunExperienceUrl(experienceId) {
    return 'https://widgets.bokun.io/online-sales/' + BOKUN_CHANNEL_UUID + '/experience-calendar/' + experienceId;
  }

  // The dedicated calendar embedded on an individual tour page (if present).
  function pageCalendarWidget() {
    var shell = document.querySelector('.bokun-booking-shell:not(.bokun-modal-calendars)');
    return shell ? shell.querySelector('.bokunWidget') : null;
  }
  function widgetExperienceId(widget) {
    if (!widget) return null;
    var match = (widget.getAttribute('data-src') || '').match(/experience-calendar\/(\d+)/);
    return match ? match[1] : null;
  }

  // The bookable experiences, in display order, for the branded tour picker
  // shown by the global (header / footer / sticky) "Check availability" CTAs.
  // Each opens its OWN dedicated Bókun Booking Calendar via showModalCalendar.
  // `enquiry: true` routes to the enquiry form instead (no dedicated calendar).
  var PICKER_TOURS = [
    { name: 'Whitby, Moors & Coast',            id: '1230929', blurb: 'Abbey ruins, harbour town & the wild North York Moors coast.' },
    { name: 'Dales, Castles & Villages',        id: '1230928', blurb: 'Waterfalls, dry-stone dales & storybook stone villages.' },
    { name: 'All Creatures',      id: '1230925', blurb: 'Herriot filming country across the Yorkshire Dales.' },
    { name: 'Brontë Country',                   id: '1264811', blurb: 'Haworth, the Parsonage & the wuthering moortops.' },
    { name: 'York to Edinburgh Scenic Transfer',id: '1230927', blurb: 'A touring transfer north via the coast & Borders.' },
    { name: 'Edinburgh to York Scenic Transfer',id: '1230926', blurb: 'The scenic return south through the Borders.' },
    { name: 'Chauffeur & Private Transfers',    enquiry: true,  blurb: 'Bespoke routes & airport transfers — tell us your plans.' }
  ];

  // Ensure a dedicated calendar widget for `experienceId` exists inside the
  // modal (created once, cached, never mutated) and is the only one shown.
  function showModalCalendar(overlay, experienceId) {
    var modal = overlay.querySelector('.modal');
    var host = overlay.querySelector('.bokun-modal-calendars');
    if (!host) {
      host = document.createElement('div');
      host.className = 'bokun-booking-shell bokun-modal-calendars';
      modal.appendChild(host);
    }
    $$('.bokunWidget[data-experience]', host).forEach(function (w) { w.style.display = 'none'; });
    var target = host.querySelector('.bokunWidget[data-experience="' + experienceId + '"]');
    if (!target) {
      // Confirmed embed pattern — one dedicated widget per experience id.
      target = document.createElement('div');
      target.className = 'bokunWidget';
      target.setAttribute('data-experience', experienceId);
      target.setAttribute('data-src', bokunExperienceUrl(experienceId));
      host.appendChild(target);
      initBokunWidgets(); // Bókun's loader picks up the newly inserted node.
    }
    target.style.display = '';
    host.style.display = '';
    return host;
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

  /* ---------- Bókun booking widget loader ----------
     Loads Bókun's widget loader script once. Each dedicated .bokunWidget on
     the page (its own experience id in data-src) is then initialised by Bókun.
     No data-src is ever rewritten — one dedicated calendar per experience. */
  function initBokunWidgets() {
    if (window.__eyBokunLoaderInjected) return;
    if (document.querySelector('script[src*="BokunWidgetsLoader.js"]')) {
      window.__eyBokunLoaderInjected = true;
      return;
    }
    if (!document.querySelector('.bokunWidget')) return;
    var script = document.createElement('script');
    script.src = 'https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js?bookingChannelUUID=' + BOKUN_CHANNEL_UUID;
    script.async = true;
    document.head.appendChild(script);
    window.__eyBokunLoaderInjected = true;
  }

  /* Lazy trigger: only fetch Bokun's (heavy) third-party loader when the page's
     dedicated booking calendar approaches the viewport. The modal "Check
     availability" path calls initBokunWidgets() directly and is unaffected.
     Falls back to an immediate load where IntersectionObserver is unavailable. */
  function initBokunLazy() {
    var widget = document.querySelector('.bokun-booking-shell:not(.bokun-modal-calendars) .bokunWidget');
    if (!widget) return;
    if (!('IntersectionObserver' in window)) { initBokunWidgets(); return; }
    var io = new IntersectionObserver(function (entries) {
      for (var n = 0; n < entries.length; n++) {
        if (entries[n].isIntersecting) { io.disconnect(); initBokunWidgets(); return; }
      }
    }, { rootMargin: '800px 0px' });
    io.observe(widget.closest('.bokun-booking-shell') || widget);
  }

  /* ---------- reCAPTCHA v3 ----------
     Loads Google reCAPTCHA v3 exactly once, using the PUBLIC site key. The
     reCAPTCHA v3 site key is public by design (it ships in the page), so it is
     referenced directly here. Only the SECRET key is private and lives in the
     Cloudflare environment, used server-side in functions/api/enquiry.js.
     getToken() resolves to a fresh token for the given action, or to "" if
     reCAPTCHA is unavailable (the server then rejects the tokenless
     submission). v3 shows no challenge; scoring happens silently. */
  var RECAPTCHA_SITE_KEY = "6Lcp-mctAAAAAD5AuxgubUsKKRCwym6Ka86D-ll6";
  var recaptcha = (function () {
    var SCRIPT_TIMEOUT = 10000;
    var readyPromise = null;

    function ready() {
      if (readyPromise) return readyPromise;
      readyPromise = new Promise(function (resolve, reject) {
        function grecaptchaReady() {
          if (window.grecaptcha && window.grecaptcha.execute) {
            window.grecaptcha.ready(function () { resolve(); });
            return true;
          }
          return false;
        }
        if (grecaptchaReady()) return;
        if (!document.querySelector("script[data-ey-recaptcha]")) {
          var s = document.createElement("script");
          s.src = "https://www.google.com/recaptcha/api.js?render=" + encodeURIComponent(RECAPTCHA_SITE_KEY);
          s.async = true;
          s.defer = true;
          s.setAttribute("data-ey-recaptcha", "1");
          s.onerror = function () { reject(new Error("reCAPTCHA script failed to load")); };
          document.head.appendChild(s);
        }
        var start = Date.now();
        (function poll() {
          if (grecaptchaReady()) return;
          if (Date.now() - start > SCRIPT_TIMEOUT) { reject(new Error("reCAPTCHA load timed out")); return; }
          setTimeout(poll, 100);
        })();
      });
      return readyPromise;
    }

    // Warm up once, ahead of any submit, so a token is ready quickly.
    function preload() {
      if (!RECAPTCHA_SITE_KEY) return;
      ready().catch(function () {});
    }

    function getToken(action) {
      if (!RECAPTCHA_SITE_KEY) return Promise.resolve("");
      return ready().then(function () {
        return window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: action || "enquiry" })
          .then(function (t) { return t || ""; }, function () { return ""; });
      }).catch(function () { return ""; });
    }

    return { preload: preload, getToken: getToken };
  })();

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
    var forms = $$("form.enquiry-form");
    // Defer reCAPTCHA until the visitor shows enquiry intent (opens the enquiry
    // modal or focuses a form field). A v3 token is only needed at submit, so
    // this keeps reCAPTCHA off the initial page load without affecting the form;
    // getToken() still lazy-loads it on submit as a fallback.
    if (forms.length) {
      var onEnquiryIntent = function (e) {
        var el = e.target;
        if (el && el.closest && el.closest('[data-open-enquiry], form.enquiry-form')) {
          try { recaptcha.preload(); } catch (err) {}
          document.removeEventListener('pointerdown', onEnquiryIntent, true);
          document.removeEventListener('focusin', onEnquiryIntent, true);
        }
      };
      document.addEventListener('pointerdown', onEnquiryIntent, true);
      document.addEventListener('focusin', onEnquiryIntent, true);
    }
    forms.forEach(function (form) {
      track("view_item", { item_name: form.getAttribute("data-tour") || "General enquiry" });

      // Honeypot: a hidden field real users never see; bots that fill it are rejected server-side.
      if (!$('[name="_hp"]', form)) {
        var hp = document.createElement("div");
        hp.setAttribute("aria-hidden", "true");
        hp.style.cssText = "position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden";
        hp.innerHTML = '<label>Leave this field empty<input type="text" name="_hp" tabindex="-1" autocomplete="off"></label>';
        form.appendChild(hp);
      }

      // Error message element (shown only if a submission fails).
      var err = $(".form-error", form);
      if (!err) {
        err = document.createElement("p");
        err.className = "form-error";
        err.setAttribute("role", "alert");
        err.hidden = true;
        err.style.cssText = "margin:14px 0 0;color:#b3261e;font-size:.9rem;line-height:1.45";
        form.appendChild(err);
      }

      var submitBtn = $('[type="submit"]', form);
      var DEFAULT_ERROR = "Sorry, we couldn't send your enquiry just now. Please try again, or email andrew@expeditionyorkshire.com or call 01904 235928.";

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validateForm(form)) return;

        var data = {};
        $$("input,select,textarea", form).forEach(function (el) { if (el.name) data[el.name] = el.value; });

        err.hidden = true;
        var originalLabel = submitBtn ? submitBtn.textContent : "";
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }

        function showError(message) {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
          err.textContent = message || DEFAULT_ERROR;
          err.hidden = false;
        }

        recaptcha.getToken("enquiry").then(function (token) {
          data.recaptcha_token = token;
          return fetch("/api/enquiry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          });
        }).then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            if (res.ok && body && body.ok) {
              track("generate_lead", {
                currency: "GBP", value: 985,
                tour: data.tour || form.getAttribute("data-tour") || "General enquiry",
                group_size: data.group || ""
              });
              // Only after a successful API response, redirect to the dedicated
              // success page. Failed submissions fall through to showError below
              // and stay on the form.
              window.location.assign("/enquiry-received/");
            } else {
              showError(body && body.error);
            }
          });
        }).catch(function () { showError(); });
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

    // Open the modal showing the dedicated Booking Calendar for `experienceId`.
    function openCalendar(experienceId, tourName) {
      lastFocus = document.activeElement;
      var form = $(".enquiry-form", overlay);
      var success = $(".form-success", overlay);
      var picker = overlay.querySelector(".tour-picker");
      if (form) form.style.display = "none";
      if (success) success.classList.remove("show");
      if (picker) picker.style.display = "none";
      var label = $(".modal-tour-label", overlay);
      if (label && tourName) label.textContent = tourName;
      var host = showModalCalendar(overlay, experienceId);
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      if (host) {
        host.setAttribute("tabindex", "-1");
        try { host.focus({ preventScroll: true }); } catch (err) { host.focus(); }
      }
      track("begin_checkout", { item_name: tourName || "Booking" });
    }

    // Build the branded tour-picker view once and cache it inside the modal.
    function buildPicker() {
      var container = overlay.querySelector(".enquiry");
      if (!container) return null;
      var existing = container.querySelector(".tour-picker");
      if (existing) return existing;
      var picker = document.createElement("div");
      picker.className = "tour-picker";
      picker.style.display = "none";
      var head =
        '<h2>Choose your experience</h2>' +
        '<p class="form-intro">Pick a tour to see live dates and prices, or tell us what you have in mind.</p>';
      var list = document.createElement("div");
      list.className = "tour-picker-list";
      PICKER_TOURS.forEach(function (t) {
        var item = document.createElement("button");
        item.type = "button";
        item.className = "tour-picker-item";
        item.setAttribute("data-tour", t.name);
        if (t.id) item.setAttribute("data-bokun-id", t.id);
        else item.setAttribute("data-enquiry", "true");
        item.innerHTML =
          '<span class="tp-text"><span class="tp-name">' + t.name + '</span>' +
          '<span class="tp-blurb">' + t.blurb + '</span></span>' +
          '<span class="tp-go" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 6l6 6-6 6"/></svg></span>';
        item.addEventListener("click", function () {
          var name = t.name;
          if (t.enquiry) { open(name); return; }
          openCalendar(t.id, name);
        });
        list.appendChild(item);
      });
      picker.innerHTML = head;
      picker.appendChild(list);
      // Insert before the form so it reads first when shown.
      var form = container.querySelector(".enquiry-form");
      container.insertBefore(picker, form || null);
      return picker;
    }

    // Open the modal showing the branded tour picker (global CTAs).
    function openPicker() {
      lastFocus = document.activeElement;
      var picker = buildPicker();
      var form = $(".enquiry-form", overlay);
      var success = $(".form-success", overlay);
      var calendars = overlay.querySelector(".bokun-modal-calendars");
      if (form) form.style.display = "none";
      if (success) success.classList.remove("show");
      if (calendars) calendars.style.display = "none";
      if (picker) picker.style.display = "";
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      var first = picker && picker.querySelector(".tour-picker-item");
      if (first) first.focus();
      track("view_item_list", { item_list_name: "Tour picker" });
    }

    // Open the modal showing the enquiry form (no specific bookable tour).
    function open(tourName) {
      var picker = overlay.querySelector(".tour-picker");
      if (picker) picker.style.display = "none";
      lastFocus = document.activeElement;
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      // hide any calendar view a previous open may have shown
      var calendars = overlay.querySelector(".bokun-modal-calendars");
      if (calendars) calendars.style.display = "none";
      // reset to form view if a previous submit left success showing
      var form = $(".enquiry-form", overlay);
      var success = $(".form-success", overlay);
      if (form) form.style.display = "";
      if (success) success.classList.remove("show");
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

        // Is this button explicitly tied to a tour (card / "Help me choose")?
        var explicit = btn.getAttribute("data-bokun-id") || btn.getAttribute("data-experience-id");
        var tourAttr = btn.getAttribute("data-tour");
        var explicitId = explicit ? explicit.trim() : (tourAttr ? mapExperience(tourAttr) : null);

        // 1. Button targets a specific bookable tour.
        if (explicitId) {
          // If it's this page's own dedicated calendar, open it in place.
          var pageWidgetA = pageCalendarWidget();
          var pageIdA = widgetExperienceId(pageWidgetA);
          if (pageWidgetA && explicitId === pageIdA) {
            var shellA = pageWidgetA.closest(".bokun-booking-shell");
            shellA.scrollIntoView({ behavior: "smooth", block: "start" });
            shellA.setAttribute("tabindex", "-1");
            try { shellA.focus({ preventScroll: true }); } catch (err) { shellA.focus(); }
            return;
          }
          openCalendar(explicitId, tourName);
          return;
        }

        // 2. Button tied to a named-but-not-bookable option ("Not sure yet",
        //    chauffeur transfers) → enquiry form.
        if (tourAttr) { open(tourName || ""); return; }

        // 3. Global CTAs (header / footer / sticky) ALWAYS open the branded
        //    tour picker — same behaviour on every page. "Global button =
        //    choose a tour."
        if (btn.closest(".site-header, .site-footer, .sticky-cta")) {
          openPicker();
          return;
        }

        // 4. Other generic buttons (hero / in-body on a tour page) open this
        //    page's own dedicated calendar in place when it has one; otherwise
        //    they fall back to the picker.
        var pageWidget = pageCalendarWidget();
        var pageId = widgetExperienceId(pageWidget);
        if (pageWidget && pageId) {
          var shell = pageWidget.closest(".bokun-booking-shell");
          shell.scrollIntoView({ behavior: "smooth", block: "start" });
          shell.setAttribute("tabindex", "-1");
          try { shell.focus({ preventScroll: true }); } catch (err) { shell.focus(); }
          return;
        }
        openPicker();
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

  /* ---------- Sticky booking dock (tour detail: price + CTA) ----------
     Non-intrusive: appears after the hero, and hides once the live Bókun
     booking widget scrolls into view so it never doubles up on the calendar.
     Gated on #booking-dock so other pages are unaffected. */
  function initBookingDock() {
    var dock = document.getElementById("booking-dock");
    if (!dock) return;
    var hero = $(".hero");
    var bookingShell = document.querySelector(".bokun-booking-shell:not(.bokun-modal-calendars)");
    var footer = document.querySelector("footer.site-footer") || document.querySelector(".site-footer") || document.querySelector("footer");
    function shouldShow() {
      var threshold = hero ? hero.offsetHeight * 0.6 : 400;
      if (window.scrollY <= threshold) return false;
      if (bookingShell) {
        var r = bookingShell.getBoundingClientRect();
        // Once the top of the booking widget is on screen, stand down.
        if (r.top < window.innerHeight - 80) return false;
      }
      // Once the footer scrolls into view, stand down so its links stay accessible.
      if (footer) {
        var fr = footer.getBoundingClientRect();
        if (fr.top < window.innerHeight) return false;
      }
      return true;
    }
    function onScroll() { dock.classList.toggle("show", shouldShow()); }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Price calculator (split-between-group) — Whitby page only ---------- */
  function initPriceCalc() {
    var calc = document.querySelector(".pf-calc");
    if (!calc) return;
    var total = parseFloat(calc.getAttribute("data-total")) || 985;
    var ppEl = calc.querySelector(".pf-calc-pp");
    var nEl = calc.querySelector(".pf-calc-n");
    var btns = $$(".pf-calc-btn", calc);
    if (!btns.length) return;
    function update(size) {
      var pp = Math.round(total / size);
      if (ppEl) ppEl.textContent = "£" + pp;
      if (nEl) nEl.textContent = String(size);
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.remove("is-active"); x.setAttribute("aria-pressed", "false"); });
        b.classList.add("is-active");
        b.setAttribute("aria-pressed", "true");
        var size = parseInt(b.getAttribute("data-size"), 10) || 7;
        update(size);
      });
    });
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
    try { initBokunLazy(); } catch (e) {}
    try { initStickyHeader(); } catch (e) {}
    try { initStickyBar(); } catch (e) {}
    try { initBookingDock(); } catch (e) {}
    try { initPriceCalc(); } catch (e) {}
    try { initConsent(); } catch (e) {}
    try { initCompareTiles(); } catch (e) {}
  });

})();
