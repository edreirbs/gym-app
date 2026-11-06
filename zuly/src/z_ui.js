
// ================== INTERFAZ ==================
const $=s=>document.querySelector(s);
const store={get(k,d){try{const v=localStorage.getItem("zuly2:"+k);return v===null?d:JSON.parse(v);}catch(e){return d;}},
             set(k,v){try{localStorage.setItem("zuly2:"+k,JSON.stringify(v));}catch(e){}}};
const pad2=n=>String(n).padStart(2,"0");
const iso=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const NOW0=new Date();
function mondayOf(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x;}
const WK_KEY=iso(mondayOf(NOW0));
const WK=(()=>{const t=iso(NOW0);for(const w of WEEKS) if(t>=w.from&&t<=w.to) return {w,st:"in"};
  return t<WEEKS[0].from?{w:WEEKS[0],st:"before"}:{w:WEEKS[3],st:"after"};})();
const MES=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const fmtR=w=>{const a=new Date(w.from+"T12:00"),b=new Date(w.to+"T12:00");return `${a.getDate()} al ${b.getDate()} ${MES[b.getMonth()]}`;};
const DELOAD=WK.w.n===4;
// Semana 4 (descarga): una serie menos en los ejercicios de riesgo bajo
const PLAN=DAYS.map(D=>Object.assign({},D,{blocks:D.blocks.map(b=>Object.assign({},b,{ex:b.ex.map(e=>Object.assign({},e,{sets:DELOAD&&e.risk==="bajo"?Math.max(1,e.sets-1):e.sets}))}))}));
const restTxt=s=>s>=60?`${Math.floor(s/60)}:${pad2(s%60)} min`:`${s} s`;
const tagOf=(D,bi,ei)=>`${bi+1}${D.blocks[bi].ex.length>1?"AB"[ei]:""}`;
const pre=(D,n)=>D.blocks[n.bi].ex.length>1?tagOf(D,n.bi,n.ei)+" ":"";
const TODAY_IDX=(NOW0.getDay()+6)%7;
let cur=0;
function dayColor(){const D=PLAN[cur]||PLAN[1];return TYPE[D.t].c[0];}
function applyDay(i){const r=document.documentElement.style;
  if(i>4){r.setProperty("--day","#3B3355");r.setProperty("--day-ink","#FFFFFF");r.setProperty("--day-text-l","#3B3355");r.setProperty("--day-text-d","#C9C2E6");return;}
  const T=TYPE[PLAN[i].t];r.setProperty("--day",T.c[0]);r.setProperty("--day-ink",T.c[1]);r.setProperty("--day-text-l",T.c[2]);r.setProperty("--day-text-d",T.cd);}

// orden real de las series: en superserie A1, B1, descanso, A2, B2...
function seqOf(D){const out=[];
  D.blocks.forEach((b,bi)=>{const R=Math.max(...b.ex.map(e=>e.sets));
    for(let r=0;r<R;r++){const round=b.ex.map((e,ei)=>({e,ei})).filter(o=>r<o.e.sets);
      round.forEach((o,j)=>{const last=j===round.length-1;out.push({id:`${bi}-${o.ei}-${r}`,bi,ei:o.ei,r,e:o.e,rest:last?b.rest:0});});}});
  if(out.length) out[out.length-1].rest=0; return out;}
let SEQ=[],DONE=new Set(),BL=[];
const sk=()=>WK_KEY+":"+cur;
const nextItem=()=>SEQ.find(s=>!DONE.has(s.id));

// ---------- tempo de la figura según el riesgo ----------
function tempoFor(key,e){
  if(key==="granjero") return {T:[.7,0,.7,0],kind:"walk"};
  if(key==="wallSit"||key==="nordic") return {T:[1.2,3,1.2,.6],kind:"iso"};
  if(key==="femoral") return {T:[3,1,3,.4],kind:"fem"};
  if(key==="hipThrust") return {T:[1,1,2,.4],kind:"ht"};
  if(key==="sidePlank") return {T:[1,1,1.5,.4],kind:"std"};
  if(key==="talon") return {T:[1,.6,2,.6],kind:"std"};
  return {T:[1,.5,e.risk==="alto"?3.5:e.risk==="medio"?3:2,.4],kind:"std"};
}
const FLIP=new Set(["goblet"]); // en la goblet k=1 es abajo
const easeIO=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
function phaseAt(it){
  const [c,h,e,b]=it.tp.T, T=c+h+e+b, x=it.t%T; let k,ph,vel;
  if(x<c){k=easeIO(x/c);ph=0;vel=1;} else if(x<c+h){k=1;ph=1;vel=0;}
  else if(x<c+h+e){k=1-easeIO((x-c-h)/e);ph=2;vel=-1;} else {k=0;ph=3;vel=0;}
  const glow=ph===0?k:(ph===1?1:(ph===2?k*.85:0));
  if(FLIP.has(it.key)){k=1-k;vel=-vel;}
  return {k,ph,vel,glow,progress:x/T};
}
function phTxt(it,P){const s=it.tp.T[2];
  switch(it.tp.kind){
    case "walk": return "Camina firme, hombros abajo";
    case "iso": return ["Colócate","Sostén "+(it.key==="wallSit"?"30 s":"10 a 15 s"),"Regresa","Pausa"][P.ph];
    case "fem": return ["Dobla en 3 s","Pausa 1 s","Regresa en 3 s","Pausa"][P.ph];
    case "ht": return ["Sube · 1 s","Aprieta 1 s","Baja lento · 2 s","Pausa"][P.ph];
    default: return ["Fuerza · 1 s","Aprieta","Regresa lento · "+s+" s","Pausa"][P.ph];}
}

// ---------- 3D ----------
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
let live=[], speed=store.get("spd",1), last=null;
const io=("IntersectionObserver" in window)?new IntersectionObserver(es=>{for(const e of es) if(e.target._it) e.target._it.visible=e.isIntersecting;},{rootMargin:"120px"}):null;
function paintIt(it,force){const P=phaseAt(it);
  if(it.ctx&&(it.visible||force)){try{render3(it,P);}catch(e){console.error(e);}}
  if(it.ph){const c=phTxt(it,P); if(it.ph.textContent!==c) it.ph.textContent=c; it.ph.dataset.ph=P.ph; it.bar.style.width=(P.progress*100).toFixed(1)+"%";}}
function frame(ts){if(last==null) last=ts; const dt=Math.min(.1,(ts-last)/1000); last=ts;
  for(const it of live){if(!it.paused) it.t+=dt*speed; paintIt(it);} requestAnimationFrame(frame);}
const touch=matchMedia("(pointer:coarse)").matches;
function animHTML(key,name){
  return `<div class="anim" data-key="${key}">
   <div class="stage3">${HAS3D?`<canvas width="560" height="560" aria-label="Figura 3D: ${name}. Desliza a los lados para girarla."></canvas>`:`<div class="ph3">${FAIL3D?"La figura 3D no cargó en este dispositivo. Usa <b>Ver videos</b> para ver la técnica.":"Cargando figura 3D…"}</div>`}</div>
   ${HAS3D?`<div class="ctl"><button type="button" class="mini" data-v="90">Frente</button><button type="button" class="mini" data-v="0">Lado</button><button type="button" class="mini" data-v="-90">Atrás</button><button type="button" class="mini" data-v="top">Arriba</button><button type="button" class="mini hudb" aria-pressed="true">Claves</button><button type="button" class="mini pp" aria-label="Pausar">❚❚</button></div>`:""}
   <div class="phase"><span class="phtxt">Fuerza · 1 s</span><span class="pbar"><i></i></span></div>
   <div class="mus">${(MUS[key]||[]).map(m=>`<span>${MUS_NAME[m]}</span>`).join("")}</div>
   ${HAS3D?`<div class="hud" aria-live="off"></div><span class="cap">${touch?"Desliza para girar · dos dedos: acercar · doble toque: vista inicial":"Arrastra para girar · rueda: acercar · doble clic: vista inicial"}</span>`:""}
  </div>`;}
function setup3D(){
  if(io) io.disconnect();
  live=[...document.querySelectorAll(".anim[data-key]")].map((box,j)=>{
    const key=box.dataset.key, card=box.closest(".ex"), D=PLAN[cur], e=D.blocks[+card.dataset.bi].ex[+card.dataset.ei];
    const it={key,t:j*.35,paused:reduce,tp:tempoFor(key,e),ph:box.querySelector(".phtxt"),bar:box.querySelector(".pbar i"),visible:!io};
    if(reduce) it.t=it.tp.T[0]+it.tp.T[1]/2;
    const cv=box.querySelector("canvas");
    if(cv){const px=Math.min(960,Math.max(480,Math.round((cv.clientWidth||330)*Math.min(window.devicePixelRatio||1,2.5))));cv.width=cv.height=px;
      it.hudEl=box.querySelector(".hud"); it.ctx=cv.getContext("2d");
      const bd=boundsFor(key), d0=bd.r/Math.sin(rad(16))*1.06; it.v=Object.assign({target:bd.c,dist:d0,d0},camDefault(key)); bindGestures(cv,it);
      const hb=box.querySelector(".hudb"); hb.onclick=()=>{it.hud=it.hud===false;hb.setAttribute("aria-pressed",String(it.hud!==false));};
      const pp=box.querySelector(".pp"), setPP=()=>{pp.textContent=it.paused?"▶":"❚❚";pp.setAttribute("aria-label",it.paused?"Reproducir":"Pausar");}; setPP(); pp.onclick=()=>{it.paused=!it.paused;setPP();};
      box.querySelectorAll("[data-v]").forEach(bt=>bt.onclick=()=>{const v=bt.dataset.v; if(v==="top") it.v.el=72; else {it.v.az=+v; it.v.el=10;}});
      if(io){io.observe(cv); cv._it=it;}}
    paintIt(it,true); return it;});
}
let FAIL3D=false;
window.enable3D=()=>{if(HAS3D) return;
  try{const c=document.createElement("canvas"); if(!(c.getContext("webgl2")||c.getContext("webgl"))){FAIL3D=true;render(cur);return;}}catch(e){FAIL3D=true;render(cur);return;}
  try{HAS3D=true; if(!G.r) init3();}catch(e){console.error(e);HAS3D=false;FAIL3D=true;}
  render(cur);};
setTimeout(()=>{if(!HAS3D){FAIL3D=true; document.querySelectorAll(".ph3").forEach(p=>p.innerHTML="La figura 3D no cargó en este dispositivo. Usa <b>Ver videos</b> para ver la técnica.");}},12000);

// ---------- sonido, vibración y pantalla encendida ----------
let AC=null, wl=null;
function unlockAudio(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==="suspended") AC.resume();}catch(e){}}
function tone(fs,dur){if(!store.get("snd",true)) return; try{unlockAudio(); const t0=AC.currentTime;
  fs.forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain(),t=t0+i*(dur+.06);o.type="sine";o.frequency.value=f;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.35,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+dur+.02);});}catch(e){}}
function buzz(p){try{navigator.vibrate&&navigator.vibrate(p);}catch(e){}}
async function keepAwake(){try{if(navigator.wakeLock&&!wl){wl=await navigator.wakeLock.request("screen");wl.addEventListener("release",()=>{wl=null;});}}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&cur<5&&store.get("t:"+sk(),null)&&nextItem()) keepAwake();});

// ---------- descanso ----------
let rest=null;
function startRest(sec){rest={end:Date.now()+sec*1000,sk:sk(),warned:false};}
function tickRest(){if(!rest) return; const left=(rest.end-Date.now())/1000;
  if(!rest.warned&&left<=10&&left>0){rest.warned=true;tone([660],.12);}
  if(left<=0){const mine=rest.sk===sk(); rest=null; tone([784,1046],.18); buzz([180,90,180]);
    if(mine){const bar=$("#nowbar");bar.classList.remove("pulse");void bar.offsetWidth;bar.classList.add("pulse");const n=nextItem();$("#nbLive").textContent=n?`Descanso terminado. Sigue ${n.e.n}, serie ${n.r+1}.`:"Descanso terminado.";}}
}

// ---------- acciones ----------
function save(){store.set("s:"+sk(),[...DONE]);}
function startSession(){if(!store.get("t:"+sk(),null)) store.set("t:"+sk(),Date.now()); unlockAudio(); keepAwake(); refresh();}
function markDone(id){if(DONE.has(id)) return; DONE.add(id); save(); unlockAudio();
  if(!store.get("t:"+sk(),null)) store.set("t:"+sk(),Date.now()-6*60000); // si no tocó Empezar, asume que ya calentó
  keepAwake();
  const it=SEQ.find(s=>s.id===id), n=nextItem();
  if(!n){rest=null; tone([784,988,1318],.16); $("#nbLive").textContent="Terminaste todas las series. Ahora a estirar.";}
  else if(it.rest>0&&it===SEQ.filter(s=>DONE.has(s.id)).pop()) startRest(it.rest);
  else if(it.rest===0){rest=null; $("#nbLive").textContent=`Sin descanso: pasa a ${n.e.n}.`;}
  refresh();}
function toggleSet(id){if(DONE.has(id)){DONE.delete(id);save();refresh();} else markDone(id);}
function scrollToCard(n){const el=n?document.getElementById(`x${n.bi}-${n.ei}`):null; if(el) el.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});}

// ---------- pintar estado ----------
function refresh(){
  if(cur>4) return;
  const D=PLAN[cur], n=nextItem();
  document.querySelectorAll(".set[data-id]").forEach(b=>{const on=DONE.has(b.dataset.id);b.setAttribute("aria-pressed",String(on));b.classList.toggle("next",!!n&&b.dataset.id===n.id);b.textContent=(on?"✓ ":"")+b.dataset.l;});
  document.querySelectorAll(".ex").forEach(c=>c.classList.toggle("now",!!n&&+c.dataset.bi===n.bi&&+c.dataset.ei===n.ei));
  const st=store.get("t:"+sk(),null), go=$("#go"), hc=$("#hclock"), mk=document.querySelector(".tlbar i");
  if(go){go.textContent=st?(go.dataset.arm?"¿Seguro? Toca otra vez":"Reiniciar el día"):"Empezar sesión ▶"; go.classList.toggle("on",!!st);}
  if(st){const el=(Date.now()-st)/60000; if(hc) hc.textContent=`⏱ ${Math.floor(el)}:${pad2(Math.floor((el%1)*60))} de 60`;
    if(mk){mk.style.display="block";mk.style.left=`calc(${Math.min(100,el/60*100)}% - 1.5px)`;}}
  else{if(hc) hc.textContent=""; if(mk) mk.style.display="none";}
  updateBar();
}
function setTxt(id,t){const e=document.getElementById(id); if(e.textContent!==t) e.textContent=t;}
function updateBar(){
  const bar=$("#nowbar"); if(cur>4){bar.hidden=true;document.body.classList.remove("hasbar");return;}
  bar.hidden=false; document.body.classList.add("hasbar");
  const D=PLAN[cur], n=nextItem(), st=store.get("t:"+sk(),null), dn=SEQ.filter(s=>DONE.has(s.id)).length;
  $("#nbProg").style.width=(dn/SEQ.length*100)+"%";
  let ck=`${dn} de ${SEQ.length} series`;
  if(st&&n){const el=(Date.now()-st)/60000, meta=BL[n.bi].end, late=el-meta;
    ck=`⏱ ${Math.floor(el)}:${pad2(Math.floor((el%1)*60))} · `+(late>.5?`<b>vas ${Math.ceil(late)} min tarde${late>=3&&n.bi<BL.length-1?": quita 1 serie del último bloque":""}</b>`:`bloque ${n.bi+1} termina en el min ${Math.round(meta)}`);}
  else if(st&&!n){const el=(Date.now()-st)/60000; ck=`⏱ ${Math.floor(el)}:${pad2(Math.floor((el%1)*60))} · ${dn} de ${SEQ.length} series`;}
  const ce=$("#nbClock"); if(ce.innerHTML!==ck) ce.innerHTML=ck;
  let K,N,S,GO,mode; const R=(rest&&rest.sk===sk())?rest:null;
  if(R){const left=Math.max(0,Math.ceil((R.end-Date.now())/1000)); mode="rest"; K="Descansa"; N=`${Math.floor(left/60)}:${pad2(left%60)}`;
    S=n?`Luego: ${pre(D,n)}${n.e.n} · serie ${n.r+1}`:""; GO="Saltar";}
  else if(!n){mode="end"; K="¡Listo!"; N="Todas las series hechas"; S="Ahora 7 min de estiramiento"; GO="Estirar";}
  else if(!st&&dn===0){mode="start"; K="Primero"; N="Calentamiento · 6 min"; S=`Luego: ${pre(D,n)}${n.e.n}`; GO="Empezar ▶";}
  else{mode="set"; const warm=st&&dn===0&&(Date.now()-st)/60000<6; K=warm?`Calienta 6 min · luego serie 1`:`Ahora · ${pre(D,n)||"bloque "+(n.bi+1)+" · "}${pre(D,n)?"· ":""}serie ${n.r+1} de ${n.e.sets}`; N=n.e.n; S=`${n.e.reps} · ${n.e.rir}${n.e.risk!=="bajo"?" · "+RISK[n.e.risk].t.toLowerCase():""}`; GO="Hecha ✓";}
  bar.dataset.mode=mode; setTxt("nbK",K); setTxt("nbN",N); setTxt("nbS",S); setTxt("nbGo",GO);
}
setInterval(()=>{tickRest(); if(cur<5) refresh();},500);

// ---------- HTML del día ----------
const PAIN_MSG=v=>v<=3?["g","Verde: entrena normal. Si durante los ejercicios te quedas en 3/10 o menos y mañana estás igual, cuenta como sesión buena para progresar."]
  :v===4?["a","Ámbar: en lo que moleste, baja 20% el peso o el rango de movimiento."]
  :["r","Rojo: hoy salta los ejercicios que duelan (empieza por los de riesgo alto) y usa su plan B. Si hay hinchazón, calor o el dolor sigue varios días, ve con tu fisio."];
function checklist(list,kind){const on=new Set(store.get(kind+":"+sk(),[]));
  return `<ul class="chk">${list.map((x,j)=>`<li><button type="button" role="checkbox" aria-checked="${on.has(j)}" data-chk="${kind}" data-j="${j}">${x}</button></li>`).join("")}</ul>`;}
function dayHTML(i){
  const D=PLAN[i], T=TYPE[D.t], tot=SEQ.length, endW=BL[BL.length-1].end;
  const seg=[`<span class="w" style="flex:6"></span>`,...BL.map((b,j)=>`<span style="flex:${b.min.toFixed(2)}">${j+1}</span>`),`<span class="m" style="flex:${Math.max(0,53-endW).toFixed(2)}"></span>`,`<span class="c" style="flex:7"></span>`].join("");
  const pain=store.get("p:"+sk(),null), pm=pain===null?null:PAIN_MSG(pain);
  let h=`<section class="hero">
    <div><span class="kind">${T.n}</span><h2>${D.d} <span>· ${D.s}</span></h2><p>${D.f} · ${D.blocks.length} estaciones · ${tot} series</p></div>
    <div class="tl" aria-label="Plan de 60 minutos: 6 de calentamiento, ${BL.length} bloques que terminan en el minuto ${Math.round(endW)}, margen y 7 de estiramiento"><div class="tlbar">${seg}<i></i></div>
      <div class="tllbl"><span>Calienta 6</span><span>series listas: min ${Math.round(endW)}</span><span>Estira 7</span></div></div>
    <div class="hb"><button class="go" id="go" type="button">Empezar sesión ▶</button><span class="hclock" id="hclock"></span></div>
  </section>
  <section class="card"><h3>Antes de empezar: ¿cómo está tu rodilla? <small>0 nada, 10 máximo</small></h3>
    <div class="pain"><div class="pchips" role="group" aria-label="Dolor de rodilla de 0 a 10">${Array.from({length:11},(_,v)=>`<button type="button" data-pain="${v}" data-z="${v<=3?"g":v===4?"a":"r"}" aria-pressed="${pain===v}">${v}</button>`).join("")}</div>
    ${pm?`<p class="pmsg" data-z="${pm[0]}">${pm[1]}</p>`:""}</div>
    <h3 style="margin-top:14px">Semana ${WK.w.n} de 4 <small>${fmtR(WK.w)}${DELOAD?" · descarga":""}${WK.st==="before"?" · empieza pronto":WK.st==="after"?" · la fase 2 ya terminó":""}</small></h3>
    <ul class="wkr">${["bajo","medio","alto"].map(r=>`<li><span class="rk ${r}">${RISK[r].n.replace("Riesgo ","")}</span><span>${WK.w[r]}</span></li>`).join("")}</ul>
    <details class="gold" id="gold"><summary>Reglas de oro: rodilla, cuello y dolor</summary><div class="r3">
      <div><h4>Rodilla</h4>Apunta a tu 2° y 3er dedo del pie. Si se va hacia adentro, baja el peso. Nada de rebotes abajo.</div>
      <div><h4>Cuello</h4>Mentón un poco metido y la mirada sigue al tronco. En el hip thrust mira a tus rodillas, nunca al techo.</div>
      <div><h4>Dolor durante el ejercicio</h4><div class="sem"><span class="g">0 a 3: sigue</span><span class="a">4: baja 20%</span><span class="r">5 o más: para hoy</span></div>Sube carga solo si 2 sesiones seguidas quedas en 3/10 o menos y a las 24 h estás igual que antes.</div>
    </div></details>
  </section>
  <section class="card" id="warm"><h3>Calentamiento <small>6 min</small></h3>${checklist(D.warm,"w")}</section>`;
  D.blocks.forEach((b,bi)=>{
    const R=Math.max(...b.ex.map(e=>e.sets)), tags=b.ex.map((_,ei)=>tagOf(D,bi,ei));
    h+=`<section class="blk" id="b${bi}"><div class="bh"><span class="bn">Bloque ${bi+1}</span><span class="bw">${b.where}</span><span class="bt">termina en el min ${Math.round(BL[bi].end)}</span></div>
      <p class="bsub">${R} ${R>1?"rondas":"ronda"} · descanso <b>${restTxt(b.rest)}</b>${b.ex.length>1?` · superserie: <b>${tags.join(" y luego ")}</b> sin pausa, descansa al terminar el par`:""}</p>`;
    b.ex.forEach((e,ei)=>{const key=e.key, Rk=RISK[e.risk], tag=tags[ei];
      const chips=Array.from({length:e.sets},(_,r)=>`<button type="button" class="set" data-id="${bi}-${ei}-${r}" data-l="S${r+1}" aria-pressed="false" aria-label="Serie ${r+1} de ${e.n}">S${r+1}</button>`).join("");
      h+=`<article class="ex" id="x${bi}-${ei}" data-bi="${bi}" data-ei="${ei}">${animHTML(key,e.n)}
        <div class="info">
          <span class="nowpill">AHORA</span>
          <div class="et"><span class="tag">${tag}</span><h3>${e.n}</h3></div>
          <div class="rx"><b>${e.sets} × ${e.reps}</b><span class="rir">${e.rir}</span></div>
          <p class="rline"><span class="rk ${e.risk}">${Rk.n}</span> ${Rk.t}</p>
          <div class="sets" role="group" aria-label="Series">${chips}</div>
          ${e.nota?`<p class="nota">${e.nota}</p>`:""}
          ${e.cuello?`<p class="neck"><b>Cuello:</b> ${e.cuello}</p>`:""}
          <details><summary>Cómo se hace</summary><p>${e.como}</p><p><b class="evita">Evita:</b> ${e.evita}</p><p><b>Lo sientes en:</b> ${e.siente}</p></details>
          <p class="alt"><b>Plan B si está ocupado:</b> ${e.alt}</p>
          <a class="vid" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.q)}" target="_blank" rel="noopener">Ver videos ↗</a>
        </div></article>`;});
    h+=`</section>`;});
  h+=`<section class="card"><h3>Si te sobra tiempo</h3><p style="margin:0">${D.extra} Si vas tarde: quita una serie del último bloque. El estiramiento no se recorta.</p></section>
  <section class="card" id="cool"><h3>Enfriamiento <small>7 min</small></h3>${checklist(D.cool,"c")}
    <p style="color:var(--muted);font-size:.88rem">Mañana revisa tu rodilla: si está igual que hoy antes de entrenar, la sesión cuenta como buena para progresar.</p></section>`;
  return h;
}
function render(i){
  cur=i; applyDay(i); store.set("tab",i);
  document.querySelectorAll(".tab").forEach((t,j)=>t.setAttribute("aria-selected",String(j===i)));
  if(io) io.disconnect(); live=[];
  if(i>4){$("#day").innerHTML=guideHTML(); updateBar(); return;}
  const D=PLAN[i]; SEQ=seqOf(D); BL=blocksOf(D); DONE=new Set(store.get("s:"+sk(),[]));
  $("#day").innerHTML=dayHTML(i);
  const gold=$("#gold"); gold.open=store.get("gold",true); gold.addEventListener("toggle",()=>store.set("gold",gold.open));
  if(HAS3D&&!G.r){try{init3();}catch(e){HAS3D=false;FAIL3D=true;}}
  setup3D(); refresh();
}

// ---------- guía ----------
function guideHTML(){
  const prot=[Math.round(63*1.6),Math.round(63*2.2)];
  return `<div class="gd">
  <section class="hero"><div><span class="kind">Guía</span><h2>Por qué esta rutina</h2><p>Tu plan de fase 2, pasado a lunes a viernes, 60 minutos y peso libre.</p></div></section>
  <section class="card"><h3>Tu meta: glúteo en forma de “P”</h3>
    <p style="margin:0">La “P” es un glúteo que de perfil se ve redondo y proyectado, con la parte alta llena. Se construye con cuatro piezas:</p>
    <ul><li><b>Glúteo mayor con la cadera extendida:</b> hip thrust dos veces por semana (martes pesado, viernes con más reps).</li>
    <li><b>Glúteo mayor estirado:</b> rumano, zancada inversa, búlgara y subida a cajón. El hip thrust y la sentadilla hacen crecer el glúteo de forma parecida; la sentadilla suma más cuádriceps y aductores (Plotkin 2023). Por eso se combinan.</li>
    <li><b>Glúteo medio, la parte alta y lateral:</b> abducción en polea, plancha lateral con abducción y patada en polea.</li>
    <li><b>Menos grasa encima:</b> eso es la recomposición.</li></ul>
    <p>Desde la semana 2 agregas repeticiones parciales abajo en el hip thrust, en la parte donde el glúteo está estirado. La evidencia todavía es preliminar, pero sugiere que esas parciales rinden igual que las completas (Wolf 2023).</p>
    <p style="color:var(--muted);font-size:.9rem">Siendo honestos: la forma final también depende de tu pelvis y de dónde guarda grasa tu cuerpo. El entrenamiento cambia el tamaño del músculo, no el hueso.</p></section>
  <section class="card"><h3>Recomposición: bajar grasa y subir músculo</h3>
    <div class="kpis"><div><span class="big">${prot[0]} a ${prot[1]} g</span><small>proteína al día (1.6 a 2.2 g por kg, con 63 kg)</small></div>
    <div><span class="big">3 a 4</span><small>comidas con 25 a 40 g de proteína cada una</small></div>
    <div><span class="big">8 a 10 mil</span><small>pasos al día, sobre todo sábado y domingo</small></div></div>
    <ul><li><b>Calorías:</b> un déficit pequeño, de 10 a 20% bajo tu mantenimiento, baja grasa sin frenar el músculo. Para calcular el número falta tu estatura y cuánto te mueves en el día.</li>
    <li><b>Sueño:</b> 7 a 9 horas. Es cuando se construye el músculo.</li>
    <li><b>Cómo medir:</b> cada 2 semanas, cintura, cadera y una foto de perfil con la misma luz. En recomposición la báscula engaña: si la cintura baja y tus pesos suben, va bien.</li></ul></section>
  <section class="card"><h3>Pata de ganso: cómo te cuida esta rutina</h3>
    <p style="margin:0">Es el punto en la cara interna de la rodilla donde se unen tres tendones (sartorio, grácil y semitendinoso). Se irrita con la rodilla hacia adentro, con mucha flexión de rodilla bajo carga y con subidas bruscas de peso.</p>
    <ul><li>Rodilla siempre sobre el 2° y 3er dedo del pie.</li>
    <li>Cada ejercicio trae su <span class="rk bajo">riesgo bajo</span> <span class="rk medio">medio</span> <span class="rk alto">alto</span>, igual que en tu plan. Los de riesgo alto (zancada, búlgara, sentadilla en pared, curl femoral y nórdico isométrico) van con poco peso, 3 a 4 s bajando y RIR 3 a 4.</li>
    <li>Femoral y aductor se readaptan poco a poco, con isometrías y curl ligero, como en tu plan.</li>
    <li>Glúteo medio fuerte: ayuda a que la rodilla no se vaya hacia adentro.</li>
    <li>Regla de dolor: puedes entrenar con molestia de 0 a 3/10 si a las 24 h vuelves a tu normal. Es el modelo de monitoreo del dolor que se usa en rehabilitación de tendones (Silbernagel 2007).</li></ul></section>
  <section class="card"><h3>Cuello (rectificación cervical)</h3>
    <ul><li>Mentón un poco metido y la mirada sigue al tronco: en el rumano miras al piso, en el hip thrust a tus rodillas, en el jalón la barra viene a ti.</li>
    <li>Retracciones de mentón al calentar y al estirar. El face pull y la elevación en Y fortalecen la espalda alta.</li>
    <li>No hay evidencia firme de que el ejercicio “devuelva” la curva del cuello. La meta es que te sientas bien y te muevas sin molestia.</li></ul></section>
  <section class="card"><h3>Por qué 4 o 5 estaciones y superseries</h3>
    <ul><li>Con el gimnasio lleno, cada día usa pocas estaciones y en las superseries los dos ejercicios están en el mismo lugar: no pierdes tu lugar ni esperas máquinas.</li>
    <li>Las superseries ahorran tiempo y dan resultados parecidos a las series tradicionales (Zhang y Weakley, 2025).</li>
    <li>Todas las series terminan antes del minuto 49. Quedan unos minutos de margen y 7 de estiramiento.</li></ul></section>
  <section class="card"><h3>Por qué la página se ve así</h3>
    <ul><li><b>Un color por tipo de día</b>, siempre el mismo: turquesa torso, violeta glúteo, azul pierna.</li>
    <li><b>Un solo naranja:</b> lo que toca ahora. Todo lo demás es calmado.</li>
    <li><b>Bloques cortos con minuto meta:</b> el tiempo se ve, no se adivina.</li>
    <li><b>Palomita, descanso con sonido y barra de avance:</b> sabes al instante que vas bien.</li>
    <li><b>Lo largo está escondido</b> en “Cómo se hace”.</li></ul>
    <p style="color:var(--muted);font-size:.9rem">La evidencia sobre colores específicos para el TDA es poca. Lo que tiene más respaldo es quitar ruido visual, dividir en pasos, mostrar qué sigue y dar recordatorios externos (guía de accesibilidad cognitiva del W3C).</p></section>
  <section class="card warnbox"><h3>Importante</h3><p style="margin:0">Esta rutina no sustituye a tu fisio ni a tu médico. Si la rodilla se hincha, se calienta o el dolor pasa de 5/10, para y consulta.</p></section>
  <section class="card src"><h3>Fuentes</h3><ul>
    <li><a href="https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2023.1279170/full" target="_blank" rel="noopener">Plotkin y col. 2023: hip thrust contra sentadilla y crecimiento del glúteo</a></li>
    <li><a href="https://bjsm.bmj.com/content/52/6/376.abstract" target="_blank" rel="noopener">Morton y col. 2018: proteína y ganancia de músculo (meta-análisis)</a></li>
    <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5828430/" target="_blank" rel="noopener">Schoenfeld y Aragon 2018: cuánta proteína por comida</a></li>
    <li><a href="https://lida.sport-iat.de/ta/Record/4066252?lng=en" target="_blank" rel="noopener">Barakat y col. 2020: recomposición corporal</a></li>
    <li><a href="https://eprints.leedsbeckett.ac.uk/id/eprint/11908" target="_blank" rel="noopener">Zhang, Weakley y col. 2025: superseries contra series tradicionales</a></li>
    <li><a href="https://sportrxiv.org/index.php/server/preprint/download/485/1040/972" target="_blank" rel="noopener">Wolf y col. 2023: rango parcial y completo (preprint)</a></li>
    <li><a href="https://search.pedro.org.au/search-results/record-detail/18389" target="_blank" rel="noopener">Silbernagel y col. 2007: modelo de monitoreo del dolor</a></li>
    <li><a href="https://www.hingehealth.com/resources/articles/pes-anserine-bursitis/" target="_blank" rel="noopener">Hinge Health: pata de ganso y ejercicios</a></li>
    <li><a href="https://www.w3.org/TR/coga-usable/" target="_blank" rel="noopener">W3C: contenido usable para personas con diferencias cognitivas y de aprendizaje</a></li></ul></section>
  </div>`;
}

// ---------- eventos ----------
document.addEventListener("click",ev=>{
  const t=ev.target;
  const s=t.closest(".set[data-id]"); if(s){toggleSet(s.dataset.id);return;}
  const c=t.closest("[data-chk]"); if(c){const k=c.dataset.chk+":"+sk(), on=new Set(store.get(k,[])), j=+c.dataset.j; on.has(j)?on.delete(j):on.add(j); store.set(k,[...on]); c.setAttribute("aria-checked",String(on.has(j))); return;}
  const p=t.closest("[data-pain]"); if(p){const v=+p.dataset.pain; store.set("p:"+sk(),v);
    p.parentNode.querySelectorAll("[data-pain]").forEach(b=>b.setAttribute("aria-pressed",String(b===p)));
    const box=p.closest(".pain"), [z,msg]=PAIN_MSG(v); let m=box.querySelector(".pmsg"); if(!m){m=document.createElement("p");m.className="pmsg";m.setAttribute("aria-live","polite");box.appendChild(m);} m.dataset.z=z; m.textContent=msg; return;}
  if(t.closest("#go")){const g=$("#go"); if(!store.get("t:"+sk(),null)){startSession();return;}
    if(g.dataset.arm){delete g.dataset.arm; store.set("t:"+sk(),null); store.set("s:"+sk(),[]); store.set("w:"+sk(),[]); store.set("c:"+sk(),[]); rest=null; const y=window.scrollY; render(cur); window.scrollTo(0,y);}
    else{g.dataset.arm="1"; refresh(); setTimeout(()=>{if(g.isConnected){delete g.dataset.arm;refresh();}},3500);} return;}
});
$("#nbGo").onclick=()=>{const m=$("#nowbar").dataset.mode, n=nextItem();
  if(m==="start"){startSession(); document.getElementById("warm").scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});}
  else if(m==="set"&&n) markDone(n.id);
  else if(m==="rest"){rest=null; refresh(); scrollToCard(nextItem());}
  else if(m==="end") document.getElementById("cool").scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});};
$("#nbInfo").onclick=()=>{const m=$("#nowbar").dataset.mode;
  if(m==="start") document.getElementById("warm").scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
  else if(m==="end") document.getElementById("cool").scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
  else scrollToCard(nextItem());};
const tgS=$("#tgSnd"), tgV=$("#tgSpd");
const paintTg=()=>{const s=store.get("snd",true);tgS.textContent="Sonido: "+(s?"sí":"no");tgS.setAttribute("aria-pressed",String(s));
  tgV.textContent="Figura: velocidad "+(speed===1?"normal":"lenta");tgV.setAttribute("aria-pressed",String(speed!==1));};
tgS.onclick=()=>{store.set("snd",!store.get("snd",true)); paintTg(); if(store.get("snd",true)) tone([784],.12);};
tgV.onclick=()=>{speed=speed===1?.5:1; store.set("spd",speed); paintTg();};
paintTg();

// ---------- arranque ----------
$("#wkchip").textContent=WK.st==="before"?`Fase 2 empieza el 2 nov`:WK.st==="after"?`Fase 2 terminada`:`Semana ${WK.w.n} de 4 · ${fmtR(WK.w)}`;
const tabs=$("#tabs");
[...PLAN.map((D,i)=>({b:D.d.slice(0,3),s:D.s,c:TYPE[D.t].c[0],i})),{b:"GUÍA",s:"Por qué",c:"#8A80B8",i:5}].forEach(o=>{
  const t=document.createElement("button"); t.className="tab"; t.type="button"; t.setAttribute("role","tab");
  t.innerHTML=`<span class="dot" style="background:${o.c}"></span><b>${o.b}</b><small>${o.s}</small>${o.i===TODAY_IDX?`<span class="hoy">HOY</span>`:""}`;
  t.onclick=()=>{render(o.i); window.scrollTo({top:0,behavior:"auto"});}; tabs.appendChild(t);});
if(matchMedia("(min-width:700px)").matches) $("#how").open=store.get("howOpen",true);
$("#how").addEventListener("toggle",()=>store.set("howOpen",$("#how").open));
render(TODAY_IDX<=4?TODAY_IDX:0);
requestAnimationFrame(frame);
