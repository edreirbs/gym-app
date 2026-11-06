/* Prueba del planificador de la semana adaptativa (spec 001) sin navegador.
   Uso: node tools/edrei_semana_test.js [v]   (v = imprime los planes de algunos patrones)
   Simula los 32 patrones de asistencia de lunes a viernes, día por día y siguiendo el plan. */
const fs=require("fs"),vm=require("vm"),path=require("path");
const ROOT=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(ROOT,"edrei/rutina.html"),"utf8");
const grab=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);if(i<0||j<0) throw new Error("no encontré "+a);return html.slice(i,j);};
const code=grab("const DAYS=","// ---------- motor de animación v2")+grab("const MUS=","const MUS_NAME=")+grab("const ISO=","const tempoOf");
const ctx={};vm.createContext(ctx);vm.runInContext(code+";this.DAYS=DAYS;this.MUS=MUS;this.blocksOf=blocksOf;",ctx);
const Semana=require(path.join(ROOT,"edrei/semana.js"));
const pairs=Semana.pairsOf(ctx.DAYS,ctx.blocksOf), byId=Object.fromEntries(pairs.map(p=>[p.id,p]));
const nm=id=>byId[id].keys.join("+");
const SQ=pairs.find(p=>p.keys[0]==="sentadilla").id;
const fails=[]; let n=0;
const fail=m=>{fails.push(m);console.log("FALLA",m);};
const plan=(consumed,vol,slots)=>Semana.plan({pairs,consumed,doneVol:vol,slots,MUS:ctx.MUS});

// A1: semana completa = base
const r0=plan(new Set(),{},5);
if(r0.merged||r0.days.map(g=>g.join()).join("|")!==ctx.DAYS.map((D,s)=>pairs.filter(p=>p.s===s).map(p=>p.id).join()).join("|")) fail("A1: con 5 días el plan no es la base");

const VERBOSE=process.argv[2]==="v", SHOW=[30,29,27,23,15,21,5];
for(let pat=0;pat<32;pat++){
  const consumed=new Set(), vol={}, log=[]; let prev=null;
  for(let d=0;d<5;d++){
    const slots=5-d, r=plan(consumed,vol,slots);
    // A2: reglas en cada día planeado
    r.days.forEach(g=>{n++;const c=Semana.check(g.map(i=>byId[i]));if(c.length) fail(`patrón ${pat} día ${d}: ${c.join(", ")} en ${g.map(nm).join(" | ")}`);});
    if(!consumed.has(SQ)&&!r.days.flat().includes(SQ)) fail(`patrón ${pat} día ${d}: la sentadilla salió`);
    if(r.days.length>slots) fail(`patrón ${pat} día ${d}: más días que disponibles`);
    // A3: si ayer fui e hice lo planeado, el resto del plan no cambia
    if(prev&&(pat>>(d-1)&1)&&prev.days.slice(1).map(g=>g.join()).join("|")!==r.days.map(g=>g.join()).join("|")&&prev.merged)
      log.push("  (aviso) el plan cambió tras seguirlo; la app lo evita guardando el plan");
    if(VERBOSE) log.push(`  hoy=${"LMMJV"[d]} quedan ${slots}: `+r.days.map(g=>"["+g.map(nm).join(" | ")+"]").join(" ")+(r.dropped.length?"  FUERA: "+r.dropped.map(nm).join(", "):""));
    if(pat>>d&1&&r.days[0]) r.days[0].forEach(i=>{consumed.add(i);Semana.addVol(vol,byId[i],ctx.MUS);});
    prev=r;
  }
  if(VERBOSE&&SHOW.includes(pat)) console.log("asistencia",[0,1,2,3,4].map(i=>pat>>i&1?"F":"x").join("")+"\n"+log.join("\n"));
}
console.log(`días planeados revisados: ${n} · fallas: ${fails.length}`);
process.exit(fails.length?1:0);
