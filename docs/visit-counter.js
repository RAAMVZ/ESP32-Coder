/*
 * ESP32 Coder — separate RU and EN visit counters.
 *
 * Each language uses its own public key and 24-hour browser de-duplication.
 * The old shared counter key is left untouched; historical visits cannot be
 * attributed to individual languages retroactively.
 * A successful live-site visit is counted at most once per 24-hour rolling
 * window per language in the same browser profile (localStorage, across tabs).
 * This is an approximate count of unique browsers, NOT unique people or a
 * server-side bot filter. Visitors can clear storage or use another browser.
 * Local file previews never increment the published total.
 */
(function () {
  'use strict';

  const element = document.getElementById('site-total-visits');
  if (!element) return;

  const locale = element.getAttribute('data-counter-locale');
  if (locale !== 'ru' && locale !== 'en') return;

  const endpoint = 'https://countapi.mileshilliard.com/api/v1/';
  const publicKey = 'raamvz_esp32_coder_' + locale + '_v1';
  const lastVisitKey = 'esp32-coder-last-visit-24h-' + locale + '-v2';
  const fallbackLockKey = 'esp32-coder-visit-lock-24h-' + locale + '-v2';
  const lockName = 'esp32-coder-visit-counter-24h-' + locale + '-v2';
  const periodMs = 24 * 60 * 60 * 1000;
  const liveSite = location.protocol === 'https:' &&
    location.hostname.toLowerCase() === 'raamvz.github.io';

  function display(value) {
    const number = Number(value);
    if (Number.isSafeInteger(number) && number >= 0) {
      element.textContent = locale.toUpperCase() + ': ' + number.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US');
    }
  }

  // Keep the small counter visible even if the remote service is unavailable.
  element.textContent = locale.toUpperCase() + ': —';
  element.title = locale === 'ru'
    ? 'Посещения русской версии (один браузер — один визит за 24 часа)'
    : 'English-version visits (one browser counted once per 24 hours)';

  function getStorage() {
    try {
      const store = window.localStorage;
      const testKey = 'esp32-coder-counter-storage-test';
      store.setItem(testKey, '1');
      store.removeItem(testKey);
      return store;
    } catch (_) {
      // If storage is blocked, read the total without incrementing it:
      // a 24-hour guarantee cannot be enforced without shared storage.
      return null;
    }
  }

  function isRecentVisit(store) {
    const last = Number(store.getItem(lastVisitKey));
    const now = Date.now();
    return Number.isFinite(last) && last > 0 && now >= last &&
      now - last < periodMs;
  }

  async function request(operation) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = controller ? setTimeout(function () { controller.abort(); }, 8000) : null;
    try {
      const response = await fetch(endpoint + operation + '/' + encodeURIComponent(publicKey), {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        ...(controller ? {signal: controller.signal} : {})
      });
      if (!response.ok) throw new Error('Visit count unavailable');
      const body = await response.json();
      const count = Number(body && body.value);
      if (!Number.isSafeInteger(count) || count < 0) {
        throw new Error('Invalid visit counter response');
      }
      display(count);
    } finally {
      if (timeout !== null) clearTimeout(timeout);
    }
  }

  async function countIfDue(store) {
    if (isRecentVisit(store)) {
      await request('get');
      return;
    }
    // Mark before the HTTP request, so F5, navigation or a new tab during
    // the request cannot create a second hit. Keep the mark after a network
    // error: a timed-out request may have incremented the server already.
    try {
      store.setItem(lastVisitKey, String(Date.now()));
    } catch (_) {
      await request('get');
      return;
    }
    await request('hit');
  }

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  // For older browsers without Web Locks, use a short best-effort lease.
  // Web Locks is the strong cross-tab safeguard in modern Chromium browsers.
  async function countWithFallbackLock(store) {
    const owner = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
    for (let attempt = 0; attempt < 8; attempt++) {
      if (isRecentVisit(store)) return request('get');
      let lease = null;
      try { lease = JSON.parse(store.getItem(fallbackLockKey) || 'null'); } catch (_) { }
      const now = Date.now();
      if (lease && lease.owner !== owner && Number(lease.until) > now) {
        await delay(150);
        continue;
      }
      try {
        store.setItem(fallbackLockKey, JSON.stringify({ owner: owner, until: now + 15000 }));
      } catch (_) {
        return request('get');
      }
      await delay(110);
      try { lease = JSON.parse(store.getItem(fallbackLockKey) || 'null'); } catch (_) { lease = null; }
      if (!lease || lease.owner !== owner) continue;
      try {
        return await countIfDue(store);
      } finally {
        try {
          lease = JSON.parse(store.getItem(fallbackLockKey) || 'null');
          if (lease && lease.owner === owner) store.removeItem(fallbackLockKey);
        } catch (_) { }
      }
    }
    // If locks are busy, prefer a harmless read rather than duplicate a hit.
    return request('get');
  }

  const storage = getStorage();
  let job;
  if (!liveSite || !storage) {
    job = request('get');
  } else if (navigator.locks && typeof navigator.locks.request === 'function') {
    job = navigator.locks.request(lockName, {mode: 'exclusive'}, function () {
      return countIfDue(storage);
    });
  } else {
    job = countWithFallbackLock(storage);
  }

  Promise.resolve(job).catch(function () {
    // A blocked/failed API must not disturb the website or leak any keys.
    // Keep the placeholder instead of displaying a fabricated visit count.
  });
}());
