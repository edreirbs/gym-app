/* Semana adaptativa (spec: specs/001-semana-adaptativa/spec.md).
   Funciones puras: no tocan el DOM ni localStorage. Las usa rutina.html y las pruebas.
   Unidad de trabajo: la superserie (par A y B) tal como la arma blocksOf. */
(function(root){
"use strict";

// Peso de cada músculo para Edrei: prioridad estética 1.0, pecho y pierna 0.8, resto 0.4 a 0.5 (criterio del coach).
const W={deltS:1,deltR:1,deltF:1,back:1,lats:1,bi:1,tri:1,fore:1,chest:.8,chestU:.8,quad:.8,glute:.8,ham:.8,abs:.5,low:.4,calf:.4,add:.4,trap:.4};
const REMO=new Set(["remoBarra","remoSentado"]);
const HEAVY_LOW=new Set(["sentadilla","pesoMuerto"]);
const WARM=6, MAX_END=48, PER_DAY=3;
const MANDATORY=new Set(["sentadilla"]); // la superserie que empieza con sentadilla nunca se pierde
const RANK={rir2:0,rir1:1,fallo:2};

/** Lista de superseries de la semana base. */
function pairsOf(DAYS,blocksOf){
  const out=[];
  DAYS.forEach((D,s)=>blocksOf(D).forEach((bk,p)=>out.push({
    id:s+"."+p, s, p, fam:D.fam, refs:bk.idx.map(e=>[s,e]),
    keys:bk.idx.map(e=>D.ex[e][7]), sets:bk.idx.map(e=>D.ex[e][1]), ints:bk.idx.map(e=>D.ex[e][4]),
    min:bk.min
  })));
  return out;
}

// Volumen por músculo: principal 1 serie, secundarios 0.5 (conteo fraccional).
function addVol(v,pair,MUS){
  pair.keys.forEach((k,i)=>(MUS[k]||[]).forEach((m,j)=>{v[m]=(v[m]||0)+pair.sets[i]*(j===0?1:.5);}));
  return v;
}
const f=x=>Math.log2(1+x);
function gain(v,pair,MUS){
  const add=addVol({},pair,MUS); let g=0;
  for(const m in add) g+=(W[m]??.5)*(f((v[m]||0)+add[m])-f(v[m]||0));
  return g;
}

function okGroup(g){
  const keys=g.flatMap(p=>p.keys);
  if(new Set(keys).size!==keys.length) return false;
  if(keys.filter(k=>REMO.has(k)).length>1) return false;
  if(keys.filter(k=>HEAVY_LOW.has(k)).length>1) return false;
  if(WARM+g.reduce((a,p)=>a+p.min,0)>MAX_END) return false;
  return g.length<=PER_DAY;
}
const ordKey=p=>p.s*10+p.p;
// Dentro del día: básicos con barra primero. Si todo viene de una sola sesión, se respeta su orden original.
function orderGroup(g){
  if(new Set(g.map(p=>p.s)).size===1) return g.slice().sort((a,b)=>a.p-b.p);
  return g.slice().sort((a,b)=>(RANK[a.ints[0]]??2)-(RANK[b.ints[0]]??2)||ordKey(a)-ordKey(b));
}
function orderDays(groups){return groups.map(orderGroup).sort((a,b)=>Math.min(...a.map(ordKey))-Math.min(...b.map(ordKey)));}

function score(days){
  let sc=0;
  for(const g of days){
    for(let i=0;i<g.length;i++) for(let j=i+1;j<g.length;j++){
      if(g[i].s===g[j].s) sc+=3; else if(g[i].fam===g[j].fam) sc+=1;
    }
  }
  const sizes=days.map(g=>g.length), avg=sizes.reduce((a,b)=>a+b,0)/sizes.length;
  sc-=sizes.reduce((a,b)=>a+(b-avg)**2,0);
  for(let i=1;i<days.length;i++){
    const hl=g=>g.some(p=>p.keys.some(k=>HEAVY_LOW.has(k)));
    if(hl(days[i-1])&&hl(days[i])) sc-=4; // dos días seguidos con básico pesado de pierna
  }
  return sc;
}

/** Busca la mejor forma de repartir `sel` en exactamente k días válidos. firstOnly: solo dice si existe. */
function partition(sel,k,firstOnly){
  k=Math.min(k,sel.length);
  let best=null,bestS=-Infinity; const G=[];
  const rec=i=>{
    if(firstOnly&&best) return;
    if(sel.length-i<k-G.length) return;
    if(i===sel.length){
      if(G.length!==k) return;
      const days=orderDays(G), s=score(days);
      if(s>bestS){bestS=s;best=days;}
      return;
    }
    const p=sel[i];
    for(const g of G){ if(g.length<PER_DAY){ g.push(p); if(okGroup(g)) rec(i+1); g.pop(); if(firstOnly&&best) return; } }
    if(G.length<k){ G.push([p]); if(okGroup(G[G.length-1])) rec(i+1); G.pop(); }
  };
  rec(0);
  return best;
}

/**
 * Plan de los días que quedan.
 * pairs: de pairsOf. consumed: Set de ids ya hechos esta semana. doneVol: volumen hecho por músculo.
 * slots: número de días disponibles. MUS: músculos por ejercicio.
 * Devuelve {days: [[id...]...], dropped: [id...], merged: bool}.
 */
function plan({pairs,consumed,doneVol,slots,MUS}){
  const pending=pairs.filter(p=>!consumed.has(p.id));
  if(!pending.length||slots<=0) return {days:[],dropped:pending.map(p=>p.id),merged:false};
  const ses=[...new Set(pending.map(p=>p.s))];
  const whole=ses.every(s=>pairs.filter(p=>p.s===s).every(p=>!consumed.has(p.id)));
  if(whole&&ses.length<=slots)
    return {days:ses.map(s=>pending.filter(p=>p.s===s).map(p=>p.id)),dropped:[],merged:false};

  const k=Math.min(slots,Math.ceil(pending.length/PER_DAY)), need=Math.min(pending.length,PER_DAY*k);
  const vol=Object.assign({},doneVol), sel=[];
  const take=p=>{sel.push(p);addVol(vol,p,MUS);};
  pending.filter(p=>MANDATORY.has(p.keys[0])).forEach(take);
  while(sel.length<need){
    const cand=pending.filter(p=>!sel.includes(p))
      .map(p=>({p,g:gain(vol,p,MUS)/p.min}))
      .sort((a,b)=>b.g-a.g||ordKey(a.p)-ordKey(b.p));
    const next=cand.find(c=>partition(sel.concat(c.p),Math.min(k,sel.length+1),true));
    if(!next) break;
    take(next.p);
  }
  const days=partition(sel,k,false)||[];
  const used=new Set(days.flat().map(p=>p.id));
  return {days:days.map(g=>g.map(p=>p.id)),dropped:pending.filter(p=>!used.has(p.id)).map(p=>p.id),merged:true};
}

/** Revisa un día ya armado contra las reglas (para pruebas y para avisar si algo raro pasa). */
function check(group){
  const keys=group.flatMap(p=>p.keys), out=[];
  if(new Set(keys).size!==keys.length) out.push("ejercicio repetido");
  if(keys.filter(k=>REMO.has(k)).length>1) out.push("más de un remo");
  if(keys.filter(k=>HEAVY_LOW.has(k)).length>1) out.push("sentadilla y peso muerto juntos");
  if(keys.length>6) out.push("más de 6 ejercicios");
  const end=WARM+group.reduce((a,p)=>a+p.min,0); if(end>MAX_END) out.push("termina en el minuto "+end.toFixed(1));
  return out;
}

const api={pairsOf,plan,check,addVol,W,MAX_END};
if(typeof module!=="undefined"&&module.exports) module.exports=api; else root.Semana=api;
})(typeof window!=="undefined"?window:globalThis);
