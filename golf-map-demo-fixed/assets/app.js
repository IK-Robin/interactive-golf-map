const holes={
 'hole-1':{n:'01',title:'The Valley Opener',par:4,yards:384,index:5,black:410,white:384,red:346,text:'A welcoming opening hole with room on the left. Favor the center-right for the clearest approach.'},
 'hole-2':{n:'02',title:'Pine Rise',par:4,yards:412,index:3,black:438,white:412,red:367,text:'The fairway climbs gently between mature trees. The front bunker makes distance control important.'},
 'hole-3':{n:'03',title:"Eagle's Bend",par:5,yards:528,index:1,black:556,white:528,red:472,text:'A sweeping risk-and-reward par five with a generous safe lay-up area.'},
 'hole-4':{n:'04',title:'Lakeside',par:3,yards:176,index:6,black:196,white:176,red:138,text:'A memorable par three beside the water. The safe miss is short-left.'},
 'hole-5':{n:'05',title:'The Long View',par:4,yards:439,index:2,black:461,white:439,red:392,text:'The longest par four rewards a confident drive into the wide landing area.'},
 'hole-6':{n:'06',title:'Homeward',par:4,yards:368,index:4,black:392,white:368,red:329,text:'A beautiful hole turning toward the clubhouse with the best angle from the left.'}
};
const extraNames=['Garden Run','Willow Turn','Highland','Morning Sun','Ridge Line','Cedar Drop','South Bend','Golden Approach','Valley Edge','The Sweep','Clubhouse View','Grand Finish'];
for(let n=7;n<=18;n++){let par=n%4===0?3:n%3===0?5:4,yards=par===3?165+n:par===5?480+n*4:340+n*3;holes[`hole-${n}`]={n:String(n).padStart(2,'0'),title:extraNames[n-7],par,yards,index:19-n,black:yards+24,white:yards,red:yards-38,text:'A distinctive part of the course with a clear landing area and a carefully protected green.'}}

const config=window.GOLF_MAP_CONFIG||{},$=s=>document.querySelector(s),stage=$('#mapStage'),content=$('#mapContent'),card=$('#detailCard'),tip=$('#tooltip');
let scale=1,x=0,y=0,drag=false,moved=false,sx=0,sy=0,ox=0,oy=0,active='hole-1',selectedTee=config.defaultTee||'white',activeAnchor=null,pressTarget=null,flightFrame=0,flightToken=0,panFrame=0,focusToken=0,lastResponsiveMode=null;
document.documentElement.style.setProperty('--gold',config.accent||'#d6ad55');

fetch('assets/course-map.svg?v=20260723-1').then(r=>{if(!r.ok)throw Error('course-map.svg');return r.text()}).then(svg=>{
  $('#courseMap').innerHTML=svg;applyResponsiveMapFit(true);buildNavigation();bindMap();bindTools();const q=new URLSearchParams(location.search).get('hole'),start=holes[`hole-${q}`]?`hole-${q}`:'hole-1';selectHole(start,false,false);
}).catch(()=>{$('#courseMap').innerHTML='<div style="padding:40px;color:#173326">Please run this folder using a local web server. See README.txt.</div>'});

function buildNavigation(){
  $('#holeNav').innerHTML=Object.keys(holes).map((id,i)=>`<button class="${i===0?'active':''}" data-hole="${id}" aria-label="Hole ${holes[id].n}, par ${holes[id].par}, ${holes[id].yards} yards"><b>${holes[id].n}</b><small>P${holes[id].par} · ${holes[id].yards}</small></button>`).join('');
  document.querySelectorAll('.hole-nav button').forEach(b=>b.onclick=()=>selectHole(b.dataset.hole,true,true,$('#'+b.dataset.hole)));
  $('#holeNav').addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();$('#holeNav').scrollLeft+=e.deltaY}},{passive:false});
  const moveHole=step=>{let n=Number(active.replace('hole-',''))+step;if(n<1)n=18;if(n>18)n=1;selectHole(`hole-${n}`,true,true)};
  $('#holeNavPrev').onclick=()=>moveHole(-1);
  $('#holeNavNext').onclick=()=>moveHole(1);
}
function bindMap(){
  document.querySelectorAll('.hole-hit').forEach(el=>{el.addEventListener('pointerenter',e=>showTip(e,el.dataset.title));el.addEventListener('pointermove',moveTip);el.addEventListener('pointerleave',hideTip)});
  document.querySelectorAll('.hole-badge').forEach(el=>{el.addEventListener('pointerenter',e=>showTip(e,`Hole ${holes[el.dataset.hole].n} · ${holes[el.dataset.hole].title}`));el.addEventListener('pointermove',moveTip);el.addEventListener('pointerleave',hideTip)});
  document.querySelectorAll('.facility-hit').forEach(el=>{el.addEventListener('pointerenter',e=>showTip(e,el.dataset.title));el.addEventListener('pointermove',moveTip);el.addEventListener('pointerleave',hideTip)});
  document.querySelectorAll('.course-marker').forEach(el=>{el.addEventListener('pointerenter',e=>showTip(e,el.dataset.title));el.addEventListener('pointermove',moveTip);el.addEventListener('pointerleave',hideTip)});
}
function bindTools(){
  $('#teePicker').addEventListener('click',e=>{const b=e.target.closest('button[data-tee]');if(!b)return;selectedTee=b.dataset.tee;updateTee()});
  $('#holeLayerBtn').onclick=()=>{stage.classList.toggle('hide-holes');$('#holeLayerBtn').classList.toggle('active',!stage.classList.contains('hide-holes'))};
  $('#facilityLayerBtn').onclick=()=>{stage.classList.toggle('show-facilities');$('#facilityLayerBtn').classList.toggle('active',stage.classList.contains('show-facilities'))};
  if(config.showFacilities){stage.classList.add('show-facilities');$('#facilityLayerBtn').classList.add('active')}
  $('#shareBtn').onclick=async()=>{const url=new URL(location.href);url.searchParams.set('hole',active.replace('hole-',''));try{await navigator.clipboard.writeText(url.href);flashShare('Copied!')}catch{history.replaceState(null,'',url);flashShare('Link ready')}};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')card.classList.remove('open');if(!['ArrowLeft','ArrowRight'].includes(e.key))return;const n=Number(active.replace('hole-',''))+(e.key==='ArrowRight'?1:-1);if(n>=1&&n<=18)selectHole(`hole-${n}`,true,true)});
}
function flashShare(text){const b=$('#shareBtn'),old=b.textContent;b.textContent=text;setTimeout(()=>b.textContent=old,1200)}
function updateTee(){const h=holes[active];$('#cardYards').textContent=h[selectedTee];document.querySelectorAll('#teePicker button').forEach(b=>b.classList.toggle('active',b.dataset.tee===selectedTee))}
async function selectHole(id,open=true,center=true,anchor=null){
  stopCinematic();document.querySelectorAll('.shot-path').forEach(p=>p.classList.remove('play'));active=id;activeAnchor=document.querySelector(`.hole-badge[data-hole="${id}"]`)||anchor||$('#'+id);const h=holes[id];
  document.querySelectorAll('.hole-hit').forEach(e=>e.classList.toggle('active',e.id===id));
  document.querySelectorAll('.hole-badge').forEach(e=>e.classList.toggle('active',e.dataset.hole===id));
  document.querySelectorAll('.hole-nav button').forEach(e=>e.classList.toggle('active',e.dataset.hole===id));
  document.querySelector(`.hole-nav button[data-hole="${id}"]`)?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  $('#cardNumber').textContent=h.n;$('#cardTitle').textContent=h.title;$('#cardPar').textContent=h.par;$('#cardIndex').textContent=h.index;$('#cardText').textContent=h.text;updateTee();
  history.replaceState(null,'',`${location.pathname}?hole=${Number(h.n)}`);
  card.classList.add('anchor-card');card.classList.remove('open');
  if(center)await focusHole(id,true);if(id!==active)return;if(open){placeCardAtHole(id,activeAnchor);card.classList.add('open')}
}
function showTip(e,t){tip.textContent=t;tip.classList.add('show');moveTip(e)}function moveTip(e){tip.style.left=e.clientX+'px';tip.style.top=e.clientY+'px'}function hideTip(){tip.classList.remove('show')}
function transform(){content.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`}
function applyResponsiveMapFit(force=false){
  const compact=window.matchMedia('(max-width: 992px)').matches,mode=compact?'compact':'desktop';
  document.querySelectorAll('.svg-layer svg').forEach(svg=>svg.setAttribute('preserveAspectRatio',compact?'xMidYMid meet':'xMidYMid slice'));
  if(force||mode!==lastResponsiveMode){scale=1;x=0;y=0;transform();lastResponsiveMode=mode;card.classList.remove('open')}
}
function boundsAt(nx,ny,s=scale,allowFocusEdge=false){const r=stage.getBoundingClientRect(),edge=allowFocusEdge?Math.min(r.width,r.height)*.24:0,minX=r.width-r.width*s-edge,minY=r.height-r.height*s-edge;return{x:Math.min(edge,Math.max(minX,nx)),y:Math.min(edge,Math.max(minY,ny))}}
function bounds(nx,ny){return boundsAt(nx,ny,scale,true)}
function clamp(){let p=bounds(x,y);x=p.x;y=p.y}
function zoom(by){cancelAnimationFrame(panFrame);const r=stage.getBoundingClientRect(),cx=r.width/2,cy=r.height/2,ns=Math.min(3,Math.max(1,scale*by));x=cx-(cx-x)*(ns/scale);y=cy-(cy-y)*(ns/scale);scale=ns;clamp();transform()}
function mapPoint(id){
  const badge=document.querySelector(`.hole-badge[data-hole="${id}"]`),target=badge||$('#'+id),r=stage.getBoundingClientRect(),box=target.getBoundingClientRect();
  return{r,cx:(box.left-r.left+box.width/2-x)/scale,cy:(box.top-r.top+box.height/2-y)/scale}
}
function focusHole(id,withZoom=true){
  cancelAnimationFrame(panFrame);hideTip();$('#mapShell').classList.add('auto-moving');const token=++focusToken,{r,cx,cy}=mapPoint(id),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,baseZoom=r.width<520?1.14:r.width<900?1.24:1.38,maxZoom=r.width<520?1.65:r.width<900?1.82:2.05,required=Math.max(r.width/(2*Math.max(cx,1)),r.width/(2*Math.max(r.width-cx,1)),r.height/(2*Math.max(cy,1)),r.height/(2*Math.max(r.height-cy,1))),targetScale=withZoom?Math.min(maxZoom,Math.max(baseZoom,required)):scale,target=boundsAt(r.width/2-cx*targetScale,r.height/2-cy*targetScale,targetScale,true),ax=x,ay=y,as=scale,start=performance.now(),duration=reduced?1:r.width<700?850:1050;
  return new Promise(resolve=>{function frame(now){if(token!==focusToken){resolve(false);return}let t=Math.min(1,(now-start)/duration),e=t<.5?16*t*t*t*t*t:1-Math.pow(-2*t+2,5)/2;x=ax+(target.x-ax)*e;y=ay+(target.y-ay)*e;scale=as+(targetScale-as)*e;transform();if(t<1)panFrame=requestAnimationFrame(frame);else{$('#mapShell').classList.remove('auto-moving');hideTip();resolve(true)}}panFrame=requestAnimationFrame(frame)})
}
/* Fit the complete tee-to-green route inside the usable viewport before flight. */
function focusCinematicPath(id){
  cancelAnimationFrame(panFrame);hideTip();$('#mapShell').classList.add('auto-moving');
  const token=++focusToken,path=$('#path-'+id),hole=$('#'+id),badge=document.querySelector(`.hole-badge[data-hole="${id}"]`),r=stage.getBoundingClientRect(),phone=window.matchMedia('(max-width: 600px)').matches,mobile=r.width<700;
  const boxes=[path,hole,badge].filter(Boolean).map(el=>el.getBoundingClientRect());
  const left=Math.min(...boxes.map(b=>b.left)),top=Math.min(...boxes.map(b=>b.top)),right=Math.max(...boxes.map(b=>b.right)),bottom=Math.max(...boxes.map(b=>b.bottom));
  const route={x:(left-r.left-x)/scale,y:(top-r.top-y)/scale,w:(right-left)/scale,h:(bottom-top)/scale};
  /* Mobile has a shallow, landscape map card. Keep padding compact so the
     complete route can use the available height instead of becoming tiny. */
  const sidePad=phone?24:mobile?18:64,topPad=phone?52:mobile?20:54,bottomPad=phone?70:mobile?20:88,routePad=phone?18:mobile?12:54;
  const availableW=Math.max(180,r.width-sidePad*2),availableH=Math.max(180,r.height-topPad-bottomPad);
  const fitScale=Math.min(availableW/Math.max(1,route.w+routePad*2),availableH/Math.max(1,route.h+routePad*2));
  /* Desktop keeps the gentle pull-back. On phones, use the largest safe fit
     instead: this keeps the whole route visible while making the animation
     substantially larger and readable. */
  const zoomedOutScale=Math.max(1,scale-.30);
  const targetScale=mobile
    ? Math.max(1,Math.min(fitScale,phone?2.7:2.25))
    : Math.max(1,Math.min(zoomedOutScale,fitScale,1.55));
  const cx=route.x+route.w/2,cy=route.y+route.h/2,targetX=r.width/2-cx*targetScale,targetY=topPad+availableH/2-cy*targetScale;
  const ax=x,ay=y,as=scale,start=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?1:mobile?900:1100;
  return new Promise(resolve=>{function frame(now){if(token!==focusToken){resolve(false);return}const t=Math.min(1,(now-start)/duration),e=t<.5?16*t*t*t*t*t:1-Math.pow(-2*t+2,5)/2;x=ax+(targetX-ax)*e;y=ay+(targetY-ay)*e;scale=as+(targetScale-as)*e;transform();if(t<1)panFrame=requestAnimationFrame(frame);else{$('#mapShell').classList.remove('auto-moving');hideTip();resolve(true)}}panFrame=requestAnimationFrame(frame)})
}
function placeCardAtHole(id,anchor=activeAnchor){
  const shell=$('#mapShell'),shellRect=shell.getBoundingClientRect(),target=anchor&&anchor.isConnected?anchor:$('#'+id),anchorRect=target.getBoundingClientRect(),px=anchorRect.left-shellRect.left+anchorRect.width/2,py=anchorRect.top-shellRect.top+anchorRect.height/2,w=card.offsetWidth||300,h=card.offsetHeight||330,pad=12;
  let left=Math.max(pad,Math.min(shellRect.width-w-pad,px-w/2)),top=py-h-28,below=false;
  if(top<pad){top=py+28;below=true}top=Math.max(pad,Math.min(shellRect.height-h-pad,top));
  card.style.left=left+'px';card.style.top=top+'px';card.style.setProperty('--arrow-left',Math.max(18,Math.min(w-18,px-left))+'px');card.classList.toggle('below',below)
}

stage.addEventListener('pointerdown',e=>{stopCinematic();$('#mapShell').classList.remove('auto-moving');moved=false;pressTarget=e.target.closest?.('.hole-badge,.hole-hit,.facility-hit')||null;cancelAnimationFrame(panFrame);focusToken++;drag=true;sx=e.clientX;sy=e.clientY;ox=x;oy=y;stage.setPointerCapture(e.pointerId);stage.classList.add('grabbing');hideTip()});
stage.addEventListener('pointermove',e=>{if(!drag)return;let dx=e.clientX-sx,dy=e.clientY-sy;if(Math.hypot(dx,dy)>5)moved=true;let p=bounds(ox+dx,oy+dy);x=p.x;y=p.y;transform()});
stage.addEventListener('pointerup',()=>{drag=false;stage.classList.remove('grabbing');if(!moved&&pressTarget){if(pressTarget.classList.contains('hole-badge'))selectHole(pressTarget.dataset.hole,true,true,pressTarget);else if(pressTarget.classList.contains('hole-hit'))selectHole(pressTarget.id,true,true,pressTarget)}pressTarget=null});stage.addEventListener('pointercancel',()=>{drag=false;pressTarget=null;stage.classList.remove('grabbing')});stage.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.15:.87)},{passive:false});
$('#zoomIn').onclick=()=>zoom(1.25);$('#zoomOut').onclick=()=>zoom(.8);$('#reset').onclick=()=>{cancelAnimationFrame(panFrame);scale=1;x=y=0;transform()};$('#fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():$('#mapShell').requestFullscreen();$('#closeCard').onclick=()=>card.classList.remove('open');$('#flyoverBtn').onclick=startCinematic;

function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
async function startCinematic(){
  stopCinematic();const token=++flightToken,path=$('#path-'+active),ball=$('#golfBall'),shadow=$('#ballShadow'),counter=$('#ballDistance'),pulse=$('#targetPulse');
  card.classList.remove('open');$('#mapShell').classList.add('cinematic');const focused=await focusCinematicPath(active);if(!focused||token!==flightToken)return;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  document.querySelectorAll('.shot-path').forEach(p=>p.classList.remove('play'));path.classList.add('play');ball.classList.add('active');shadow.classList.add('active');counter.classList.add('active');await fly(path,ball,shadow,counter,pulse,token);if(token!==flightToken)return;
  pulse.classList.add('active');await new Promise(r=>setTimeout(r,1300));if(token!==flightToken)return;$('#mapShell').classList.remove('cinematic');shadow.classList.remove('active');pulse.classList.remove('active');counter.classList.add('active','complete');hideTip();
  /* Reopen the detail card after playback on desktop only. On touch-sized
     mobile screens the finished cinematic view remains clean and unobstructed. */
  if(!window.matchMedia('(max-width: 700px)').matches){placeCardAtHole(active,activeAnchor);card.classList.add('open')}else{card.classList.remove('open')}
}
function fly(path,ball,shadow,counter,pulse,token){const len=path.getTotalLength(),duration=5200,start=performance.now(),totalYards=Number(holes[active][selectedTee]||holes[active].yards),counterText=counter.querySelector('text'),phone=window.matchMedia('(max-width: 600px)').matches;return new Promise(resolve=>{function frame(now){if(token!==flightToken)return resolve();let t=Math.min(1,(now-start)/duration),progress=ease(t),distance=len*progress,p=path.getPointAtLength(distance),phase=t<.56?t/.56:(t-.56)/.44,arc=Math.sin(phase*Math.PI)*(t<.56?42:27),ballScale=(1+arc/120)*(phone?1.28:1),counterOffset=phone?46:38;ball.setAttribute('transform',`translate(${p.x} ${p.y-arc}) scale(${ballScale})`);shadow.setAttribute('cx',p.x);shadow.setAttribute('cy',p.y+8);shadow.setAttribute('rx',13+arc/6);shadow.style.opacity=.34-arc/180;counter.setAttribute('transform',`translate(${p.x} ${p.y-arc-counterOffset}) scale(${phone?1.15:1})`);counterText.textContent=`${Math.round(totalYards*progress)} yd`;if(t<1)flightFrame=requestAnimationFrame(frame);else{counterText.textContent=`${totalYards} yd`;pulse.setAttribute('cx',p.x);pulse.setAttribute('cy',p.y);resolve()}}flightFrame=requestAnimationFrame(frame)})}
function stopCinematic(){cancelAnimationFrame(flightFrame);flightToken++;$('#mapShell').classList.remove('cinematic');hideTip();['#golfBall','#ballShadow','#ballDistance','#targetPulse'].forEach(s=>{const e=$(s);if(e)e.classList.remove('active','complete')})}
let resizeTimer=0;
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>applyResponsiveMapFit(false),120)});
