// ESP32 Coder — GitHub Sigstore release-artifact attestation status.
// A site manifest is a pointer to independently verifiable proof; it is NOT
// itself a cryptographic verification in the browser. Never expose a green
// badge before local publisher confirms BOTH GitHub API and bundle signatures.
(() => {
  'use strict';
  const badge = document.querySelector('[data-github-attestation-badge]');
  if (!badge || typeof fetch !== 'function') return;
  const sha256 = /^[a-f0-9]{64}$/i;
  const repository = 'RAAMVZ/ESP32-Coder';
  const gh = 'https://github.com/' + repository;
  const workflow = repository + '/.github/workflows/esp32-coder-release-attestation.yml';
  (async () => {
    try {
      const [vr, ar] = await Promise.all([
        fetch('./security/latest.json', {cache:'no-store'}),
        fetch('./security/attestation.json', {cache:'no-store'})
      ]);
      if (!vr.ok || !ar.ok) return;
      const report = await vr.json();
      const proof = await ar.json();
      if (!report || !proof || report.schema_version !== 1 || proof.schema_version !== 1 ||
          proof.verified !== true ||
          !/^v\d+\.\d+\.\d+$/.test(report.release_tag || '') ||
          proof.release_tag !== report.release_tag ||
          report.version !== report.release_tag.slice(1) ||
          report.filename !== 'esp32coder.exe' || proof.filename !== report.filename ||
          !sha256.test(report.sha256 || '') || !sha256.test(report.zip_sha256 || '') ||
          report.sha256 !== proof.sha256 || report.zip_sha256 !== proof.zip_sha256 ||
          report.zip_filename !== proof.zip_filename ||
          report.github_release !== gh + '/releases/tag/' + report.release_tag ||
          report.github_release !== proof.github_release ||
          report.updater_ed25519_verified !== true ||
          !report.virustotal || report.virustotal.malicious !== 0 ||
          report.virustotal.suspicious !== 0 ||
          proof.workflow !== workflow ||
          proof.bundle_url !== gh + '/releases/download/' + report.release_tag +
                  '/ESP32-Coder-' + report.release_tag + '.sigstore.json' ||
          !/^https:\/\/github\.com\/RAAMVZ\/ESP32-Coder\/actions\/runs\/[0-9]+$/.test(proof.workflow_run_url)) return;
      const locale = badge.getAttribute('data-github-attestation-badge') === 'ru' ? 'ru' : 'en';
      badge.href = './sigstore-' + locale + '.html';
      badge.classList.add('is-verified');
      const label = badge.querySelector('.trust-badge-text');
      if (label) label.textContent = locale === 'ru' ? 'Sigstore · Аттестация подтверждена' : 'Sigstore · Attestation verified';
    } catch (_) { /* Keep neutral attestation-report link; no verified claim. */ }
  })();
})();
