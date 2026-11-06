// ---------- equipo con medidas reales ----------
function mk(geo,mat){const x=new THREE.Mesh(geo,mat);x.castShadow=true;x.receiveShadow=true;return x;}
function between(o,a,b){const d=b.clone().sub(a),l=Math.max(1e-4,d.length());o.position.copy(a).add(b).multiplyScalar(.5);o.scale.set(1,l,1);o.quaternion.setFromUnitVectors(UPY,d.normalize());}
function box(g,mat,x0,x1,y0,y1,z0,z1){const b=mk(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),mat);b.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);g.add(b);return b;}
function rod(g,mat,a,b,r){const c=mk(new THREE.CylinderGeometry(r,r,1,14),mat);between(c,a,b);g.add(c);return c;}
function pad(g,c,len,w,th,angDeg){const p=mk(new THREE.BoxGeometry(w,th,len),G.pad);p.position.copy(c);p.rotation.x=rad(angDeg);g.add(p);
  const s=mk(new THREE.BoxGeometry(w-.04,.02,len-.04),G.frame);s.position.copy(c);s.rotation.x=rad(angDeg);s.translateY(-th/2-.01);g.add(s);return p;}
function barbell(){const g=new THREE.Group();const bar=mk(new THREE.CylinderGeometry(.014,.014,2.2,16),G.steel);bar.rotation.z=Math.PI/2;g.add(bar);
  for(const x of [-.80,.80]){const p=mk(new THREE.CylinderGeometry(.225,.225,.05,48),G.plate);p.rotation.z=Math.PI/2;p.position.x=x;g.add(p);
    const hub=mk(new THREE.CylinderGeometry(.03,.03,.07,20),G.steel);hub.rotation.z=Math.PI/2;hub.position.x=x;g.add(hub);
    const col=mk(new THREE.CylinderGeometry(.03,.03,.05,16),G.steel);col.rotation.z=Math.PI/2;col.position.x=x-Math.sign(x)*.055;g.add(col);
    const sl=mk(new THREE.CylinderGeometry(.025,.025,.36,16),G.steel);sl.rotation.z=Math.PI/2;sl.position.x=x+Math.sign(x)*.1;g.add(sl);}
  return g;}
function dumbbell(small){const s=small?.62:1,g=new THREE.Group();g.add(mk(new THREE.CylinderGeometry(.015,.015,.20*s+.04,12),G.steel));
  for(const y of [-.095*s-.01,.095*s+.01]){const hd=mk(new THREE.CylinderGeometry(.062*s,.062*s,.07*s,6),G.iron);hd.position.y=y;g.add(hd);}return g;}
function towerAt(g,base,top){box(g,G.frame,base.x-.05,base.x+.05,0,top,base.z-.05,base.z+.05);}
function pulley(g,A){const p=mk(new THREE.CylinderGeometry(.05,.05,.03,24),G.steel);p.rotation.z=Math.PI/2;p.position.copy(A);g.add(p);}
function hexBar(){const g=new THREE.Group(),r=.012,P=[[-.42,-.26],[-.30,-.36],[.30,-.36],[.42,-.26],[.42,.26],[.30,.36],[-.30,.36],[-.42,.26]].map(([x,z])=>X(x,0,z));
  for(let i=0;i<P.length;i++) rod(g,G.steel,P[i],P[(i+1)%P.length],r);
  for(const s of [-1,1]){rod(g,G.steel,X(s*.42,0,-.26),X(s*.25,.06,-.06),r);rod(g,G.steel,X(s*.42,0,.26),X(s*.25,.06,.06),r);rod(g,G.steel,X(s*.25,.06,-.07),X(s*.25,.06,.07),.016);
    const sl=mk(new THREE.CylinderGeometry(.025,.025,.46,16),G.steel);sl.rotation.z=Math.PI/2;sl.position.x=s*.66;g.add(sl);
    const p=mk(new THREE.CylinderGeometry(.225,.225,.05,48),G.plate);p.rotation.z=Math.PI/2;p.position.x=s*.62;g.add(p);}
  return g;}
const EQUIP={
 prone(g){const al=PRONE.al,d=X(0,Math.sin(rad(al)),Math.cos(rad(al))),n=X(0,Math.cos(rad(al)),-Math.sin(rad(al)));
   const c=PRONE.P0().addScaledVector(d,.42).addScaledVector(n,-.03);pad(g,c,.85,.24,.06,-al);
   const mid=PRONE.P0().addScaledVector(d,.30).addScaledVector(n,-.07);box(g,G.frame,-.04,.04,0,mid.y,mid.z-.04,mid.z+.04);box(g,G.frame,-.24,.24,0,.04,mid.z-.40,mid.z+.40);},
 incl(g){pad(g,X(0,.42,.12),.36,.3,.06,0);pad(g,X(0,.62,-.30),.82,.3,.06,30);box(g,G.frame,-.04,.04,0,.39,-.2,.3);box(g,G.frame,-.25,.25,0,.04,-.75,.35);},
 curlIncl(g){pad(g,X(0,.42,.12),.36,.3,.06,0);pad(g,X(0,.70,-.30),.82,.3,.06,45);box(g,G.frame,-.04,.04,0,.39,-.2,.3);box(g,G.frame,-.25,.25,0,.04,-.8,.35);},
 upright(g){pad(g,X(0,.43,.04),.36,.3,.06,0);pad(g,X(0,.86,-.17),.74,.3,.06,84);box(g,G.frame,-.04,.04,0,.40,-.15,.25);box(g,G.frame,-.25,.25,0,.04,-.45,.35);},
 jalon(g){const hy=.485+.10*G.S;pad(g,X(0,.45,.02),.38,.36,.07,0);box(g,G.frame,-.04,.04,0,.42,-.1,.12);
   const tz=DIM.LT*.78, ty=hy+.15;for(const x of [-.12,.12])rod(g,G.frame,X(x,.42,tz+.02),X(x,ty,tz+.02),.02);
   const tp=mk(new THREE.CylinderGeometry(.05,.05,.40,20),G.pad);tp.rotation.z=Math.PI/2;tp.position.set(0,ty,tz);g.add(tp);
   box(g,G.frame,-.06,.06,0,2.45,.62,.74);box(g,G.frame,-.06,.06,2.38,2.45,-.05,.74);},
 hipThrust(g){pad(g,X(0,.415,-.15),.3,1.2,.06,0);box(g,G.frame,-.5,.5,0,.385,-.18,-.12);},
 femoral(g){const hy=.50+.10*G.S,kz=-.02+DIM.LT;pad(g,X(0,.465,0),.46,.34,.07,0);pad(g,X(0,.86,-.21),.62,.34,.07,78);box(g,G.frame,-.05,.05,0,.44,-.25,.2);
   const lp=mk(new THREE.CylinderGeometry(.055,.055,.40,20),G.pad);lp.rotation.z=Math.PI/2;lp.position.set(0,hy+.11,kz-.10);g.add(lp);
   for(const x of [-.24,.24]){box(g,G.frame,x-.03,x+.03,0,hy+.02,kz-.04,kz+.04);}},
 talon(g){const p=mk(new THREE.CylinderGeometry(.225,.225,.03,40),G.iron);p.position.set(0,.015,.15);g.add(p);},
 remoSentado(g){const az=(DIM.LT+DIM.LS)*.92;pad(g,X(0,.39,0),.40,.34,.06,0);box(g,G.frame,-.04,.04,0,.36,-.15,.15);box(g,G.frame,-.25,.25,0,.04,-.3,az+.30);
   box(g,G.frame,-.22,.22,.18,.60,az+.08,az+.12);box(g,G.frame,-.06,.06,0,1.9,az+.24,az+.34);},
 bench(g){pad(g,X(0,.415,-.95),1.15,.29,.06,0);for(const z of [-1.45,-.45])box(g,G.frame,-.18,.18,0,.385,z-.03,z+.03);},
 mat(g){box(g,G.pad,-.35,.35,0,.012,-.8,.6);},
 matSide(g){box(g,G.pad,-1.0,1.0,0,.012,-.45,.55);},
};
const EQ_OF={remoApoyado:"prone",yRaise:"prone",inclDb:"incl",curlIncl:"curlIncl",pressHombro:"upright",jalonNeu:"jalon",hipThrust:"hipThrust",femoral:"femoral",talon:"talon",
 remoSentado:"remoSentado",bulgara:"bench",nordic:"mat",sidePlank:"matSide"};
const NO_TRACE=new Set(["granjero","talon","sidePlank","wallSit","nordic","lungeRev","bulgara","stepUp","martillo"]);
const BAL=new Set(["rdl","rdlDb","hexDL","kickRDL"]);
function propsFor(key){
  if(G.props[key]) return G.props[key];
  const g=new THREE.Group(),U={}; G.sc.add(g);
  if(EQ_OF[key]) EQUIP[EQ_OF[key]](g);
  if(key==="goblet"){const S=poseAt(key,1,1),h=S.T.H.y-.085*G.S,z=S.T.H.z-.02;box(g,G.pad,-.20,.20,0,h,z-.20,z+.20);}
  if(!NO_TRACE.has(key)){
    const tr=[];
    for(let i=0;i<=30;i++){const S=poseAt(key,i/30,1);const pts=S.trace?[S.trace]:S.bar?[S.bar]:S.hex?[S.hex]:S.neubar?[S.neubar]:S.handle?[S.handle.c]:S.pad?[S.pad]:S.dbs?S.dbs.map(d=>d.p):[];pts.forEach((p,j)=>{(tr[j]=tr[j]||[]).push(p.clone());});}
    U.traces=tr.map(pts=>{const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),G.guide);ln.computeLineDistances();g.add(ln);return ln;});
  }
  if(BAL.has(key)){
    let top=0,fz=0;for(let i=0;i<=10;i++){const S=poseAt(key,i/10,1);top=Math.max(top,S.load.y);fz=S.foot||0;}
    const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(fz,.004,DIM.MF),V3(fz,top+.25,DIM.MF)]),G.guideBal);ln.computeLineDistances();g.add(ln);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.035,.05,32),G.guideRing);ring.rotation.x=-Math.PI/2;ring.position.set(fz,.003,DIM.MF);g.add(ring);
  }
  const P={g,U,update(S){
    const m=G.m;
    if(S.bar){if(!U.bar){U.bar=barbell();g.add(U.bar);} U.bar.position.copy(S.bar);}
    if(S.hex){if(!U.hex){U.hex=hexBar();g.add(U.hex);} U.hex.position.copy(S.hex);}
    if(S.dbs){if(!U.dbs){U.dbs=S.dbs.map(d=>{const x=dumbbell(d.small);g.add(x);return x;});} S.dbs.forEach((d,i)=>{U.dbs[i].position.copy(d.p);U.dbs[i].quaternion.setFromUnitVectors(UPY,d.axis.clone().normalize());});}
    if(S.anc){if(!U.cable){U.cable=mk(new THREE.CylinderGeometry(.005,.005,1,8),G.cable);g.add(U.cable);
        if(S.tower){const top=Math.max(S.anc.y+.18,2.0);towerAt(g,S.tower,top);rod(g,G.frame,X(S.tower.x,S.anc.y,S.tower.z),S.anc,.015);}pulley(g,S.anc);}
      const from=S.cableAt?S.ank[0]:S.lines?S.lines[0][0]:S.handle?S.handle.c:(S.neubar||S.bar||S.palm[0].clone().add(S.palm[1]).multiplyScalar(.5));
      if(S.lines){U.cable.visible=false;} else between(U.cable,from,S.anc);}
    if(S.lines){if(!U.lines){U.lines=S.lines.map(()=>{const c=mk(new THREE.CylinderGeometry(.007,.007,1,8),G.rope);g.add(c);return c;});}S.lines.forEach((l,i)=>between(U.lines[i],l[0],l[1]));}
    if(S.handle){if(!U.handle){U.handle=mk(new THREE.CylinderGeometry(.016,.016,S.handle.len,14),G.steel);U.handle.rotation.z=Math.PI/2;g.add(U.handle);}U.handle.position.copy(S.handle.c);}
    if(S.neubar){if(!U.nb){U.nb=new THREE.Group();const b=mk(new THREE.CylinderGeometry(.014,.014,.56,14),G.steel);b.rotation.z=Math.PI/2;b.position.y=.05;U.nb.add(b);
        for(const s of [-1,1]){const h=mk(new THREE.CylinderGeometry(.016,.016,.13,12),G.steel);h.rotation.x=Math.PI/2;h.position.set(s*.20,0,0);U.nb.add(h);rod(U.nb,G.steel,X(s*.20,0,-.065),X(s*.20,.05,-.065),.01);rod(U.nb,G.steel,X(s*.20,0,.065),X(s*.20,.05,.065),.01);}
        g.add(U.nb);} U.nb.position.copy(S.neubar);}
    if(S.pad){if(!U.pad){U.pad=mk(new THREE.CylinderGeometry(.055,.055,.34,24),G.pad);U.pad.rotation.z=Math.PI/2;g.add(U.pad);U.lever=[-1,1].map(()=>{const r=mk(new THREE.CylinderGeometry(.016,.016,1,10),G.frame);g.add(r);return r;});}
      U.pad.position.copy(S.pad);U.lever.forEach((r,i)=>between(r,X(i?.24:-.24,S.pivot.y,S.pivot.z),X(i?.24:-.24,S.pad.y,S.pad.z)));}
    if(S.cuff){if(!U.cuff){U.cuff=mk(new THREE.TorusGeometry(.042,.013,10,24),G.pad);g.add(U.cuff);}const a=W(m.r_ankle),kk=W(m.r_knee);U.cuff.position.copy(a.clone().lerp(kk,.06));U.cuff.quaternion.setFromUnitVectors(V3(0,0,1),kk.sub(a).normalize());}
    if(S.grab&&!U.grab){U.grab=rod(g,G.steel,S.grab[0],S.grab[1],.016);for(const p of S.grab)rod(g,G.frame,p,X(p.x,p.y,S.tower.z),.015);}
    if(S.box&&!U.box){const b=S.box;U.box=box(g,G.pad,b.x[0],b.x[1],0,b.h,b.z[0],b.z[1]);}
    if(S.wall!=null&&!U.wall){U.wall=box(g,G.wall,-1.2,1.2,0,2.4,S.wall-.12,S.wall);}
    if(S.ball){if(!U.ball){U.ball=mk(new THREE.SphereGeometry(1,24,16),G.ball);g.add(U.ball);}const a=W(m.r_knee),b=W(m.l_knee),r=Math.max(.05,(a.distanceTo(b)-.09)/2);U.ball.position.copy(a.add(b).multiplyScalar(.5));U.ball.scale.setScalar(r);}
    if(S.roller&&!U.roller){U.roller=mk(new THREE.CylinderGeometry(.06,.06,.42,20),G.pad);U.roller.rotation.z=Math.PI/2;U.roller.position.copy(S.roller);g.add(U.roller);}
  }};
  G.props[key]=P; return P;
}
// ---------- pose de un instante de la repetición ----------
function poseAt(key,k,vel){
  G.scap=SCAP[key]?SCAP[key](k):[0,0];
  const S=POSE[key](k,vel||1);
  if(GRIPK[key]) S.grip=GRIPK[key](k);
  applyLimbs(S);
  if(S.after) S.after();
  S.k=k;
  return S;
}
// ---------- músculos: se colorea el segmento que trabaja ----------
const SEG={chest:["torso"],chestU:["torso"],abs:["torso"],back:["torso"],lats:["torso"],trap:["torso"],low:["torso"],deltF:["arm"],deltS:["arm"],deltR:["arm"],bi:["arm"],tri:["arm"],fore:["elbow"],quad:["leg"],ham:["leg"],add:["leg"],glute:["pelvis"],calf:["knee"]};
function paintMuscles(key,glow){
  const hi=new THREE.Color(dayColor());
  const segs=new Set();for(const mm of MUS[key]||[]) for(const s of SEG[mm]||[]) segs.add(s);
  const m=G.m, base={torso:BASE.torso,pelvis:BASE.torso,arm:BASE.limb,elbow:BASE.limb,leg:BASE.limb,knee:BASE.limb};
  for(const seg of ["torso","pelvis","arm","elbow","leg","knee"]){
    const c=new THREE.Color(base[seg]); if(segs.has(seg)) c.lerp(hi,.5+.5*glow);
    const hex="#"+c.getHexString();
    if(seg==="torso"||seg==="pelvis") m[seg].recolor(hex,BASE.joint);
    else {m["r_"+seg].recolor(hex,BASE.joint);m["l_"+seg].recolor(hex,BASE.joint);}
  }
}
// ---------- datos biomecánicos en vivo ----------
function measure(){
  const m=G.m, up=V3(0,1,0), ang=(a,b)=>a.angleTo(b)*57.2958;
  const H=W(m.r_leg), K=W(m.r_knee), A=W(m.r_ankle), Sh=W(m.r_arm), E=W(m.r_elbow), P=W(m.r_wrist,0,2.6,0);
  const Hc=H.clone().add(W(m.l_leg)).multiplyScalar(.5), Sc=Sh.clone().add(W(m.l_arm)).multiplyScalar(.5), u=W(m.neck).sub(Hc).normalize(), fa=P.clone().sub(E);
  const HL=W(m.l_leg), KL=W(m.l_knee);
  return {knee:ang(K.clone().sub(H),A.clone().sub(K)),hip:ang(K.clone().sub(H),u.clone().negate()),hipL:ang(KL.clone().sub(HL),u.clone().negate()),lean:ang(u,up),elbow:ang(E.clone().sub(Sh),fa),
    shoulder:ang(E.clone().sub(Sh),u.clone().negate()),forearm:Math.min(ang(fa,up),ang(fa,up.clone().negate())),shin:ang(K.clone().sub(A),up),uaVert:ang(E.clone().sub(Sh),up),
    abd:Math.atan2(-(K.x-H.x),H.y-K.y)*57.2958,H,K,A,Sh,E,P,Sc,u,KL,heel:W(m.r_ankle,-2,1,0)};
}
function legDist(b){const m=G.m;let d=9;const seg=(p,a,c)=>{const ab=c.clone().sub(a),t=Math.max(0,Math.min(1,p.clone().sub(a).dot(ab)/ab.lengthSq()));return p.distanceTo(a.clone().addScaledVector(ab,t));};
  for(const [h,k,a] of [[m.r_leg,m.r_knee,m.r_ankle],[m.l_leg,m.l_knee,m.l_ankle]]){const H=W(h),K=W(k),A=W(a),p=b.clone();p.x=K.x;d=Math.min(d,seg(p,H,K),seg(p,K,A));}return d;}
const LBL={knee:"Rodilla",hip:"Cadera",lean:"Tronco",elbow:"Codo",shoulder:"Brazo-tronco",uaVert:"Brazo",shin:"Tibia",abd:"Apertura"};
const fv=(M,S)=>S.k<.08?M.forearm<15:null;
const kneeTrack=M=>M.knee>35?Math.abs(M.K.x)>=Math.abs(M.A.x)-.03:null;
const elbFix=(M,S,R)=>R?M.E.distanceTo(R.E)<.045:null;
const HUD={
 remoApoyado:{a:["elbow"],c:[["Pecho pegado al banco",()=>true],["Codos van hacia la cadera",(M,S)=>S.k>.85?Math.abs(M.E.x)<DIM.SW+.14:null],["Mirada al piso, cuello alineado",()=>true]]},
 yRaise:{a:["shoulder"],c:[["Brazos en Y, en línea con el tronco",(M,S)=>S.k>.9?M.shoulder>135:null],["Hombros abajo, sin encoger",()=>true],["Mirada al piso",()=>true]]},
 inclDb:{a:["elbow","shoulder"],c:[["Antebrazos verticales abajo",fv],["Mancuernas se juntan arriba",()=>true],["Cabeza apoyada",()=>true]]},
 jalonNeu:{a:["elbow","lean"],c:[["Barra al pecho alto, por delante",(M,S)=>S.neubar.z>M.Sc.z],["Tronco casi erguido",M=>M.lean<25],["Mentón metido, sin estirar el cuello",()=>true]]},
 facePull:{a:["shoulder","elbow"],c:[["Codos a la altura de los hombros",(M,S)=>S.k>.8?Math.abs(M.E.y-M.Sh.y)<.08:null],["Manos junto a las orejas al final",(M,S)=>S.k>.9?M.P.y>M.Sh.y:null],["Tronco quieto",M=>M.lean<10]]},
 abdCable:{a:["abd","lean"],c:[["Tronco erguido, sin inclinarte",M=>M.lean<8],["Abre hasta 35-40°",(M,S)=>S.k>.9?(M.abd>30&&M.abd<45):null],["Pierna de apoyo firme",()=>true]]},
 latDb:{a:["shoulder","elbow"],c:[["Codo a la altura de la muñeca o arriba",(M,S)=>S.k>.5?M.E.y>=M.P.y-.03:null],["Hasta la altura del hombro",(M,S)=>S.k>.9?M.P.y<=M.Sh.y+.06:null]]},
 curlIncl:{a:["elbow"],c:[["Codo fijo detrás del tronco",elbFix],["Cabeza apoyada en el banco",()=>true]]},
 hipThrust:{a:["hip","knee"],c:[["Tibias verticales arriba",(M,S)=>S.k>.85?M.shin<14:null],["Cadera extendida completa",(M,S)=>S.k>.95?M.hip<15:null],["Mentón metido, mirada a las rodillas",()=>true]]},
 rdl:{a:["hip","knee","lean"],c:[["Barra sobre el pie",(M,S)=>Math.abs(S.load.z-DIM.MF)<.06],["Barra pegada a las piernas",(M,S)=>legDist(S.load)<.11],["Rodillas suaves, casi fijas",M=>M.knee<32]]},
 rdlDb:{a:["hip","knee","lean"],c:[["Mancuernas pegadas a las piernas",(M,S)=>legDist(S.load)<.12],["Rodillas suaves, casi fijas",M=>M.knee<32]]},
 kickRDL:{a:["hip","knee","lean"],c:[["Mancuernas pegadas a la pierna",(M,S)=>legDist(S.load)<.12],["Rodilla de adelante suave",M=>M.knee<32],["Cadera nivelada, sin girar",()=>true]]},
 talon:{a:["knee"],extra:M=>`Talón ${Math.max(0,(M.heel.y-.03)*100).toFixed(0)} cm`,c:[["Rodillas extendidas",M=>M.knee<10],["Rango completo: estira y sube",()=>true]]},
 lungeRev:{a:["knee","lean"],c:[["Rodilla de adelante sobre el pie",kneeTrack],["Tibia de adelante casi vertical",(M,S)=>S.k<.1?M.shin<20:null],["Rodilla de atrás a ~5 cm del piso",(M,S)=>S.k<.05?M.KL.y<.14:null]]},
 femoral:{a:["knee"],c:[["Rodilla alineada con el eje",()=>true],["3 s de ida, 3 s de regreso",()=>true]]},
 sidePlank:{a:[],extra:M=>`Cadera ${Math.round(M.hipL)}°`,c:[["Cadera arriba, cuerpo en línea",M=>M.hipL<15],["Codo bajo el hombro",()=>true],["Cabeza alineada",()=>true]]},
 pressHombro:{a:["elbow"],c:[["Antebrazos verticales abajo",fv],["Termina sobre los hombros",(M,S)=>S.k>.85?Math.abs(M.P.z-M.Sh.z)<.09:null],["Cabeza apoyada en el respaldo",()=>true]]},
 remoSentado:{a:["elbow","lean"],c:[["Tronco estable",M=>M.lean<18],["Codos pegados al final",(M,S)=>S.k>.8?Math.abs(M.E.x)<DIM.SW+.12:null]]},
 kickCable:{a:["hip","lean"],c:[["Tronco quieto e inclinado",M=>M.lean>30&&M.lean<50],["Extiende sin arquear la espalda",(M,S)=>S.k>.9?M.hip<15:null]]},
 overheadCable:{a:["elbow","uaVert"],c:[["Codos al frente y quietos",elbFix],["Extiende por completo",(M,S)=>S.k>.9?M.elbow<20:null],["Mentón metido",()=>true]]},
 martillo:{a:["elbow"],c:[["Codo fijo junto al cuerpo",elbFix]]},
 granjero:{a:["lean"],c:[["Tronco erguido",M=>M.lean<8],["Hombros abajo y atrás",()=>true]]},
 hexDL:{a:["knee","hip","lean"],c:[["Asas sobre el medio del pie",(M,S)=>Math.abs(S.load.z-DIM.MF)<.025],["Rodillas siguen la punta del pie",kneeTrack],["Mirada al piso a 2 m",()=>true]]},
 goblet:{a:["knee","hip","lean"],c:[["Rodillas siguen la punta del pie",kneeTrack],["Tronco erguido",M=>M.lean<30],["Rodilla a ~90° al tocar el cajón",(M,S)=>S.k>.95?(M.knee>80&&M.knee<100):null]]},
 bulgara:{a:["knee","lean"],c:[["Rodilla de adelante sobre el pie",kneeTrack],["Torso inclinado al frente",M=>M.lean>8],["Baja en 3 a 4 s",()=>true]]},
 wallSit:{a:["knee"],c:[["Rodillas a ~60°, no más",M=>M.knee>50&&M.knee<70],["Aprieta el balón suave",()=>true],["Espalda pegada a la pared",()=>true]]},
 stepUp:{a:["knee","lean"],c:[["Rodilla de arriba sobre el pie",kneeTrack],["Torso inclinado al frente al subir",(M,S)=>S.k<.3?M.lean>15:null],["Empuja con el talón de arriba",()=>true]]},
 nordic:{a:["lean"],c:[["Cuerpo recto de rodillas a cabeza",M=>M.hip<10],["Solo 20 a 30° de inclinación",(M,S)=>S.k>.9?(M.lean>15&&M.lean<32):null]]},
 pullThrough:{a:["hip","knee"],c:[["Cadera atrás, espalda recta",(M,S)=>S.k<.1?M.lean>35:null],["Arriba aprieta el glúteo",(M,S)=>S.k>.95?M.hip<12:null],["Brazos relajados",()=>true]]},
};
function hudHTML(it,S){
  const cfg=HUD[it.key], el=it.hudEl; if(!cfg||!el) return;
  if(it.hud===false){el.hidden=true;return;} el.hidden=false;
  const M=measure(), R=G.ref[it.key];
  const head=cfg.a.map(a=>`${LBL[a]} ${Math.round(M[a])}°`); if(cfg.extra) head.push(cfg.extra(M));
  if(!el.firstChild){el.innerHTML=`<div class="hh"></div>`+cfg.c.map(c=>`<div class="hc"><i aria-hidden="true"></i><span>${c[0]}</span></div>`).join("");}
  const h=head.join(" · "); if(el.firstChild.textContent!==h) el.firstChild.textContent=h;
  cfg.c.forEach((c,i)=>{const r=c[1](M,S,R), row=el.children[i+1], st=r===null?"na":r?"ok":"no"; if(row.dataset.s!==st){row.dataset.s=st;row.firstChild.textContent=r===null?"•":r?"✓":"✗";}});
}
// ---------- cámara y gestos ----------
const CAM={abdCable:{az:72,el:10},latDb:{az:62,el:10},yRaise:{az:-150,el:28},remoApoyado:{az:28,el:16},sidePlank:{az:88,el:22},kickCable:{az:-35,el:10},hipThrust:{az:35,el:22},
 nordic:{az:12,el:10},overheadCable:{az:35,el:10},facePull:{az:40,el:10},pullThrough:{az:30,el:10},wallSit:{az:50,el:10}};
function camDefault(key){return CAM[key]||{az:36,el:12};}
function boundsFor(key){
  const bx=new THREE.Box3();
  for(const k of [0,.5,1]){poseAt(key,k);G.m.updateMatrixWorld(true);bx.union(new THREE.Box3().setFromObject(G.m));}
  bx.expandByScalar(.12); const c=bx.getCenter(new THREE.Vector3()); const r=bx.getSize(new THREE.Vector3()).length()/2;
  return {c,r};
}
function setCam(v){const t=v.target,d=v.dist,a=rad(v.az),e=rad(v.el);G.cam.position.set(t.x-d*Math.cos(a)*Math.cos(e),t.y+d*Math.sin(e),t.z+d*Math.sin(a)*Math.cos(e));G.cam.lookAt(t);}
function bindGestures(cv,it){
  const pts=new Map(); let pinch0=null, mid0=null, lastTap=0;
  const reset=()=>Object.assign(it.v,camDefault(it.key),{dist:it.v.d0});
  cv.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse")cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);});
  cv.addEventListener("pointermove",e=>{if(!pts.has(e.pointerId))return;const p=pts.get(e.pointerId),dx=e.clientX-p[0],dy=e.clientY-p[1];pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size===1){it.v.az+=dx*.55; if(e.pointerType==="mouse") it.v.el=Math.max(-8,Math.min(80,it.v.el+dy*.4));}
    else if(pts.size===2){const [a,b]=[...pts.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]), my=(a[1]+b[1])/2;
      if(pinch0){it.v.dist=Math.max(it.v.d0*.45,Math.min(it.v.d0*1.8,it.v.dist*pinch0/d));it.v.el=Math.max(-8,Math.min(80,it.v.el+(my-mid0)*.4));}pinch0=d;mid0=my;}});
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2){pinch0=null;mid0=null;}};
  cv.addEventListener("pointerup",e=>{if(e.pointerType!=="mouse"){const t=performance.now();if(t-lastTap<320){reset();lastTap=0;}else lastTap=t;}up(e);});
  cv.addEventListener("pointercancel",up);
  cv.addEventListener("wheel",e=>{e.preventDefault();it.v.dist=Math.max(it.v.d0*.45,Math.min(it.v.d0*1.8,it.v.dist*(1+e.deltaY*.0012)));},{passive:false});
  cv.addEventListener("dblclick",reset);
}
function render3(it,P){
  propsFor(it.key);
  if(!G.ref[it.key]){poseAt(it.key,0,1);G.ref[it.key]={E:W(G.m.r_elbow)};}
  const S=poseAt(it.key,P.k,P.vel);
  paintMuscles(it.key,P.glow);
  for(const k in G.props) G.props[k].g.visible=false;
  const pr=propsFor(it.key); pr.g.visible=true; pr.update(S);
  const dc=dayColor(); G.plate.color.set(dc); G.guide.color.set(dc); G.guideRing.color.set(dc);
  const N=it.ctx.canvas.width; if(G.r.domElement.width!==N) G.r.setSize(N,N,false);
  setCam(it.v); G.r.render(G.sc,G.cam);
  it.ctx.clearRect(0,0,N,N); it.ctx.drawImage(G.r.domElement,0,0);
  hudHTML(it,S);
}
