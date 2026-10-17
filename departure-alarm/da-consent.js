/* Consent-gated Google Analytics (portfolio consent-gate pattern, 2026-10-11, from BMPD).
   Before a choice: zero analytics requests. "Allow" loads GA4; "No thanks" keeps
   it off and clears GA cookies. Choice lasts 13 months; "Privacy choices" in the
   "Your progress" screen reopens it. Production host only. Plain script, never bundled. */
(function () {
  'use strict';

  var GA4_MEASUREMENT_ID = 'G-0Q9K6FMX89';
  var CONSENT_KEY = 'da_analytics_consent_v1';
  var CONSENT_MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000;
  var PRODUCTION_HOSTS = ['drlizlondon.github.io'];

  if (PRODUCTION_HOSTS.indexOf(window.location.hostname) === -1) return;

  function readConsent() {
    try {
      var stored = window.localStorage.getItem(CONSENT_KEY);
      if (!stored) return null;
      var choice = JSON.parse(stored);
      if (!choice || !choice.value || !choice.decidedAt) return null;
      if (Date.now() - choice.decidedAt > CONSENT_MAX_AGE_MS) return null;
      return choice.value;
    }
    catch (error) { return null; }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ value: value, decidedAt: Date.now() }));
    }
    catch (error) { /* The choice still applies for this page load. */ }
  }

  function loadGoogleAnalytics() {
    if (document.querySelector('script[data-da-ga4]')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID, { anonymize_ip: true, cookie_flags: 'SameSite=None;Secure' });
    var script = document.createElement('script');
    script.async = true;
    script.dataset.daGa4 = 'true';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_MEASUREMENT_ID);
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

  function removePrompt() {
    var prompt = document.getElementById('da-analytics-consent');
    if (prompt) prompt.remove();
  }

  function choose(value) {
    var wasLoaded = Boolean(document.querySelector('script[data-da-ga4]'));
    writeConsent(value);
    removePrompt();
    if (value === 'granted') { loadGoogleAnalytics(); return; }
    clearAnalyticsCookies();
    // Withdrawn mid-session: reload so the tag is gone.
    if (wasLoaded) window.location.reload();
  }

  function showPrompt(isPreferences) {
    if (document.getElementById('da-analytics-consent')) return;
    var prompt = document.createElement('section');
    prompt.id = 'da-analytics-consent';
    prompt.setAttribute('role', 'dialog');
    prompt.setAttribute('aria-modal', 'false');
    prompt.setAttribute('aria-label', isPreferences ? 'Privacy choices' : 'Analytics consent');
    prompt.innerHTML =
      '<p>May we use Google Analytics to count visits? It stays off unless you allow it.</p>' +
      '<div class="da-consent-actions">' +
        '<button type="button" data-consent="denied">No thanks</button>' +
        '<button type="button" data-consent="granted">Allow</button>' +
      '</div>';
    prompt.querySelector('[data-consent="denied"]').addEventListener('click', function () { choose('denied'); });
    prompt.querySelector('[data-consent="granted"]').addEventListener('click', function () { choose('granted'); });
    document.body.appendChild(prompt);
  }

  function bindPrivacyChoicesLink() {
    // The link lives in index.html (Your progress screen): this app is full-screen, no page footer.
    var link = document.querySelector('[data-da-privacy-choices]');
    if (!link) return;
    link.hidden = false;
    link.addEventListener('click', function (event) { event.preventDefault(); showPrompt(true); });
  }

  function addStyles() {
    var style = document.createElement('style');
    style.textContent =
      '#da-analytics-consent{position:fixed;z-index:2147483646;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:space-between;gap:14px;max-width:640px;margin:0 auto;padding:10px 12px;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:#24002f;color:#fff;box-shadow:0 12px 40px rgba(0,0,0,.45);font:13px/1.35 Inter,system-ui,sans-serif}' +
      '#da-analytics-consent p{margin:0;color:#ead8f3}' +
      '.da-consent-actions{display:flex;flex:0 0 auto;gap:6px}' +
      '.da-consent-actions button{min-height:44px;padding:0 14px;border:1px solid rgba(255,255,255,.35);border-radius:14px;background:transparent;color:#fff;cursor:pointer;font:700 13px/1 Inter,system-ui,sans-serif}' +
      '.da-consent-actions [data-consent="granted"]{border-color:#ff2f9b;background:#ff2f9b}' +
      '@media(max-width:620px){#da-analytics-consent{left:8px;right:8px;gap:10px;padding:8px 10px;font-size:12px}.da-consent-actions button{padding:0 12px;font-size:12px}}';
    document.head.appendChild(style);
  }

  function initialise() {
    addStyles();
    bindPrivacyChoicesLink();
    var consent = readConsent();
    if (consent === 'granted') loadGoogleAnalytics();
    if (consent !== 'granted' && consent !== 'denied') showPrompt(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise);
  else initialise();
})();
