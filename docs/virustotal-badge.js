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
      badge.href = vt.url;
      badge.hidden = false;
      badge.style.display = 'inline-flex';
      badge.style.alignItems = 'center';
      badge.style.gap = '5px';
    } catch (_) {
      // No false-positive “0 detections” claim on network/JSON failures.
    }
  })();
})();
