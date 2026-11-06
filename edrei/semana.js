/* Semana adaptativa (specs 001 y 002 en specs/).
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
// Patrón de movimiento de cada ejercicio. En un día no se repite patrón: dos ejercicios del mismo patrón dan un
// estímulo redundante (Kassiano y cols., 2022). Martillo cuenta aparte del curl (braquial y braquiorradial).
const PATTERN={banca:"pressH",inclDb:"pressIncl",inclBar:"pressIncl",militar:"pressV",pressHombro:"pressV",
  latDb:"lateral",latPolea:"lateral",postDb:"rearDelt",postDbStand:"rearDelt",postPolea:"rearDelt",
  curlZ:"curl",curlIncl:"curl",predicador:"curl",martillo:"hammer",overheadDb:"triOver",overhead:"triOver",triPolea:"triPush",
  remoBarra:"row",remoSentado:"row",jalon:"vertPull",jalonSup:"vertPull",pesoMuerto:"hinge",sentadilla:"squat",
  prensa:"legPress",hipThrust:"hipExt",femoral:"kneeFlex",aductores:"adduct",talon:"calf",crunch:"crunch",lenador:"chop",granjero:"carry"};
const patOf=k=>PATTERN[k]||k;
// Tope por sesión: más de ~11 series fraccionales de un músculo en una sesión ya casi no suma (Remmert y cols., 2025, preprint).
const MAX_SES_SETS=11;
let MUS_REF={};

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
function totalGain(v,list,MUS){
  const add={}; list.forEach(p=>addVol(add,p,MUS)); let g=0;
  for(const m in add) g+=(W[m]??.5)*(f((v[m]||0)+add[m])-f(v[m]||0));
  return g;
}
function gain(v,pair,MUS){
  const add=addVol({},pair,MUS); let g=0;
  for(const m in add) g+=(W[m]??.5)*(f((v[m]||0)+add[m])-f(v[m]||0));
  return g;
}

function okGroup(g){
  const keys=g.flatMap(p=>p.keys);
  if(new Set(keys.map(patOf)).size!==keys.length) return false;
  if(keys.filter(k=>REMO.has(k)).length>1) return false;
  const v={}; g.forEach(p=>addVol(v,p,MUS_REF)); if(Object.values(v).some(x=>x>MAX_SES_SETS)) return false;
  if(keys.filter(k=>HEAVY_LOW.has(k)).length>1) return false;
  if(WARM+g.reduce((a,p)=>a+p.min,0)>MAX_END) return false;
  return g.length<=PER_DAY;
}
const ordKey=p=>p.s*10+p.p;
// Dentro del día: si todo viene de una sesión, su orden original; si no, básicos con barra (RIR 2) primero.
function orderGroup(g){
  if(new Set(g.map(p=>p.s)).size===1) return g.slice().sort((a,b)=>a.p-b.p);
  return g.slice().sort((a,b)=>(RANK[a.ints[0]]??2)-(RANK[b.ints[0]]??2)||ordKey(a)-ordKey(b));
}

/** Sesiones pendientes: las que no se han tocado esta semana. Si ya hiciste una superserie de una sesión, esa sesión cuenta como hecha. */
function pendingSessions(pairs,consumed){
  const touched=new Set(pairs.filter(p=>consumed.has(p.id)).map(p=>p.s));
  return [...new Set(pairs.map(p=>p.s))].filter(s=>!touched.has(s));
}
function pendingIds(pairs,consumed){const ps=new Set(pendingSessions(pairs,consumed));return pairs.filter(p=>ps.has(p.s)).map(p=>p.id);}

/* Lugares de un día juntado: cada superserie conserva su papel (1 básico pesado, 2 compuesto, 3 analítico).
   Mismo tipo: en cada lugar compiten la superserie 1 de A contra la 1 de B, etc.
   Torso: 1 empuje pesado, 2 jale (remo o jalón, sin peso muerto), 3 analítico de cualquiera.
   Cuerpo completo: 1 sentadilla, 2 un básico de torso, 3 analítico de torso (si cabe en el tiempo). */
function slotsOf(u,cand){
  const of=(fam,ps)=>cand.filter(p=>p.fam===fam&&ps.includes(p.p));
  const noHL=l=>l.filter(p=>!p.keys.some(k=>HEAVY_LOW.has(k)));
  const fams=new Set(cand.map(p=>p.fam));
  if(fams.size===1) return [0,1,2].map(k=>cand.filter(p=>p.p===k));
  const up=[...fams].filter(f=>f!=="legs");
  const heavyUp=noHL(of("push",[0]).concat(of("pull",[0,1])));
  const light=up.flatMap(f=>of(f,[2]));
  if(fams.has("legs")) return [of("legs",[0]),heavyUp,light];
  return [of("push",[0]),noHL(of("pull",[0,1])),light];
}

const FAM_NAME={push:"Empuje",pull:"Jale",legs:"Pierna"};
function unitTitle(u,pairs){
  if(u.ses.length===1) return null;
  const fams=new Set(u.ses.map(s=>pairs.find(p=>p.s===s).fam));
  if(fams.size===1) return FAM_NAME[[...fams][0]];
  return fams.has("legs")?"Cuerpo completo":"Torso";
}

/**
 * Plan de los días que quedan, por niveles (spec 002). Se juntan sesiones solo si no alcanzan los días:
 *   1. Jale A + Jale B en un día de Jale (si pierdes una, que sea Jale B).
 *   2. Empuje A + Empuje B en un día de Empuje.
 *   3. Empuje + Jale en un día de Torso. La pierna se queda sola.
 *   4. Si solo queda un día: Cuerpo completo (sentadilla + lo más valioso de torso).
 * Un día juntado lleva las 3 superseries que más aportan por minuto, sin romper las reglas.
 * Devuelve {days: [[id...]...], dropped: [id...], merged: bool, merges: [{ses:[s...], title}]}.
 */
function plan({pairs,consumed,doneVol,slots,MUS}){
  MUS_REF=MUS||{};
  const pend=pendingSessions(pairs,consumed), ids=pendingIds(pairs,consumed);
  if(!pend.length||slots<=0) return {days:[],dropped:ids,merged:false,merges:[]};
  const famOf=s=>pairs.find(p=>p.s===s).fam;
  let units=pend.map(s=>({ses:[s],fam:famOf(s)}));
  const join=(a,b,fam)=>{const u={ses:a.ses.concat(b.ses).sort((x,y)=>x-y),fam};units=units.filter(x=>x!==a&&x!==b);units.push(u);units.sort((x,y)=>x.ses[0]-y.ses[0]);};
  while(units.length>slots){
    const same=["pull","push"].map(f=>units.filter(u=>u.fam===f)).find(l=>l.length>=2);
    if(same){join(same[0],same[1],same[0].fam);continue;}
    const pu=units.find(u=>u.fam==="push"), pl=units.find(u=>u.fam==="pull");
    if(pu&&pl){join(pu,pl,"upper");continue;}
    const up=units.filter(u=>u.fam!=="legs");
    const lg=units.find(u=>u.fam==="legs");
    if(lg&&up.length){join(lg,up[0],"full");continue;}
    join(units[0],units[1],units[0].fam); // no debería pasar con la rutina actual
  }
  const vol=Object.assign({},doneVol), days=[], merges=[];
  units.forEach((u,ui)=>{
    // Nada de peso muerto pegado al día de pierna: no repetir básico pesado de pierna en 48 h (plan base).
    const nearLegs=[units[ui-1],units[ui+1]].some(x=>x&&x!==u&&x.ses.some(s=>famOf(s)==="legs"));
    const cand=pairs.filter(p=>u.ses.includes(p.s)&&!(nearLegs&&p.keys.some(k=>k==="pesoMuerto")));
    if(u.ses.length===1){const all=pairs.filter(p=>p.s===u.ses[0]);days.push(all.map(p=>p.id));all.forEach(p=>addVol(vol,p,MUS));return;}
    // Se prueban todas las combinaciones (una opción o nada por lugar): gana la que llena más lugares
    // y, entre esas, la que más aporta a la semana. Todas cumplen las reglas del día.
    let best=null;
    const slots=slotsOf(u,cand), rec=(i,sel)=>{
      if(i===slots.length){
        if(!sel.length) return;
        const sc=[sel.length,totalGain(vol,sel,MUS)];
        if(!best||sc[0]>best.sc[0]||(sc[0]===best.sc[0]&&sc[1]>best.sc[1]+1e-9)) best={sc,sel:sel.slice()};
        return;
      }
      for(const p of slots[i]) if(!sel.includes(p)&&okGroup(sel.concat(p))) rec(i+1,sel.concat(p));
      rec(i+1,sel);
    };
    rec(0,[]);
    const sel=best?best.sel:[]; sel.forEach(p=>addVol(vol,p,MUS));
    days.push(sel.map(p=>p.id));
    const one=[...new Set(sel.map(p=>p.s))];
    merges.push({ses:u.ses,title:unitTitle(u,pairs),keep:one.length===1&&sel.length===pairs.filter(p=>p.s===one[0]).length?one[0]:null});
  });
  const used=new Set(days.flat());
  return {days,dropped:ids.filter(id=>!used.has(id)),merged:merges.length>0,merges};
}

/** Revisa un día ya armado contra las reglas (para pruebas y para avisar si algo raro pasa). */
function check(group,MUS){
  const keys=group.flatMap(p=>p.keys), out=[];
  if(new Set(keys).size!==keys.length) out.push("ejercicio repetido");
  const pats=keys.map(patOf), dup=pats.filter((x,i)=>pats.indexOf(x)!==i);
  if(dup.length) out.push("patrón repetido: "+[...new Set(dup)].join(", "));
  if(MUS){const v={}; group.forEach(p=>addVol(v,p,MUS)); for(const m in v) if(v[m]>MAX_SES_SETS) out.push(`${m}: ${v[m]} series en la sesión`);}
  if(keys.filter(k=>REMO.has(k)).length>1) out.push("más de un remo");
  if(keys.filter(k=>HEAVY_LOW.has(k)).length>1) out.push("sentadilla y peso muerto juntos");
  if(keys.length>6) out.push("más de 6 ejercicios");
  const end=WARM+group.reduce((a,p)=>a+p.min,0); if(end>MAX_END) out.push("termina en el minuto "+end.toFixed(1));
  return out;
}

const api={pairsOf,plan,check,addVol,pendingIds,patOf,PATTERN,W,MAX_END};
if(typeof module!=="undefined"&&module.exports) module.exports=api; else root.Semana=api;
})(typeof window!=="undefined"?window:globalThis);
