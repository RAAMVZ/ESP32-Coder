(()=>{
  'use strict';
  const config=window.ESP32_SITE_CONFIG || {};
  let repo=String(config.repository||'').trim();
  // Keep repository links correct on GitHub Pages after a username change.
  const pagesHost=/^([a-zA-Z0-9-]+)\.github\.io$/i.exec(location.hostname);
  const pagesPath=location.pathname.split('/').filter(Boolean)[0];
  if(pagesHost && pagesPath && /^ESP32-Coder-Releases$/i.test(pagesPath)) repo=`${pagesHost[1]}/${pagesPath}`;
  const match=/^([a-zA-Z0-9-]{1,39})\/([a-zA-Z0-9_.-]{1,100})$/.exec(repo);
  const locale=document.documentElement.lang==='en'?'en':'ru';
  const text=locale==='ru'?{
    checking:'Проверяем GitHub Releases…',
    empty:'Пока нет опубликованного релиза. Проверьте GitHub.',
    fail:'Не удалось проверить версию. Кнопка всё равно ведёт к последнему релизу GitHub.',
    found:'Последняя опубликованная версия',
    open:'Открыть последний релиз на GitHub ↗',
    size:'Размер ZIP',date:'Опубликовано',nozip:'В текущем релизе ZIP не найден — проверьте файлы на GitHub.'
  }:{
    checking:'Checking GitHub Releases…',
    empty:'No published release yet. Check GitHub.',
    fail:'Release details are unavailable. The button still opens the latest GitHub release.',
    found:'Latest published version',
    open:'Open latest release on GitHub ↗',
    size:'ZIP size',date:'Published',nozip:'No ZIP asset was found in this release — check its GitHub files.'
  };
  const root=match ? `https://github.com/${match[1]}/${match[2]}` : 'https://github.com/RAAMVZ/ESP32-Coder-Releases';
  const latestUrl=`${root}/releases/latest`;
  const releasesUrl=`${root}/releases`;
  const elements={
    status:document.getElementById('release-status'),
    version:document.getElementById('release-version'),
    button:document.getElementById('download-latest'),
    hero:document.getElementById('hero-download'),
    meta:document.getElementById('release-meta'),
    all:document.getElementById('all-releases')
  };
  document.querySelectorAll('[data-repo-link]').forEach(link=>{
    link.href=link.getAttribute('data-repo-link')==='repo' ? root : releasesUrl;
  });
  // Every Download CTA opens the release page, never a direct ZIP or EXE URL.
  document.querySelectorAll('a.nav-download').forEach(link=>{link.href=latestUrl;});
  if(elements.all)elements.all.href=releasesUrl;
  if(elements.button){elements.button.href=latestUrl;elements.button.textContent=text.open;}
  if(elements.hero)elements.hero.href=latestUrl;
  if(!match){if(elements.status)elements.status.textContent=text.fail;document.querySelectorAll('[data-latest-version]').forEach(el=>el.textContent=locale==='ru'?'Посмотреть на GitHub':'View on GitHub');return;}
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  fetch(`https://api.github.com/repos/${match[1]}/${match[2]}/releases/latest`,{
    headers:{'Accept':'application/vnd.github+json'},cache:'no-store',signal:controller.signal
  })
  .then(async response=>{
    if(response.status===404)return null;
    if(!response.ok)throw new Error(String(response.status));
    return response.json();
  })
  .then(release=>{
    if(!release){if(elements.status)elements.status.textContent=text.empty;document.querySelectorAll('[data-latest-version]').forEach(el=>el.textContent=locale==='ru'?'Посмотреть на GitHub':'View on GitHub');return;}
    const tag=String(release.tag_name||'');
    if(elements.version)elements.version.textContent=tag||'—';
    document.querySelectorAll('[data-latest-version]').forEach(el=>{el.textContent=tag||'GitHub';el.href=latestUrl;});
    if(/^v\d+\.\d+\.\d+$/.test(tag))document.querySelectorAll('.wver').forEach(el=>{el.textContent=tag;});
    if(elements.status)elements.status.textContent=text.found;
    const parts=[];
    const zip=Array.isArray(release.assets)?release.assets.find(asset=>/\.zip$/i.test(asset.name||'') && /^ESP32[-_ ]?Coder/i.test(asset.name||'')):null;
    if(zip && Number.isFinite(zip.size)&&zip.size>0)parts.push(`${text.size}: ${(zip.size/1048576).toFixed(1)} MB`);
    const date=release.published_at?new Date(release.published_at):null;
    if(date && !Number.isNaN(date.getTime()))parts.push(`${text.date}: ${new Intl.DateTimeFormat(locale==='ru'?'ru-RU':'en-US',{year:'numeric',month:'short',day:'numeric'}).format(date)}`);
    if(elements.meta)elements.meta.textContent=parts.join(' · ');
    if(!zip && elements.status)elements.status.textContent=text.nozip;
  })
  .catch(()=>{if(elements.status)elements.status.textContent=text.fail;document.querySelectorAll('[data-latest-version]').forEach(el=>el.textContent=locale==='ru'?'Посмотреть на GitHub':'View on GitHub');})
  .finally(()=>clearTimeout(timeout));
})();

(()=>{document.querySelectorAll('[data-carousel]').forEach(carousel=>{const slides=[...carousel.querySelectorAll('.carousel-slide')];const dots=[...carousel.querySelectorAll('.carousel-dot')];if(!slides.length)return;let index=0;const sync=()=>{slides.forEach((slide,i)=>slide.classList.toggle('is-active',i===index));dots.forEach((dot,i)=>dot.classList.toggle('is-active',i===index));};carousel.querySelector('.prev')?.addEventListener('click',()=>{index=(index-1+slides.length)%slides.length;sync();});carousel.querySelector('.next')?.addEventListener('click',()=>{index=(index+1)%slides.length;sync();});dots.forEach((dot,i)=>dot.addEventListener('click',()=>{index=i;sync();}));sync();});})();



(()=>{
 const icon=(name)=>`<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${name==='close'?'<path d="M18 6 6 18M6 6l12 12"/>':name==='left'?'<path d="M15 18 9 12l6-6"/>':'<path d="m9 18 6-6-6-6"/>'}</svg>`;
 const loc=document.documentElement.lang==='en'?'en':'ru';
 const tr=loc==='ru'?{close:'Закрыть просмотр',prev:'Предыдущий скриншот',next:'Следующий скриншот',dialog:'Просмотр снимков ESP32 Coder'}:
  {close:'Close viewer',prev:'Previous screenshot',next:'Next screenshot',dialog:'ESP32 Coder screenshot viewer'};
 const modal=document.createElement('div');modal.className='screenshot-lightbox';
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label',tr.dialog);modal.setAttribute('aria-hidden','true');
 modal.innerHTML=`<div class="lightbox-dialog"><button class="lightbox-close" type="button" aria-label="${tr.close}" title="${tr.close}">${icon('close')}</button><button class="lightbox-nav lightbox-prev" type="button" aria-label="${tr.prev}" title="${tr.prev}">${icon('left')}</button><div class="lightbox-image-wrap"><img class="lightbox-image" alt=""><div class="lightbox-caption"></div></div><button class="lightbox-nav lightbox-next" type="button" aria-label="${tr.next}" title="${tr.next}">${icon('right')}</button></div>`;
 document.body.appendChild(modal);
 const closeBtn=modal.querySelector('.lightbox-close');
 const prevBtn=modal.querySelector('.lightbox-prev');
 const nextBtn=modal.querySelector('.lightbox-next');
 const img=modal.querySelector('.lightbox-image');
 const caption=modal.querySelector('.lightbox-caption');
 let current=[],index=0,previousFocus=null;
 const render=()=>{const item=current[index];if(!item)return;img.src=item.getAttribute('href');img.alt=item.querySelector('img')?.alt||'';img.dataset.full=item.getAttribute('href')||'';caption.textContent=item.closest('.screenshot-figure')?.querySelector('.screenshot-caption span')?.textContent||'';};
 const open=(items,i)=>{
  current=items;index=i;previousFocus=document.activeElement;render();
  modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';closeBtn.focus();
  // Native fullscreen on the FIRST click. Full-viewport viewer is the fallback.
  try{const result=modal.requestFullscreen?.({navigationUI:'hide'});result?.catch?.(()=>{});}catch(e){}
 };
 const close=()=>{
  if(!modal.classList.contains('is-open'))return;
  modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';img.removeAttribute('src');
  if(document.fullscreenElement===modal){document.exitFullscreen?.().catch?.(()=>{});}
  previousFocus?.focus?.();
 };
 const step=dir=>{if(!current.length)return;index=(index+dir+current.length)%current.length;render();};
 document.querySelectorAll('[data-carousel]').forEach(carousel=>{const items=[...carousel.querySelectorAll('.carousel-slide .interface-shot')];items.forEach((a,i)=>a.addEventListener('click',ev=>{ev.preventDefault();open(items,i);}));});
 // Explicit close handler: do not depend on delegated click target or z-index of image.
 closeBtn.addEventListener('click',ev=>{ev.stopPropagation();close();});
 prevBtn.addEventListener('click',ev=>{ev.stopPropagation();step(-1);});
 nextBtn.addEventListener('click',ev=>{ev.stopPropagation();step(1);});
 // The first click opens the maximized viewer; image clicks stay in the viewer.

 modal.addEventListener('click',ev=>{if(ev.target===modal)close();});
 // Esc from the browser itself exits native fullscreen; close the overlay too.
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&modal.classList.contains('is-open'))close();});
 document.addEventListener('keydown',ev=>{if(!modal.classList.contains('is-open'))return;
  if(ev.key==='Escape'){ev.preventDefault();close();}
  else if(ev.key==='ArrowLeft'){ev.preventDefault();step(-1);}
  else if(ev.key==='ArrowRight'){ev.preventDefault();step(1);}
  else if(ev.key==='Tab'){const buttons=[closeBtn,prevBtn,nextBtn];const i=buttons.indexOf(document.activeElement);if(ev.shiftKey&&i===0){ev.preventDefault();buttons[2].focus();}else if(!ev.shiftKey&&i===2){ev.preventDefault();buttons[0].focus();}}
 });
})();


// Compact feed navigation: decorative progress on top of native CSS scroll snap.
// Scroll itself remains native (wheel, touch, keyboard, anchor links).
(()=>{
  if(!document.documentElement.classList.contains('feed-page'))return;
  const stages=[...document.querySelectorAll('main>.feed-stage')];
  const links=[...document.querySelectorAll('.feed-nav a')];
  const header=document.querySelector('.site-header');
  if(!stages.length||!header)return;
  const updateHeader=()=>document.documentElement.style.setProperty('--header-h',Math.ceil(header.getBoundingClientRect().height)+'px');
  updateHeader();
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(updateHeader).observe(header);
  else window.addEventListener('resize',updateHeader,{passive:true});
  let scheduled=false;
  const updateCurrent=()=>{
    scheduled=false;
    const target=header.getBoundingClientRect().height+Math.min(90,(window.innerHeight-header.getBoundingClientRect().height)*.22);
    let closest=0,dist=Infinity;
    stages.forEach((stage,i)=>{
      const r=stage.getBoundingClientRect();
      const d=r.top<=target && r.bottom>=target ? 0 : Math.min(Math.abs(r.top-target),Math.abs(r.bottom-target));
      if(d<dist){dist=d;closest=i;}
    });
    const active='#'+(stages[closest].id||'overview');
    links.forEach(a=>{
      if(a.getAttribute('href')===active)a.setAttribute('aria-current','step');
      else a.removeAttribute('aria-current');
    });
  };
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(updateCurrent);};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  schedule();
})();


// Close FAQ cards with the same flip animation as opening.
// Native <details> still works if JavaScript is unavailable.
(()=>{
 const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('.faq-grid details').forEach(card=>{
  const summary=card.querySelector('summary');
  if(!summary)return;
  let closing=false;
  summary.addEventListener('click',event=>{
   if(!card.open)return; // Native open transition is styled in CSS.
   event.preventDefault();
   if(closing)return;
   if(reduceMotion?.matches){card.open=false;return;}
   closing=true;
   card.classList.add('faq-flip-closing');
   window.setTimeout(()=>{
    card.open=false;
    card.classList.remove('faq-flip-closing');
    closing=false;
   },460);
  });
 });
})();
