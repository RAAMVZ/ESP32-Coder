/* Dynamically show the latest published stable GitHub release on Docs pages. */
(()=>{
  const nodes=document.querySelectorAll('[data-doc-version]');
  if(!nodes.length)return;
  const repo=(window.ESP32_SITE_CONFIG&&window.ESP32_SITE_CONFIG.repository)||'RAAMVZ/ESP32-Coder';
  const tag=/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(repo)?repo:'RAAMVZ/ESP32-Coder';
  fetch(`https://api.github.com/repos/${tag}/releases/latest`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'})
    .then(response=>{if(!response.ok)throw new Error('GitHub '+response.status);return response.json()})
    .then(data=>{
      const version=String(data.tag_name||'').trim();
      if(!/^v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(version))throw new Error('Release tag missing');
      nodes.forEach(el=>el.textContent=version.startsWith('v')?version:'v'+version);
    })
    .catch(()=>nodes.forEach(el=>el.textContent=el.closest('html')?.lang==='en'?'version unavailable':'версия недоступна'));
})();
