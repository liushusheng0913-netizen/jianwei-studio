const $=s=>document.querySelector(s);
const records=[
{title:'把想法，做成空间',type:'实体模型 / 设计练习',img:'s42-2.jpg',gallery:['s42-2.jpg','s34-3.jpg'],text:'从图纸走向可触摸的空间。通过实体模型，观察体量、尺度与场地之间的关系，让想法在制作中逐渐清晰。',x:1300,y:420,w:370,h:290},
{title:'从一张白纸开始',type:'空间构成 / 模型实验',img:'s35-2.jpg',gallery:['s35-2.jpg','s35-5.jpg'],text:'用纸板、线材与简单的构件，练习空间的组织。立体构成中的每一次搭接，都是对结构、秩序与光影的一次提问。',x:1750,y:100,w:250,h:300},
{title:'一起，把问题展开',type:'工作室日常 / 指导交流',img:'s17-3.jpg',gallery:['s17-3.jpg','s16-1.jpg'],text:'把设计带到桌面上，也把问题带到彼此面前。简维通过师生指导、同伴讨论与经验分享，让设计在交流中继续向前。',x:550,y:800,w:330,h:275},
{title:'线条里的建筑',type:'手绘 / 观察与表达',img:'s23-1.jpg',gallery:['s23-1.jpg','s41-3.jpg'],text:'从观察到落笔，用线条理解建筑。手绘记录空间的细节，也训练我们辨认比例、层次与光影的能力。',x:220,y:180,w:270,h:300},
{title:'数字工具，新的可能',type:'AIGC / 设计探索',img:'s43-2.jpg',gallery:['s43-2.jpg','s43-5.jpg','s18-2.jpg'],text:'把数字工具引入设计练习，探索不同的空间表达。工作室开展 AIGC 学习与交流，尝试将图像生成用于构思、比较和方案推敲。',note:'图像为设计探索与效果表达，非建成项目实景。',x:2450,y:500,w:330,h:295},
{title:'不止于工作桌',type:'伙伴 / 工作室生活',img:'s21-5.jpg',gallery:['s21-5.jpg','s04-2.jpg'],text:'设计之外，也有一起吃饭、聊天和分享生活的时间。工作室的日常，由每一位伙伴共同组成。',x:1350,y:1120,w:335,h:270},
{title:'工业智慧窗',type:'创新创业竞赛 / 产品设计',img:'s27-3.jpg',gallery:['s27-3.jpg'],text:'基于环境监测与 PLC 自动化控制的工业智慧窗。围绕环境感知与自动控制展开产品设计，探索建筑部件与数字技术结合的可能。',note:'创新创业竞赛方案。',x:100,y:1250,w:310,h:260},
{title:'乡艺融创居',type:'乡村研究 / 竞赛方案',img:'s31-1.jpg',gallery:['s31-1.jpg'],text:'以装配式技术助力粤西农村住宅乡颜改造，围绕地方居住环境开展研究与设计探索。',note:'创新创业竞赛方案，非建成作品。',x:2050,y:1200,w:340,h:260},
{title:'在制作中理解',type:'设备与实践 / 数字制作',img:'s15-1.jpg',gallery:['s15-1.jpg','s15-2.jpg'],text:'让数字世界与实体制作相遇。工作室的设备与实践资源，为模型制作、空间观察和技术学习提供支持。',x:100,y:540,w:240,h:270},
{title:'图纸中的耐心',type:'实践参与 / CAD 与天正',img:'s33-1.jpg',gallery:['s33-1.jpg'],text:'宣传资料收录了广铁老旧小区改造项目施工图相关工作。在图纸实践中，学习规范表达，理解设计信息如何准确传递。',note:'展示图纸相关工作，不代表工作室独立完成或建成该项目。',x:2750,y:130,w:300,h:260},
{title:'一处共同生长的地方',type:'学习空间 / 简维日常',img:'s14-1.jpg',gallery:['s14-1.jpg','s04-2.jpg'],text:'一张工作桌，也是一处相互学习的起点。简维工作室主要位于广东白云学院三立园负一层 U创长廊，欢迎对建筑与设计保持好奇的伙伴。',x:600,y:1500,w:300,h:255},
{title:'2026，与简维相遇',type:'秋季招新 / 加入我们',img:'recruitment-poster.jpg',join:true,x:1900,y:700,w:210,h:330}
];
const world=$('#world'),viewport=$('#viewport'),dialog=$('#detail');
let active=0,tx=0,ty=0,targetX=0,targetY=0,list=false,down=null,moved=false,lastFocus,raf=0,layout=[];
const mobile=()=>matchMedia('(max-width:760px)').matches;
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
records.forEach((r,i)=>{
 const b=document.createElement('button');b.className='tile';
 b.innerHTML=`<img src="assets/${r.img}" alt="${r.title}" draggable="false"><span class="tile-caption">${r.title}<small>${String(i+1).padStart(2,'0')}</small></span><span class="tile-type">${r.type}</span>`;
 b.onclick=()=>{if(!moved)r.join?showJoin():showRecord(i)};
 world.appendChild(b);
});
const tiles=[...world.querySelectorAll('.tile')];
function layoutWorld(){
 const phone=mobile(),unit=phone?viewport.clientWidth/630:viewport.clientWidth/1440;
 // Art-directed positions: varied sizes and diagonals instead of rows.
 const composition=[
  [1420,1110,460,385],[2150,710,310,430],[490,1130,440,355],
  [220,350,340,365],[2690,1430,330,450],[1180,1970,470,365],
  [270,2290,380,320],[2580,2320,410,325],[810,240,330,380],
  [2480,170,430,325],[200,1730,395,330],[1910,1910,290,490]
 ];
 layout=composition.map(([x,y,w,h])=>({x:x*unit,y:y*unit,w:w*unit,h:h*unit}));
 world.style.width=`${3300*unit}px`;world.style.height=`${2850*unit}px`;
 tiles.forEach((t,i)=>{const r=layout[i];Object.assign(t.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'})});
}
function limits(){return {x:Math.max(0,world.offsetWidth-viewport.clientWidth),y:Math.max(0,world.offsetHeight-viewport.clientHeight)}}
function paint(){
 world.style.transform=`translate3d(${tx}px,${ty}px,0)`;
 layout.forEach((r,i)=>{const visibleWidth=Math.max(0,Math.min(tx+r.x+r.w,viewport.clientWidth)-Math.max(tx+r.x,0)),visibleHeight=Math.max(0,Math.min(ty+r.y+r.h,viewport.clientHeight)-Math.max(ty+r.y,0));tiles[i].classList.toggle('is-visible',visibleWidth*visibleHeight>r.w*r.h*.08)});
}
function stop(){cancelAnimationFrame(raf);raf=0}
let lastFrame=0;
function animate(time){
 const dt=lastFrame?Math.min(50,time-lastFrame):16.67;lastFrame=time;
 const k=reduced()?1:1-Math.exp(-dt/310);tx+=(targetX-tx)*k;ty+=(targetY-ty)*k;paint();
 if(Math.abs(targetX-tx)+Math.abs(targetY-ty)>.2)raf=requestAnimationFrame(animate);else{tx=targetX;ty=targetY;paint();raf=0}
}
function move(x,y,smooth=true){const l=limits();targetX=Math.min(0,Math.max(-l.x,x));targetY=Math.min(0,Math.max(-l.y,y));if(smooth){if(!raf){lastFrame=0;raf=requestAnimationFrame(animate)}}else{stop();tx=targetX;ty=targetY;paint()}}
function reset(){stop();layoutWorld();const r=layout[0];move(viewport.clientWidth/2-r.x-r.w/2,viewport.clientHeight/2-r.y-r.h/2,false)}
function hint(){$('#canvas-hint').textContent=list?'点击图片，查看详情':mobile()?'滑动探索 · 轻点查看':'移动鼠标，发现更多';$('#view-toggle').textContent=list?'画布视图':'目录视图';$('#view-toggle').setAttribute('aria-pressed',String(list));$('#reset').hidden=list}
function explore(){$('#home').hidden=true;$('#explore').hidden=false;document.body.classList.add('exploring');$('#explore').classList.add('is-visible');reset();hint();history.replaceState(null,'','#explore')}
function home(){stop();$('#home').hidden=false;$('#explore').hidden=true;document.body.classList.remove('exploring');history.replaceState(null,'',location.pathname);window.scrollTo(0,0)}
$('.brand').onclick=e=>{e.preventDefault();home()};
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>({explore,about:showAbout,join:showJoin})[b.dataset.action]());
viewport.addEventListener('pointerdown',e=>{if(list||e.pointerType==='mouse')return;stop();moved=false;down={x:e.clientX,y:e.clientY,tx,ty};});
viewport.addEventListener('pointermove',e=>{
 if(list||dialog.open)return;
 if(e.pointerType!=='mouse'){
  if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;
  if(Math.hypot(dx,dy)>8){moved=true;viewport.setPointerCapture(e.pointerId)}
  if(moved)move(down.tx+dx,down.ty+dy,false);
 }else if(!mobile()){
  const r=viewport.getBoundingClientRect(),l=limits();
  move(-(e.clientX-r.left)/r.width*l.x,-(e.clientY-r.top)/r.height*l.y);
 }
});
function release(){down=null;setTimeout(()=>moved=false,120)}
viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);
viewport.addEventListener('keydown',e=>{if(list)return;const d={ArrowLeft:[100,0],ArrowRight:[-100,0],ArrowUp:[0,100],ArrowDown:[0,-100]}[e.key];if(d){e.preventDefault();move(tx+d[0],ty+d[1])}});
world.addEventListener('focusin',e=>{if(list||!e.target.matches(':focus-visible'))return;const r=layout[tiles.indexOf(e.target)];if(r)move(viewport.clientWidth/2-r.x-r.w/2,viewport.clientHeight/2-r.y-r.h/2,false)});
$('#reset').onclick=reset;
$('#view-toggle').onclick=()=>{stop();list=!list;$('#explore').classList.toggle('list',list);hint();if(!list)reset()};
window.addEventListener('resize',()=>{if(!$('#explore').hidden){if(!list)reset();hint()}});
if(location.hash==='#explore')explore();
function open(content){if(!dialog.open)lastFocus=document.activeElement;$('#detail-content').innerHTML=content;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;$('.close').focus()}
function close(){dialog.close();lastFocus?.focus({preventScroll:true})}$('.close').onclick=close;dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});
function showRecord(i){active=i;const r=records[i];open(`<article class="detail-inner"><p class="eyebrow">JIANWEI ARCHIVE / ${String(i+1).padStart(2,'0')}</p><h2 id="detail-title">${r.title}</h2><p class="detail-meta">${r.type}</p><p class="detail-text">${r.text}</p>${r.note?`<p class="detail-meta">${r.note}</p>`:''}<div class="detail-gallery">${r.gallery.map(im=>`<img src="assets/${im}" alt="${r.title} · 资料图" loading="lazy">`).join('')}</div><p class="detail-meta">图片来源：简维工作室 2026 秋季宣传资料</p><div class="detail-bottom"><button onclick="document.querySelector('.close').click()">返回探索</button><button id="next-record">下一个故事 ↗</button></div></article>`);$('#next-record').onclick=()=>{let n=(active+1)%records.length;records[n].join?showJoin():showRecord(n)}}
function showAbout(){open(`<article class="detail-inner"><p class="eyebrow">ABOUT JIANWEI</p><h2 id="detail-title">为共同的好奇，<br>留一个位置。</h2><p class="detail-text">简维工作室是广东白云学院的校内建筑设计工作室。我们围绕建筑设计、模型制作与数字技术展开学习和创作，通过竞赛、交流与实践，让设计离生活更近一步。</p><p class="detail-text">在这里，有经验的伙伴带着新成员一起学习。一个想法，可以从手绘开始，在模型里推敲，再在讨论中找到新的方向。</p><div class="about-grid"><section><h3>我们在做什么</h3><p>建筑设计与竞赛探索<br>实体模型与空间构成<br>BIM、AIGC 与数字表达<br>师生交流与同伴学习</p></section><section><h3>找到我们</h3><p>广东白云学院<br>三立园负一层 · U创长廊<br>挂靠公司：星舟建筑设计（广州）有限公司</p></section></div><div class="detail-gallery"><img src="assets/s04-2.jpg" alt="简维工作室伙伴合影"></div><div class="detail-bottom"><span>保持好奇，共同生长。</span><button id="about-join">加入简维 ↗</button></div></article>`);$('#about-join').onclick=showJoin}
function showJoin(){const expired=Date.now()>=Date.parse('2026-09-22T00:00:00+08:00');open(`<article class="detail-inner"><p class="eyebrow">2026 AUTUMN RECRUITMENT</p><h2 id="detail-title">下一段探索，<br>与你一起。</h2><p class="detail-text">欢迎建筑、规划、风景园林、土木等相关专业的大一、大二同学。带着学习热情与合作精神，在简维一起尝试、交流和成长。</p><div class="join-date">10.08 — 10.09</div><p class="detail-text">面试地点：致用楼 101<br>日常工作室：三立园负一层 U创长廊</p><p class="detail-meta">加入招新群，留意群内安排并参加面试。面试具体时段以群内通知为准。</p><div class="qr-grid"><section><h3>招新微信群</h3>${expired?'<p class="expired">本期群二维码已到期，请联系负责人获取最新入群方式。</p>':'<div class="qr-frame group"><img src="assets/recruitment-qr.png" alt="26 简维工作室秋季招新群二维码"></div><p>群二维码有效至 2026 年 9 月 22 日前。<br>若无法加入，请联系负责人。</p><a class="qr-full" href="assets/recruitment-qr.png" target="_blank" rel="noopener">查看 / 保存完整二维码 ↗</a>'}</section><section><h3>负责人微信</h3><div class="qr-frame manager"><img src="assets/manager-qr.png" alt="负责人微信高清二维码"></div><p>咨询工作室、面试与入群事宜。</p><a class="qr-full" href="assets/manager-qr.png" target="_blank" rel="noopener">查看 / 保存负责人高清二维码 ↗</a></section></div><div class="about-grid"><section><h3>一起学习</h3><p>共享学习空间，参与设计交流，<br>在模型制作与数字工具练习中积累经验。</p></section><section><h3>一起成长</h3><p>参与适合自己的竞赛与实践，<br>与工作室伙伴分享经验、相互支持。</p></section></div></article>`)}

