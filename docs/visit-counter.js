/*
 * ESP32 Coder — discreet aggregate visit counter (RU and EN share one total).
 * No API key, no cookies, no personally identifying data stored by the site.
 * Provider: https://countapi.mileshilliard.com/
 * Count one page view per browser tab session; navigating between RU/EN/docs
 * reads the same total without increasing it again.
 * Local file previews do not add visits to the published website.
 */
(function () {
  'use strict';

  const element = document.getElementById('site-total-visits');
  if (!element) return;

  const base = 'https://countapi.mileshilliard.com/api/v1/';
  const key = 'raamvz_esp32_coder_all_pages_v1';
  const sessionKey = 'esp32-coder-counted-visit-v1';
  const liveSite = location.hostname.toLowerCase() === 'raamvz.github.io';

  let alreadyCounted = false;
  try {
    alreadyCounted = sessionStorage.getItem(sessionKey) === '1';
  } catch (_) {
    // Storage is sometimes unavailable in browsers opening pages via file://.
  }

  const increment = liveSite && !alreadyCounted;
  const operation = increment ? 'hit' : 'get';
  const requestUrl = base + operation + '/' + encodeURIComponent(key);

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeout = controller ? setTimeout(function () { controller.abort(); }, 8000) : null;

  fetch(requestUrl, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    ...(controller ? { signal: controller.signal } : {})
  })
    .then(function (response) {
      if (!response.ok) throw new Error('Counter unavailable');
      return response.json();
    })
    .then(function (response) {
      const number = Number(response && response.value);
      if (!Number.isSafeInteger(number) || number < 0) return;
      element.textContent = String(number);
      if (increment) {
        try { sessionStorage.setItem(sessionKey, '1'); } catch (_) { /* no storage */ }
      }
    })
    .catch(function () {
      // A network/privacy-blocker error must not disturb the rest of the site.
      element.textContent = '';
    })
    .finally(function () {
      if (timeout !== null) clearTimeout(timeout);
    });
}());
