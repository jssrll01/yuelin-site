document.documentElement.classList.add('js');
(function(){
  /* ====== SETTINGS ====== */
  var MAX_POINTS = 10000;
  var POINTS_PER_PESO = 100;
  var START_POINTS = 2500;
  /* ====================== */

  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(id){return document.getElementById(id)};
  var fmt=function(n){return Math.round(n).toLocaleString('en-US')};

  var nav=$('nav');
  function onScroll(){nav.classList.toggle('solid',window.scrollY>40)}
  onScroll();addEventListener('scroll',onScroll,{passive:true});

  document.querySelectorAll('.lux-card').forEach(function(c){
    c.addEventListener('pointermove',function(e){
      var r=c.getBoundingClientRect();
      c.style.setProperty('--mx',(e.clientX-r.left)+'px');
      c.style.setProperty('--my',(e.clientY-r.top)+'px');
    });
  });

  var cv=$('sparks'),ctx=cv.getContext('2d'),P=[],W,H,raf;
  function size(){var d=Math.min(devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0)}
  function mk(){return{x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.8+.5,vy:-(Math.random()*.25+.06),vx:(Math.random()-.5)*.12,a:Math.random()*.45+.2,t:Math.random()*6}}
  function init(){size();var n=Math.round(Math.min(70,W/14));P=[];for(var i=0;i<n;i++)P.push(mk())}
  function draw(){
    ctx.clearRect(0,0,W,H);
    P.forEach(function(p){
      p.x+=p.vx;p.y+=p.vy;p.t+=.02;
      if(p.y<-5){p.y=H+5;p.x=Math.random()*W}
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);
      ctx.fillStyle='rgba(184,146,74,'+(p.a*(.6+.4*Math.sin(p.t)))+')';ctx.fill();
    });
    raf=requestAnimationFrame(draw);
  }
  init();
  if(reduce){draw();cancelAnimationFrame(raf)}else draw();
  addEventListener('resize',init);
  document.addEventListener('visibilitychange',function(){
    if(document.hidden)cancelAnimationFrame(raf);else if(!reduce)draw();
  });

  var slider=$('slider'),ptsVal=$('ptsVal'),pesoVal=$('pesoVal'),prog=$('prog'),pct=$('pct');
  var presets=document.querySelectorAll('.preset'),rows=document.querySelectorAll('.row');
  var R=96,C=2*Math.PI*R,shown=0,target=START_POINTS,tween=null;
  prog.style.strokeDasharray=C;
  slider.max=MAX_POINTS;

  function render(v){
    var share=Math.max(0,Math.min(1,v/MAX_POINTS));
    ptsVal.textContent=fmt(v);
    var peso=v/POINTS_PER_PESO;
    pesoVal.textContent='₱'+(peso%1?peso.toFixed(2):fmt(peso));
    prog.style.strokeDashoffset=C*(1-share);
    pct.textContent=Math.round(share*100)+'% of max';
    slider.style.setProperty('--p',(share*100)+'%');
  }
  function mark(v){
    presets.forEach(function(b){b.classList.toggle('on',+b.dataset.v===v)});
    var cur=null;
    rows.forEach(function(r){
      var rv=+r.dataset.v;
      r.classList.toggle('reached',v>=rv);
      r.classList.remove('current');
      if(v>=rv)cur=r;
    });
    if(cur&&+cur.dataset.v===v)cur.classList.add('current');
    $('pesoLive').textContent='₱'+fmt(v/POINTS_PER_PESO)+' equivalent reward value';
  }
  function go(v,instant){
    v=Math.max(0,Math.min(MAX_POINTS,v));target=v;slider.value=v;mark(v);
    if(tween)cancelAnimationFrame(tween);
    if(reduce||instant){shown=v;render(v);return}
    var from=shown,t0=null,dur=Math.min(1400,500+Math.abs(v-from)/MAX_POINTS*1100);
    prog.style.transition='none';
    (function step(t){
      if(!t0)t0=t;var k=Math.min((t-t0)/dur,1),e=1-Math.pow(1-k,3);
      shown=from+(v-from)*e;render(shown);
      if(k<1)tween=requestAnimationFrame(step);else{shown=v;render(v)}
    })(performance.now());
  }
  slider.addEventListener('input',function(){
    if(tween)cancelAnimationFrame(tween);
    var v=+slider.value;shown=v;target=v;render(v);mark(v);
  });
  presets.forEach(function(b){b.addEventListener('click',function(){go(+b.dataset.v)})});
  rows.forEach(function(r){r.addEventListener('click',function(){go(+r.dataset.v)})});
  render(0);mark(0);

  var typed=$('typed'),res=$('res'),rbtn=$('rbtn'),demoRun=false;
  function demo(){
    if(demoRun)return;demoRun=true;
    var code='YL-7K4M-92QX-A5',i=0;
    if(reduce){typed.textContent=code;res.classList.add('on');return}
    (function type(){
      typed.textContent=code.slice(0,++i);
      if(i<code.length)setTimeout(type,90);
      else setTimeout(function(){rbtn.classList.add('press');setTimeout(function(){rbtn.classList.remove('press');res.classList.add('on')},220)},500);
    })();
  }

  var walletStarted=false;
  function startWallet(){if(walletStarted)return;walletStarted=true;go(START_POINTS)}
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      var t=e.target;t.classList.add('in');
      if(t.id==='demo')demo();
      if(t.id==='wallet')startWallet();
      io.unobserve(t);
    });
  },{threshold:.14,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.rv,#demo,#wallet').forEach(function(el){io.observe(el)});
  if(!('IntersectionObserver' in window)){
    document.querySelectorAll('.rv').forEach(function(el){el.classList.add('in')});
    startWallet();demo();
  }

  var car=$('car'),down=false,sx,sl;
  car.addEventListener('mousedown',function(e){down=true;sx=e.pageX;sl=car.scrollLeft;car.style.scrollSnapType='none'});
  addEventListener('mouseup',function(){down=false;car.style.scrollSnapType=''});
  car.addEventListener('mousemove',function(e){if(!down)return;e.preventDefault();car.scrollLeft=sl-(e.pageX-sx)});
})();
