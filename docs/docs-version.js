/* Current release number for RU/EN documentation.
 * Keep a publication-time fallback: rate limits, browser blockers or a transient
 * GitHub API failure must not replace a valid version with 'unavailable'.
 */
(()=>{
  'use strict';
  const nodes=[...document.querySelectorAll('[data-doc-version]')];
  if(!nodes.length)return;
  const settings=window.ESP32_SITE_CONFIG||{};
  const validVersion=/^v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/;
  const normalized=v=>{
    const s=String(v||'').trim();
    return validVersion.test(s)?(s.startsWith('v')?s:'v'+s):null;
  };
  const fallback=normalized(settings.publishedVersion)||'v1.1.7';
  const render=version=>nodes.forEach(el=>{el.textContent=version;});
  render(fallback);

  const repo=String(settings.repository||'RAAMVZ/ESP32-Coder');
  if(!/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9_.-]{1,100}$/.test(repo))return;
  const controller=typeof AbortController==='function'?new AbortController():null;
  const timeout=controller?setTimeout(()=>controller.abort(),8000):null;
  fetch(`https://api.github.com/repos/${repo}/releases/latest`,{
    headers:{Accept:'application/vnd.github+json'},
    cache:'default',
    ...(controller?{signal:controller.signal}:{})
  }).then(response=>{
    if(!response.ok)throw new Error('GitHub '+response.status);
    return response.json();
  }).then(data=>{
    const live=normalized(data.tag_name);
    if(live)render(live);
  }).catch(()=>{
    // A temporary outage or GitHub API rate limit is not a missing release.
    // Leave the last known published version visible.
  }).finally(()=>{if(timeout!==null)clearTimeout(timeout);});
})();
