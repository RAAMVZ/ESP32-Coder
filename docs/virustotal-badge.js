// ESP32 Coder — live VirusTotal badge for the published release.
// No API keys, no claims from unverified/absent reports. Uses only the GitHub Pages JSON.
(() => {
  'use strict';
  const badge = document.querySelector('[data-virustotal-badge]');
  if (!badge || typeof fetch !== 'function') return;

  const sha256 = /^[a-f0-9]{64}$/i;
  const repo = 'https://github.com/RAAMVZ/ESP32-Coder/releases/tag/';
  (async () => {
    try {
      const response = await fetch('./security/latest.json', { cache: 'no-store' });
      if (!response.ok) return;
      const report = await response.json();
      const current = window.ESP32_SITE_CONFIG && window.ESP32_SITE_CONFIG.publishedVersion;
      // Historical v1.1.12 results must never give the current v1.1.13 badge a green state.
      if (!/^v\d+\.\d+\.\d+$/.test(current || '') || report.release_tag !== current) return;
      const cr = await fetch('./security/ai-latest.json', {cache:'no-store'});
      if (cr.ok) {
        const codex = await cr.json();
        if (codex.schema_version === 2 && codex.provider === 'OpenAI Codex CLI' && codex.status === 'completed' &&
            (codex.release_tag !== current || codex.exe_sha256 !== report.sha256 || codex.zip_sha256 !== report.zip_sha256)) return;
      }
      const vt = report && report.virustotal;
      if (!vt || report.schema_version !== 1 ||
          !/^\d+\.\d+\.\d+$/.test(report.version || '') ||
          report.release_tag !== 'v' + report.version ||
          report.filename !== 'esp32coder.exe' ||
          !sha256.test(report.sha256 || '') ||
          !sha256.test(report.zip_sha256 || '') ||
          report.github_release !== repo + report.release_tag ||
          report.updater_ed25519_verified !== true ||
          vt.malicious !== 0 || vt.suspicious !== 0 ||
          !Number.isInteger(vt.completed_engines) || vt.completed_engines < 20 ||
          !Number.isFinite(Date.parse(vt.scan_utc)) ||
          Date.parse(vt.scan_utc) > Date.now() + 300000 ||
          vt.url !== 'https://www.virustotal.com/gui/file/' + report.sha256 + '/detection') return;
      // Open the summary in the currently selected website language.
      // The localized report contains a verified direct link to vt.url.
      // VirusTotal's own interface language cannot be controlled by us.
      const locale = badge.getAttribute('data-virustotal-badge') === 'ru' ? 'ru' : 'en';
      badge.href = './security-' + locale + '.html';
      badge.classList.add('is-verified');
      const label = badge.querySelector('.trust-badge-text');
      if (label) label.textContent = locale === 'ru' ? 'VirusTotal · 0 обнаружений' : 'VirusTotal · 0 detections';
    } catch (_) {
      // Leave the neutral report link visible without claiming 0 detections.
    }
  })();
})();
