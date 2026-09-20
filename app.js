const $=s=>document.querySelector(s);
const records=window.STUDIO_ARCHIVE;
const world=$('#world'),viewport=$('#viewport'),dialog=$('#detail');
let active=0,tx=0,ty=0,targetX=0,targetY=0,list=false,moved=false,lastFocus,raf=0,layout=[],category='全部',lastFrame=0;
const mobile=()=>matchMedia('(max-width:760px), (pointer:coarse)').matches;
const reading=()=>list;
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
records.forEach((r,i)=>{
 const b=document.createElement('button');b.className='tile';b.dataset.theme=r.type;
 b.innerHTML=`<img src="assets/${r.img}" alt="${r.title}" draggable="false"><span class="tile-category">${r.type}</span><span class="tile-caption">${r.title}<small>↗</small></span><span class="tile-summary">${r.summary}</span>`;
 b.onclick=()=>r.join?showJoin():showRecord(i);world.appendChild(b);
});
const tiles=[...world.children];
function selected(){return records.map((r,i)=>i).filter(i=>category==='全部'||records[i].type===category)}
function stop(){cancelAnimationFrame(raf);raf=0}
function limits(){return{x:Math.max(0,world.offsetWidth-viewport.clientWidth),y:Math.max(0,world.offsetHeight-viewport.clientHeight)}}
// Deliberately staggered artboard; rectangles include the captions and never overlap.
const placements=[
 [910,600,520,430], [170,170,350,420], [1610,260,450,350],
 [180,820,420,340], [1630,970,440,350], [890,1270,440,350],
 [820,100,420,320], [170,1390,450,350], [1770,1460,290,470]
];
function layoutWorld(){
 const ids=selected(),unit=mobile()?Math.max(.38,Math.min(.65,viewport.clientWidth/800)):Math.max(.7,viewport.clientWidth/1440);
 layout=[];tiles.forEach((t,i)=>{t.hidden=!ids.includes(i)});
 ids.forEach((i,n)=>{
  const [x,y,w,h]=category==='全部'?placements[i]:[[160,170,460,390],[810,440,480,410],[1460,120,420,400]][n];
  layout[i]={x:x*unit,y:y*unit,w:w*unit,h:h*unit};
  const r=layout[i];Object.assign(tiles[i].style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});
 });
 world.style.width=`${(category==='全部'?2260:2040)*unit}px`;
 world.style.height=`${Math.max(viewport.clientHeight,(category==='全部'?2040:1000)*unit)}px`;
}

function paint(){
 world.style.transform=`translate3d(${tx}px,${ty}px,0)`;
 layout.forEach((r,i)=>{const v=tx+r.x+r.w>0&&tx+r.x<viewport.clientWidth&&ty+r.y+r.h>0&&ty+r.y<viewport.clientHeight;tiles[i].classList.toggle('is-visible',v)});
}
function animate(time){const dt=lastFrame?Math.min(50,time-lastFrame):16.67;lastFrame=time;const k=reduced()?1:1-Math.exp(-dt/360);tx+=(targetX-tx)*k;ty+=(targetY-ty)*k;paint();if(Math.abs(targetX-tx)+Math.abs(targetY-ty)>.2)raf=requestAnimationFrame(animate);else{tx=targetX;ty=targetY;paint();raf=0}}
function move(x,y,smooth=true){const l=limits();targetX=Math.min(0,Math.max(-l.x,x));targetY=Math.min(0,Math.max(-l.y,y));if(smooth){if(!raf){lastFrame=0;raf=requestAnimationFrame(animate)}}else{stop();tx=targetX;ty=targetY;paint()}}
function reset(){stop();layoutWorld();if(!reading()){const r=layout[selected()[0]];move(viewport.clientWidth/2-r.x-r.w/2,viewport.clientHeight/2-r.y-r.h/2,false)}}
function sync(){
 $('#explore').classList.toggle('reading',reading());document.body.classList.toggle('canvas-mode',!$('#explore').hidden&&!reading());
 $('#view-toggle').textContent=list?'自由探索':'目录浏览';$('#view-toggle').setAttribute('aria-pressed',String(list));
 $('#canvas-hint').textContent=reading()?'选择主题，阅读完整内容':(mobile()?'拖动探索 · 点击主题阅读':'移动鼠标探索 · 点击主题阅读');
 $('#theme-count').textContent=`${selected().length} 个主题`;$('#reset').hidden=reading();reset();
}
function explore(){$('#home').hidden=true;$('#explore').hidden=false;document.body.classList.add('exploring');sync();history.replaceState(null,'','#explore')}
function home(){stop();$('#home').hidden=false;$('#explore').hidden=true;document.body.classList.remove('exploring','canvas-mode');history.replaceState(null,'',location.pathname);window.scrollTo(0,0)}
$('.brand').onclick=e=>{e.preventDefault();home()};
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>({explore,about:showAbout,join:showJoin})[b.dataset.action]());
document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));sync()});
viewport.addEventListener('pointermove',e=>{if(reading()||dialog.open||e.pointerType!=='mouse')return;const r=viewport.getBoundingClientRect(),l=limits();const px=Math.max(0,Math.min(1,(e.clientX-r.left-r.width*.04)/(r.width*.92))),py=Math.max(0,Math.min(1,(e.clientY-r.top-r.height*.04)/(r.height*.92)));move(-px*l.x,-py*l.y)});
// Touch pans the same artboard; a drag must never open a story accidentally.
let gesture=null,suppressClickUntil=0;
viewport.addEventListener('pointerdown',e=>{
 if(reading()||dialog.open||e.pointerType==='mouse')return;
 stop();targetX=tx;targetY=ty;
 gesture={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,time:performance.now(),vx:0,vy:0,drag:false};
});
viewport.addEventListener('pointermove',e=>{
 if(!gesture||e.pointerId!==gesture.id)return;
 const g=gesture,now=performance.now(),dt=Math.max(8,now-g.time);
 if(!g.drag&&Math.hypot(e.clientX-g.x,e.clientY-g.y)>7){g.drag=true;viewport.setPointerCapture(e.pointerId)}
 if(g.drag){e.preventDefault();g.vx=(e.clientX-g.lastX)/dt;g.vy=(e.clientY-g.lastY)/dt;move(tx+e.clientX-g.lastX,ty+e.clientY-g.lastY,false)}
 g.lastX=e.clientX;g.lastY=e.clientY;g.time=now;
});
function finishGesture(e){
 if(!gesture||e.pointerId!==gesture.id)return;
 const g=gesture;gesture=null;
 if(g.drag){suppressClickUntil=performance.now()+400;if(e.type!=='pointercancel'&&performance.now()-g.time<100)move(tx+Math.max(-160,Math.min(160,g.vx*140)),ty+Math.max(-160,Math.min(160,g.vy*140)))}
 if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);
}
viewport.addEventListener('pointerup',finishGesture);viewport.addEventListener('pointercancel',finishGesture);
viewport.addEventListener('click',e=>{if(performance.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
const menuButton=document.createElement('button');menuButton.className='menu-toggle';menuButton.textContent='菜单';menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-controls','main-nav');
$('nav').id='main-nav';$('header').appendChild(menuButton);
function closeMenu(){document.body.classList.remove('menu-open');menuButton.setAttribute('aria-expanded','false');menuButton.textContent='菜单'}
menuButton.onclick=()=>{const opened=document.body.classList.toggle('menu-open');menuButton.setAttribute('aria-expanded',String(opened));menuButton.textContent=opened?'关闭':'菜单'};
$('nav').addEventListener('click',closeMenu);$('.brand').addEventListener('click',closeMenu);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
viewport.addEventListener('keydown',e=>{if(reading())return;const d={ArrowLeft:[100,0],ArrowRight:[-100,0],ArrowUp:[0,100],ArrowDown:[0,-100]}[e.key];if(d){e.preventDefault();move(tx+d[0],ty+d[1])}});
world.addEventListener('focusin',e=>{if(reading()||!e.target.matches(':focus-visible'))return;const r=layout[tiles.indexOf(e.target)];if(r)move(viewport.clientWidth/2-r.x-r.w/2,viewport.clientHeight/2-r.y-r.h/2,false)});
$('#reset').onclick=reset;$('#view-toggle').onclick=()=>{list=!list;sync()};
window.addEventListener('resize',()=>{if(!$('#explore').hidden)sync()});
if(location.hash==='#explore')explore();
function open(content){stop();if(!dialog.open)lastFocus=document.activeElement;$('#detail-content').innerHTML=content;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;$('.close').focus()}
function close(){dialog.close();lastFocus?.focus({preventScroll:true})}$('.close').onclick=close;dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});
function showRecord(i){
 active=i;const r=records[i];
 open(`<article class="detail-inner"><p class="eyebrow">${r.type} / 简维档案</p><h2 id="detail-title">${r.title}</h2><p class="detail-text">${r.text}</p>${r.note?`<p class="detail-note">${r.note}</p>`:''}
 ${r.sections.map((s,n)=>`<section class="story-section"><div class="story-copy"><span class="section-number">0${n+1}</span><h3>${s.title}</h3><p>${s.text}</p></div><figure class="story-media" data-section="${n}"><img src="assets/${s.images[0].file}" alt="${s.images[0].caption}"><figcaption><span class="image-caption">${s.images[0].caption}</span><div class="gallery-controls" ${s.images.length<2?'hidden':''}><button class="gallery-prev" aria-label="上一张图片">←</button><span class="image-index" aria-live="polite">1 / ${s.images.length}</span><button class="gallery-next" aria-label="下一张图片">→</button></div></figcaption></figure></section>`).join('')}
 <p class="detail-meta">资料来源：简维工作室 2026 秋季宣传 PPT</p><div class="detail-bottom"><button id="back-explore">返回主题</button><button id="next-record">下一个主题 ↗</button></div></article>`);
 document.querySelectorAll('.story-media').forEach(figure=>{
  const photos=r.sections[Number(figure.dataset.section)].images;let pos=0;
  function change(step){pos=(pos+step+photos.length)%photos.length;const p=photos[pos];figure.querySelector('img').src='assets/'+p.file;figure.querySelector('img').alt=p.caption;figure.querySelector('.image-caption').textContent=p.caption;figure.querySelector('.image-index').textContent=(pos+1)+' / '+photos.length}
  figure.querySelector('.gallery-prev').onclick=()=>change(-1);figure.querySelector('.gallery-next').onclick=()=>change(1);
 });
 $('#back-explore').onclick=close;
 $('#next-record').onclick=()=>{const n=(active+1)%records.length;records[n].join?showJoin():showRecord(n)};
}
function showAbout(){open(`<article class="detail-inner"><p class="eyebrow">ABOUT JIANWEI</p><h2 id="detail-title">为共同的好奇，<br>留一个位置。</h2><p class="detail-text">简维工作室是广东白云学院的校内建筑设计工作室。我们围绕建筑设计、模型制作与数字技术展开学习和创作，通过竞赛、交流与实践，让设计离生活更近一步。</p><p class="detail-text">在这里，有经验的伙伴带着新成员一起学习。一个想法，可以从手绘开始，在模型里推敲，再在讨论中找到新的方向。</p><div class="about-grid"><section><h3>我们在做什么</h3><p>建筑设计与竞赛探索<br>实体模型与空间构成<br>BIM、AIGC 与数字表达<br>师生交流与同伴学习</p></section><section><h3>找到我们</h3><p>广东白云学院<br>三立园负一层 · U创长廊<br>挂靠公司：星舟建筑设计（广州）有限公司</p></section></div><div class="detail-gallery"><img src="assets/s04-2.jpg" alt="简维工作室伙伴合影"></div><div class="detail-bottom"><span>保持好奇，共同生长。</span><button id="about-join">加入简维 ↗</button></div></article>`);$('#about-join').onclick=showJoin}
function showJoin(){const expired=Date.now()>=Date.parse('2026-09-22T00:00:00+08:00');open(`<article class="detail-inner"><p class="eyebrow">2026 AUTUMN RECRUITMENT</p><h2 id="detail-title">下一段探索，<br>与你一起。</h2><p class="detail-text">欢迎建筑、规划、风景园林、土木等相关专业的大一、大二同学。带着学习热情与合作精神，在简维一起尝试、交流和成长。</p><section class="growth-plan"><h3>在简维，逐步找到自己的方向</h3><p>根据工作室成长计划，参与内容随学习阶段和个人准备情况安排。</p><ol><li><strong>大一 · 基础与尝试</strong><span>从手绘、立体构成和初识建筑等练习开始，了解创新创业类竞赛。</span></li><li><strong>大二 · 研究与协作</strong><span>参与大创、挑战杯、节能减排等方向的学习与合作，准备建筑与 BIM 设计竞赛。</span></li><li><strong>大三 · 设计与深化</strong><span>围绕建筑设计和 BIM 等方向继续深化，选择适合自己的项目与竞赛。</span></li></ol></section><div class="join-date">10.08 — 10.09</div><p class="detail-text">面试地点：致用楼 101<br>日常工作室：三立园负一层 U创长廊</p><p class="detail-meta">加入招新群，留意群内安排并参加面试。面试具体时段以群内通知为准。</p><div class="qr-grid"><section><h3>招新微信群</h3>${expired?'<p class="expired">本期群二维码已到期，请联系负责人获取最新入群方式。</p>':'<div class="qr-frame group"><img src="assets/recruitment-qr.png" alt="26 简维工作室秋季招新群二维码"></div><p>群二维码有效至 2026 年 9 月 22 日前。<br>若无法加入，请联系负责人。</p><a class="qr-full" href="assets/recruitment-qr.png" target="_blank" rel="noopener">查看 / 保存完整二维码 ↗</a>'}</section><section><h3>负责人微信</h3><div class="qr-frame manager"><img src="assets/manager-qr.png" alt="负责人微信高清二维码"></div><p>咨询工作室、面试与入群事宜。</p><a class="qr-full" href="assets/manager-qr.png" target="_blank" rel="noopener">查看 / 保存负责人高清二维码 ↗</a></section></div><div class="about-grid"><section><h3>一起学习</h3><p>共享学习空间，参与设计交流，<br>在模型制作与数字工具练习中积累经验。</p></section><section><h3>一起成长</h3><p>参与适合自己的竞赛与实践，<br>与工作室伙伴分享经验、相互支持。</p></section></div></article>`)}

