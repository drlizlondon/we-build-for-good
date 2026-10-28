/* Consent-gated Google Analytics 4 for FRCEM100.
   Dual-tag tracking: sends events to both FRCEM100 (G-SZ19QBXGMG)
   and site-wide We Build For Good (G-KPX3RQ80V1).
   Zero tracking requests fire before explicit user consent.
   Shares consent state with wb4g_consent localStorage key. */
(function () {
  'use strict';

  var FRCEM_MEASUREMENT_ID = 'G-SZ19QBXGMG';
  var WB4G_MEASUREMENT_ID = 'G-KPX3RQ80V1';
  var CONSENT_KEY = 'wb4g_consent';

  function readConsent() {
    try {
      return window.localStorage.getItem(CONSENT_KEY);
    } catch (e) {
      return null;
    }
  }

  function writeConsent(val) {
    try {
      window.localStorage.setItem(CONSENT_KEY, val);
    } catch (e) {}
  }

  function loadGoogleAnalytics() {
    if (document.querySelector('script[data-frcem-ga4]')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', FRCEM_MEASUREMENT_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure'
    });
    window.gtag('config', WB4G_MEASUREMENT_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure'
    });

    var script = document.createElement('script');
    script.async = true;
    script.dataset.frcemGa4 = 'true';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(FRCEM_MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  function clearAnalyticsCookies() {
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0) {
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax';
        document.cookie = name + '=; Max-Age=0; path=/; domain=.' + window.location.hostname + '; SameSite=Lax';
      }
    });
  }

  function removeBanner() {
    var banner = document.getElementById('frcem-consent-banner');
    if (banner) banner.remove();
  }

  function choose(choice) {
    var wasLoaded = Boolean(document.querySelector('script[data-frcem-ga4]'));
    writeConsent(choice);
    removeBanner();
    if (choice === 'granted') {
      loadGoogleAnalytics();
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'consent_choice', { choice: 'granted' });
      }
      return;
    }
    clearAnalyticsCookies();
    if (wasLoaded) {
      window.location.reload();
    }
  }

  function showBanner() {
    if (document.getElementById('frcem-consent-banner')) return;
    var banner = document.createElement('aside');
    banner.id = 'frcem-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Privacy settings');
    banner.innerHTML =
      '<div class="frcem-consent-content">' +
        '<div class="frcem-consent-dot"></div>' +
        '<div class="frcem-consent-body">' +
          '<div class="frcem-consent-title">Privacy &amp; Analytics</div>' +
          '<p class="frcem-consent-desc">' +
            'We use privacy-first analytics to understand how FRCEM100 revision tools are used. Zero tracking requests fire without your consent.' +
          '</p>' +
          '<div class="frcem-consent-actions">' +
            '<button type="button" class="frcem-consent-btn frcem-consent-accept" data-consent="granted">Accept</button>' +
            '<button type="button" class="frcem-consent-btn frcem-consent-decline" data-consent="denied">Decline</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    banner.querySelector('[data-consent="granted"]').addEventListener('click', function () {
      choose('granted');
    });
    banner.querySelector('[data-consent="denied"]').addEventListener('click', function () {
      choose('denied');
    });
    document.body.appendChild(banner);
  }

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent =
      '#frcem-consent-banner{position:fixed;bottom:1rem;left:1rem;right:1rem;z-index:9999;max-width:28rem;margin-left:auto;padding:1rem;border-radius:1rem;background:rgba(255,255,255,0.96);backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.1);box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#111215}' +
      '.frcem-consent-content{display:flex;align-items:flex-start;gap:0.75rem}' +
      '.frcem-consent-dot{width:0.625rem;height:0.625rem;border-radius:9999px;background-color:#10b981;margin-top:0.375rem;flex-shrink:0}' +
      '.frcem-consent-body{flex:1}' +
      '.frcem-consent-title{font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.25rem;color:#111215;font-family:monospace}' +
      '.frcem-consent-desc{font-size:0.75rem;line-height:1.25rem;margin:0 0 0.75rem 0;color:#555962}' +
      '.frcem-consent-actions{display:flex;align-items:center;gap:0.5rem;font-family:monospace}' +
      '.frcem-consent-btn{padding:0.375rem 0.875rem;border-radius:9999px;font-size:0.75rem;font-weight:600;cursor:pointer;border:none;transition:all 0.15s ease}' +
      '.frcem-consent-accept{background:#111215;color:#ffffff}' +
      '.frcem-consent-accept:hover{background:#000000}' +
      '.frcem-consent-decline{background:rgba(0,0,0,0.05);color:#555962}' +
      '.frcem-consent-decline:hover{background:rgba(0,0,0,0.1)}' +
      '@media(max-width:640px){#frcem-consent-banner{left:0.75rem;right:0.75rem;bottom:0.75rem;padding:0.875rem}}';
    document.head.appendChild(style);
  }

  function init() {
    injectStyles();
    var consent = readConsent();
    if (consent === 'granted') {
      loadGoogleAnalytics();
    } else if (consent !== 'denied') {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
