// ---------- ejercicios de Zuly: cada pose sale de la técnica y de restricciones físicas ----------
const X=(x,y,z)=>V3(x,y,z);
const SY=()=>DIM.AH+DIM.LT+DIM.LS-.006;            // altura de cadera de pie
const legD=f=>Math.sqrt(DIM.LT**2+DIM.LS**2+2*DIM.LT*DIM.LS*Math.cos(f)); // cadera-tobillo con la rodilla flexionada f
const feet=(w,z=0)=>[X(-w,DIM.AH,z),X(w,DIM.AH,z)];
const hangPalm=(T,s,dx=.04,dz=.0)=>T.sh[s].clone().add(X(s?dx:-dx,-(DIM.LA-.03),dz));
function clampReach(root,p,L){const v=p.clone().sub(root);if(v.length()>L)return root.clone().addScaledVector(v.normalize(),L);return p;}
function circ2(A,B,r1,r2){ // intersección superior de dos círculos en el plano y-z (A,B: [y,z])
  const dy=B[0]-A[0],dz=B[1]-A[1],d=Math.hypot(dy,dz),a=(r1*r1-r2*r2+d*d)/(2*d),h=Math.sqrt(Math.max(0,r1*r1-a*a));
  const my=A[0]+a*dy/d,mz=A[1]+a*dz/d, c1=[my+h*dz/d,mz-h*dy/d], c2=[my-h*dz/d,mz+h*dy/d];
  return c1[0]>c2[0]?c1:c2;}
// la carga baja rozando el frente de la pierna (tibia o muslo), colgando de brazos rectos
function legFront(Sc,LAe,hip,knee,bz0){
  let bz=bz0,by=0; const ank=X(0,DIM.AH,0);
  for(let i=0;i<5;i++){const dz=Sc.z-bz; by=Sc.y-Math.sqrt(Math.max(.01,LAe*LAe-dz*dz));
    const seg=by<knee.y?[ank,knee]:[knee,hip], t=Math.max(0,Math.min(1,(by-seg[0].y)/(seg[1].y-seg[0].y))), lz=lerp(seg[0].z,seg[1].z,t);
    bz=Math.max(lz+(by<knee.y?.065:.085),bz0-.02);}
  return {by,bz};
}
const PRONE={al:45,P0:()=>X(0,.70,-.30)};
function proneTorso(){
  const al=rad(PRONE.al), d=X(0,Math.sin(al),Math.cos(al)), n=X(0,Math.cos(al),-Math.sin(al));
  const hip=PRONE.P0().addScaledVector(d,.03).addScaledVector(n,.10*G.S);
  const T=placeTorso(hip,90-PRONE.al,0,0);
  const fy=DIM.AH+.085, dy=hip.y-fy, L=DIM.LT+DIM.LS-.03, fz=hip.z-Math.sqrt(Math.max(.01,L*L-dy*dy));
  return {T,ank:[X(-.11,fy,fz),X(.11,fy,fz)],sole:[X(0,-.65,-.76),X(0,-.65,-.76)],kneePole:[X(-.1,0,1),X(.1,0,1)]};
}
const EX={
 remoApoyado(k){ // remo con pecho apoyado: brazos cuelgan a los lados del cojín y los codos van hacia la cadera
  const B=proneTorso(), T=B.T, w=DIM.SW+.05;
  const p0=[0,1].map(s=>T.sh[s].clone().add(X(s?.05:-.05,-(DIM.LA-.03),.02)));
  const p1=[0,1].map(s=>T.lm(-.21,.03,s?w+.02:-(w+.02)));
  const palm=[0,1].map(s=>arc(T.sh[s],p0[s],p1[s],k));
  return Object.assign(B,{palm,dbs:palm.map(p=>({p,axis:T.u.clone()})),elbPole:[X(-.35,1,-.5),X(.35,1,-.5)],grip:"neu"});
 },
 yRaise(k){ // elevación en Y boca abajo: de colgar a la línea del tronco, 30° hacia afuera
  const B=proneTorso(), T=B.T, L=DIM.LA-.008;
  const p0=[0,1].map(s=>T.sh[s].clone().add(X(s?.05:-.05,-L,.02)));
  const p1=[0,1].map(s=>{const d=T.u.clone().multiplyScalar(Math.cos(rad(30))).add(X((s?1:-1)*Math.sin(rad(30)),0,0)).normalize();return T.sh[s].clone().addScaledVector(d,L);});
  const palm=[0,1].map(s=>arc(T.sh[s],p0[s],p1[s],k));
  return Object.assign(B,{palm,dbs:palm.map(p=>({p,axis:X(0,0,1),small:1})),elbPole:[X(-.4,.6,0),X(.4,.6,0)],grip:"neu",trace:palm[0]});
 },
 inclDb(k){ // press inclinado 30° con mancuernas
  const T=placeTorso(X(0,.45+.105*G.S,.03),-60,-4);
  const ank=[X(-.24,DIM.AH,.03+DIM.LT+.04),X(.24,DIM.AH,.03+DIM.LT+.04)], kp=[X(-.3,1,.2),X(.3,1,.2)];
  const p0=[0,1].map(s=>{const d=X(s?.8:-.8,0,0).addScaledVector(T.f,-.45).addScaledVector(T.u,-.35).normalize();return T.sh[s].clone().addScaledVector(d,DIM.UA).add(X(0,DIM.FA+.04,0));});
  const p1=[X(-.10,T.Sc.y+DIM.LA-.07,T.Sc.z+.03),X(.10,T.Sc.y+DIM.LA-.07,T.Sc.z+.03)];
  const palm=[0,1].map(s=>{const q=p0[s].clone().lerp(p1[s],k);q.x=lerp(p0[s].x,p1[s].x,eio(k));return q;});
  return {T,palm,gd:.04,dbs:palm.map(p=>({p,axis:X(1,0,0)})),elbPole:[X(-.7,-.6,.25),X(.7,-.6,.25)],ank,kneePole:kp,grip:"pro"};
 },
 jalonNeu(k){ // jalón con manerales neutros al ancho de hombros: barra al pecho alto, cuello neutro
  const hy=.485+.10*G.S, g=.20;
  const T0=placeTorso(X(0,hy,0),-6,0,0), top=X(0,T0.Sc.y+Math.sqrt((DIM.LA-.01)**2-(g-DIM.SW)**2)-.02,T0.Sc.z+.05);
  const T1=placeTorso(X(0,hy,0),-16,-5,0), bot=T1.lm(-.04,.13*G.S);
  const T=placeTorso(X(0,hy,0),lerp(-6,-16,k),lerp(0,-5,k),0);
  const bar=top.clone().lerp(bot,eio(k));
  return {T,neubar:bar,anc:X(0,2.3,top.z),palm:[X(-g,bar.y,bar.z),X(g,bar.y,bar.z)],elbPole:[X(-.4,-1,.15),X(.4,-1,.15)],ank:feet(.17,DIM.LT+.03),kneePole:[X(-.2,1,.3),X(.2,1,.3)],grip:"neu"};
 },
 facePull(k){ // face pull: codos altos y abiertos, manos terminan junto a las orejas
  const T=placeTorso(X(0,SY(),0),-4,0,0), anc=X(0,T.Sc.y+.15,1.0), elb=[],palm=[];
  for(const s of [0,1]){const sg=s?1:-1, sh=T.sh[s], toA=anc.clone().sub(sh).normalize();
    const dE0=toA.clone().add(X(sg*.06,-.06,0)).normalize(), dF0=toA.clone().add(X(-sg*.10,.03,0)).normalize();
    const dE1=X(sg*.92,0,-.22).normalize(), dF1=X(-sg*.15,1,.22).normalize();
    const E=sh.clone().addScaledVector(slerpDir(dE0,dE1,k),DIM.UA); elb.push(E); palm.push(E.clone().addScaledVector(slerpDir(dF0,dF1,k),DIM.FA+.04));}
  const J=palm[0].clone().add(palm[1]).multiplyScalar(.5).add(X(0,0,.10));
  return {T,elb,palm,gd:.04,anc,tower:X(0,0,anc.z+.12),lines:[[J,anc],[J,palm[0]],[J,palm[1]]],trace:J,ank:feet(.10),grip:"neu"};
 },
 abdCable(k){ // abducción de pie: pierna de afuera casi recta, tronco erguido, se sujeta de la torre
  const hipC=X(.02,SY(),0), T=placeTorso(hipC,0,0,0), Hr=T.hip[0], L=DIM.LT+DIM.LS-.008, th=rad(lerp(-8,38,k));
  const ankR=Hr.clone().add(X(-Math.sin(th)*L,-Math.cos(th)*L,lerp(.08,.03,k))), ankL=X(T.hip[1].x,DIM.AH,0);
  const sole=ankR.clone().sub(Hr).normalize();
  return {T,ank:[ankR,ankL],sole:[sole,X(0,-1,0)],kneePole:[X(0,0,1),X(0,0,1)],
    palm:[X(-(DIM.HW+.10),hipC.y+.07,.06),X(.50,T.Sc.y-.26,0)],elbPole:[X(-.6,0,-1),X(.4,-.7,-.3)],
    anc:X(.55,.12,.12),tower:X(.64,0,.12),cableAt:ankR,cuff:1,trace:ankR,grip:"neu",fingers:60};
 },
 latDb(k){ // elevación lateral en el plano escapular
  const T=placeTorso(X(0,SY(),-.02),7), sh=T.sh, L=DIM.LA-.035;
  const p0=[sh[0].clone().add(X(-.05,-L,.08)),sh[1].clone().add(X(.05,-L,.08))];
  const dir=(s,ab)=>X((s?1:-1)*Math.sin(rad(ab))*Math.cos(rad(25)),-Math.cos(rad(ab)),Math.sin(rad(ab))*Math.sin(rad(25))+.05);
  const p1=[sh[0].clone().addScaledVector(dir(0,86),L),sh[1].clone().addScaledVector(dir(1,86),L)];
  const palm=[0,1].map(s=>arc(sh[s],p0[s],p1[s],k)), ep=V3(.5,lerp(-.1,.9,k),-.6);
  return {T,palm,dbs:palm.map(p=>({p,axis:X(0,0,1)})),elbPole:[X(-ep.x,ep.y,ep.z),ep],ank:feet(.13)};
 },
 curlIncl(k){ // curl en banco a 45°: brazos cuelgan detrás del tronco
  const T=placeTorso(X(0,.45+.105*G.S,.03),-45,-3);
  const elb=[T.sh[0].clone().add(X(-.03,-(DIM.UA-.006),-.01)),T.sh[1].clone().add(X(.03,-(DIM.UA-.006),-.01))];
  const fl=rad(lerp(3,128,k)), d=X(0,-Math.cos(fl),Math.sin(fl));
  const palm=[elb[0].clone().addScaledVector(d,DIM.FA+DIM.PALM),elb[1].clone().addScaledVector(d,DIM.FA+DIM.PALM)];
  return {T,elb,palm,dbs:palm.map(p=>({p,axis:X(1,0,0)})),ank:feet(.23,.03+DIM.LT+.10),kneePole:[X(-.3,1,.2),X(.3,1,.2)],grip:"sup"};
 },
 hipThrust(k){ // hip thrust: espalda alta en el borde del banco; tibias verticales arriba
  const S=G.S, edge=X(0,.44,0), hipOf=a=>{const u=X(0,Math.cos(rad(a)),Math.sin(rad(a))),f=X(0,-u.z,u.y);return edge.clone().addScaledVector(u,-.45*S).addScaledVector(f,.10*S);};
  if(G.htZ==null){const h1=hipOf(-82), dy=h1.y-(DIM.AH+DIM.LS); G.htZ=h1.z+Math.sqrt(Math.max(0,DIM.LT**2-dy*dy));}
  const a=lerp(-55,-82,k), T=placeTorso(hipOf(a),a,lerp(0,6,k),lerp(15,35,k));
  const bar=T.H.clone().addScaledVector(T.f,.14*S).addScaledVector(T.u,.02);
  return {T,bar,gd:.04,palm:[X(-.30,bar.y,bar.z),X(.30,bar.y,bar.z)],elbPole:[X(-.4,-.6,-.6),X(.4,-.6,-.6)],ank:feet(.15,G.htZ),kneePole:[X(-.15,1,.3),X(.15,1,.3)],grip:"pro"};
 },
 rdl(k,db){ // rumano: tibias casi verticales, cadera atrás, la barra baja pegada a las piernas sobre el pie
  const sA=rad(lerp(3,0,k)), tA=rad(lerp(27,2,eio(k))), a=lerp(70,2,eio(k)), bz=lerp(.06,.10,k);
  const hip=X(0,DIM.AH+DIM.LS*Math.cos(sA)+DIM.LT*Math.cos(tA),DIM.LS*Math.sin(sA)-DIM.LT*Math.sin(tA));
  const T=placeTorso(hip,a,0,0), g=db?.15:.22, LAe=Math.sqrt((DIM.LA-.006)**2-(g-DIM.SW)**2);
  const knee=X(0,DIM.AH+DIM.LS*Math.cos(sA),DIM.LS*Math.sin(sA)), {by,bz:bzz}=legFront(T.Sc,LAe,hip,knee,bz), b=X(0,by,bzz);
  const out={T,palm:[X(-g,by,bzz),X(g,by,bzz)],elbPole:[X(-.2,0,-1),X(.2,0,-1)],ank:feet(.11),kneePole:[X(-.2,0,1),X(.2,0,1)],grip:"pro",load:b};
  if(db) out.dbs=out.palm.map(p=>({p:p.clone(),axis:X(1,0,0)})); else out.bar=b;
  return out;
 },
 kickRDL(k){ // rumano a una pierna con apoyo: la pierna de adelante carga, el pie de atrás solo equilibra
  const sA=rad(lerp(3,0,k)), tA=rad(lerp(25,2,eio(k))), a=lerp(66,2,eio(k)), bz=lerp(.06,.10,k);
  const hipR=X(-.10,DIM.AH+DIM.LS*Math.cos(sA)+DIM.LT*Math.cos(tA),DIM.LS*Math.sin(sA)-DIM.LT*Math.sin(tA));
  const T=placeTorso(hipR.clone().add(X(DIM.HW,0,0)),a,0,0), g=.14, LAe=Math.sqrt((DIM.LA-.006)**2-(g-DIM.SW)**2);
  const knee=X(0,DIM.AH+DIM.LS*Math.cos(sA),DIM.LS*Math.sin(sA)), {by,bz:bzz}=legFront(T.Sc,LAe,X(0,hipR.y,hipR.z),knee,bz), palm=[X(-g,by,bzz),X(g,by,bzz)];
  return {T,palm,dbs:palm.map(p=>({p:p.clone(),axis:X(1,0,0)})),elbPole:[X(-.2,0,-1),X(.2,0,-1)],ank:[X(-.10,DIM.AH,0),X(.10,DIM.AH+.075,-.17)],sole:[X(0,-1,0),X(0,-.7,-.7)],kneePole:[X(-.2,0,1),X(.1,-.2,1)],grip:"pro",load:X(0,by,bzz),foot:-.10};
 },
 talon(k){ // elevación de talones: antepié sobre el disco
  const p=rad(lerp(-12,32,k)), fa=DIM.AH, fb=.12*G.S, B=[X(-.11,.03,.12),X(.11,.03,.12)];
  const ank=B.map(b=>b.clone().add(X(0,fa*Math.cos(p)+fb*Math.sin(p),-fb*Math.cos(p)+fa*Math.sin(p))));
  const am=ank[0].clone().add(ank[1]).multiplyScalar(.5);
  const T=placeTorso(X(0,am.y+Math.sqrt((DIM.LT+DIM.LS)**2-.03**2)-.0015,am.z+.03),2), sole=X(0,-Math.cos(p),-Math.sin(p));
  const palm=[hangPalm(T,0,.07,.02),hangPalm(T,1,.07,.02)];
  return {T,ank,sole:[sole,sole],palm,dbs:palm.map(q=>({p:q,axis:X(0,0,1)})),kneePole:[X(-.2,0,1),X(.2,0,1)],grip:"neu"};
 },
 lungeRev(k){ // zancada inversa: abajo la rodilla de atrás a ~5 cm del piso; arriba pies juntos
  const Af=X(-.10,DIM.AH,.26);
  const Kf0=Af.clone().add(X(0,DIM.LS*Math.cos(rad(8)),DIM.LS*Math.sin(rad(8))));
  const H0=X(0,Kf0.y+DIM.LT*Math.sin(rad(8)),Kf0.z-DIM.LT*Math.cos(rad(8)));
  const Kb0=H0.clone().add(X(DIM.HW,-DIM.LT*Math.cos(rad(10)),-DIM.LT*Math.sin(rad(10))));
  const Ab0=Kb0.clone().add(X(0,DIM.LS*Math.sin(rad(11)),-DIM.LS*Math.cos(rad(11)))), Ab1=X(.10,DIM.AH,Af.z);
  const H1=X(0,SY(),Af.z-.02), H=X(0,lerp(H0.y,H1.y,eio(k)),lerp(H0.z,H1.z,smooth01(0,.85,k)));
  const T=placeTorso(H,lerp(16,4,eio(k)),0,0), t=smooth01(.3,.95,k);
  let Ab=Ab0.clone().lerp(Ab1,t); Ab.y+=.07*Math.sin(Math.PI*t); Ab=clampReach(T.hip[1],Ab,DIM.LT+DIM.LS-.012);
  const palm=[hangPalm(T,0),hangPalm(T,1)];
  return {T,ank:[Af,Ab],sole:[X(0,-1,0),slerpDir(X(0,-.5,-.87).normalize(),X(0,-1,0),t)],kneePole:[X(-.25,0,1),X(.1,-.2,1)],palm,dbs:palm.map(p=>({p,axis:X(0,0,1)})),grip:"neu",leadKnee:"r"};
 },
 femoral(k){ // curl femoral sentado: muslo fijo, la rodilla gira alrededor del eje de la máquina
  const H=X(0,.50+.10*G.S,-.02), T=placeTorso(H,-12);
  const fl=rad(lerp(15,108,k)), d=X(0,-Math.sin(fl),Math.cos(fl)), post=X(0,-Math.cos(fl),-Math.sin(fl));
  const kn=[X(-.10,H.y,H.z+DIM.LT),X(.10,H.y,H.z+DIM.LT)], ank=kn.map(q=>q.clone().addScaledVector(d,DIM.LS));
  return {T,ank,sole:[d.clone(),d.clone()],pad:ank[0].clone().add(ank[1]).multiplyScalar(.5).addScaledVector(d,-.05).addScaledVector(post,.06),pivot:X(0,H.y,H.z+DIM.LT),
    palm:[X(-.25,H.y+.02,.06),X(.25,H.y+.02,.06)],elbPole:[X(-.5,0,-1),X(.5,0,-1)],kneePole:[X(-.1,1,.3),X(.1,1,.3)],fingers:60};
 },
 sidePlank(k){ // plancha lateral sobre rodillas: se arma de pie y se gira para apoyar antebrazo y rodilla izquierdos
  const T=placeTorso(X(0,1.0,0),0,0,0), th=rad(lerp(0,35,k));
  const kL=T.hip[1].clone().add(X(0,-DIM.LT,0));
  const kR=T.hip[0].clone().add(X(-Math.sin(th)*DIM.LT,-Math.cos(th)*DIM.LT,0)), aR=kR.clone().add(X(0,0,-DIM.LS));
  const shL=T.sh[1], ex=.02;
  let lo=0,hi=40;for(let i=0;i<30;i++){const ph=(lo+hi)/2,up=X(-Math.cos(rad(ph)),Math.sin(rad(ph)),0);const v=shL.clone().sub(kL).dot(up)-DIM.UA-ex;if(v>0)hi=ph;else lo=ph;}
  const ph=(lo+hi)/2, up=X(-Math.cos(rad(ph)),Math.sin(rad(ph)),0), down=up.clone().negate(), aL=kL.clone().add(X(0,0,-DIM.LS)).addScaledVector(up,.06);
  const eL=shL.clone().addScaledVector(down,DIM.UA), pL=eL.clone().add(X(0,0,DIM.FA+DIM.PALM));
  const pR=T.hip[0].clone().addScaledVector(up,.11).add(X(0,0,.04)), eR=ik2(T.sh[0],pR,DIM.UA,DIM.FA+DIM.PALM,X(.2,-.2,-1));
  const mid=T.hip[0].clone().add(aR).multiplyScalar(.5);
  return {T,ank:[aR,aL],sole:[X(0,.3,-1),X(0,.3,-1)],kneePole:[kR.clone().sub(mid),X(0,0,1)],palm:[pR,pL],elb:[eR,eL],fingers:30,
    after(){const m=G.m;m.rotation.z=-rad(90-ph);m.updateMatrixWorld(true);const kw=W(m.l_knee),hc=W(m.r_leg).add(W(m.l_leg)).multiplyScalar(.5);
      m.position.y+=.055-kw.y; m.position.x-=hc.x; m.updateMatrixWorld(true);}};
 },
 pressHombro(k){ // press de hombro sentada con respaldo: antebrazos verticales abajo
  const T=placeTorso(X(0,.46+.10*G.S,-.03),-6,0,0);
  const p0=[0,1].map(s=>T.sh[s].clone().addScaledVector(X(s?.85:-.85,-.45,.15).normalize(),DIM.UA).add(X(0,DIM.FA+.04,0)));
  const p1=[X(-.13,T.Sc.y+DIM.LA-.06,T.Sc.z+.03),X(.13,T.Sc.y+DIM.LA-.06,T.Sc.z+.03)];
  const palm=[0,1].map(s=>{const q=p0[s].clone().lerp(p1[s],k);q.x=lerp(p0[s].x,p1[s].x,smooth01(.2,1,k));return q;});
  return {T,palm,gd:.04,dbs:palm.map(p=>({p,axis:X(1,0,0)})),elbPole:[X(-.5,-1,.25),X(.5,-1,.25)],ank:feet(.22,-.03+DIM.LT+.04),kneePole:[X(-.3,1,.2),X(.3,1,.2)],grip:"pro"};
 },
 remoSentado(k){ // remo sentado: leve inclinación al estirar, termina erguida con el maneral en el abdomen alto
  const hy=.42+.10*G.S, aOf=k=>lerp(14,-4,eio(k));
  const T0=placeTorso(X(0,hy,0),14), p0=X(0,T0.Sc.y-.11*G.S,T0.Sc.z+DIM.LA-.07);
  const T1=placeTorso(X(0,hy,0),-4), p1=T1.lm(-.30*G.S,.14*G.S);
  const T=placeTorso(X(0,hy,0),aOf(k)), c=p0.clone().lerp(p1,eio(k)), palm=[c.clone().add(X(-.04,0,0)),c.clone().add(X(.04,0,0))];
  const az=(DIM.LT+DIM.LS)*.92, sole=X(0,-.3,.95).normalize();
  return {T,palm,handle:{c,len:.12},anc:X(0,.45,az+.22),elbPole:[X(-.25,-.35,-1),X(.25,-.35,-1)],ank:[X(-.12,.34,az),X(.12,.34,az)],sole:[sole,sole],kneePole:[X(-.2,1,.2),X(.2,1,.2)],grip:"neu",fz:az};
 },
 kickCable(k){ // patada en polea: tronco inclinado y quieto, la cadera extiende sin arquear la espalda
  const d=legD(rad(15)), T=placeTorso(X(-.02,DIM.AH+d*.995,-.03),40,0,0), Hr=T.hip[0];
  const t=rad(lerp(18,-32,k)), ts=t-rad(lerp(30,15,k)+12*Math.sin(Math.PI*k));
  const kn=Hr.clone().add(X(0,-Math.cos(t)*DIM.LT,Math.sin(t)*DIM.LT)), ank=kn.clone().add(X(0,-Math.cos(ts)*DIM.LS,Math.sin(ts)*DIM.LS));
  const pole=kn.clone().sub(Hr.clone().add(ank).multiplyScalar(.5)), tz=.80;
  return {T,ank:[ank,X(.08,DIM.AH,0)],kneePole:[pole,X(0,0,1)],sole:[ank.clone().sub(kn).normalize(),X(0,-1,0)],
    palm:[X(-.20,1.0,tz-.05),X(.20,1.0,tz-.05)],elbPole:[X(-.5,-1,0),X(.5,-1,0)],grip:"pro",
    anc:X(-.10,.12,tz-.05),tower:X(0,0,tz+.07),cableAt:ank,cuff:1,trace:ank,grab:[X(-.32,1.0,tz-.05),X(.32,1.0,tz-.05)]};
 },
 overheadCable(k){ // extensión sobre la cabeza en polea: codos al frente y quietos, solo se mueve el antebrazo
  const T=placeTorso(X(0,SY()-.02,.02),22,0,0), bu=60, bf=rad(lerp(-80,52,k)), elb=[],palm=[];
  for(const s of [0,1]){const sg=s?1:-1, dE=X(sg*.12,Math.cos(rad(bu)),Math.sin(rad(bu))).normalize();
    const E=T.sh[s].clone().addScaledVector(dE,DIM.UA); elb.push(E);
    palm.push(E.clone().addScaledVector(X(-sg*.05,Math.cos(bf),Math.sin(bf)).normalize(),DIM.FA+.04));}
  const J=palm[0].clone().add(palm[1]).multiplyScalar(.5).add(X(0,-Math.cos(bf)*.07,-Math.sin(bf)*.07)), anc=X(0,1.55,-.78);
  return {T,elb,palm,gd:.04,ank:[X(-.10,DIM.AH,.24),X(.10,DIM.AH,-.20)],kneePole:[X(-.1,0,1),X(.1,0,1)],anc,tower:X(0,0,-.90),lines:[[J,anc],[J,palm[0]],[J,palm[1]]],trace:J,grip:"neu"};
 },
 martillo(k){ // curl martillo: codos fijos al costado
  const T=placeTorso(X(0,SY(),-.01),2);
  const elb=[T.sh[0].clone().add(X(-.03,-(DIM.UA-.006),.02+.03*k)),T.sh[1].clone().add(X(.03,-(DIM.UA-.006),.02+.03*k))];
  const fl=rad(lerp(4,135,k)), d=X(0,-Math.cos(fl),Math.sin(fl)), gx=DIM.SW+.04;
  const palm=[0,1].map(s=>{const t=elb[s].clone().addScaledVector(d,.36).setX(s?gx:-gx);return elb[s].clone().addScaledVector(t.sub(elb[s]).normalize(),DIM.FA+DIM.PALM);});
  return {T,elb,palm,ank:feet(.12),dbs:palm.map(p=>({p,axis:new THREE.Vector3().crossVectors(d,X(1,0,0)).normalize()})),grip:"neu"};
 },
 granjero(k,vel){ // paseo del granjero: paso alterno
  const zR=lerp(.19,-.19,k), lift=Math.sin(Math.PI*k)*.06, swingL=vel>=0;
  const ank=[X(-.10,DIM.AH+(swingL?0:lift),zR),X(.10,DIM.AH+(swingL?lift:0),-zR)];
  const T=placeTorso(X(0,SY()-.04+.02*Math.sin(Math.PI*k),0),3), palm=[hangPalm(T,0,.06,.02),hangPalm(T,1,.06,.02)];
  return {T,ank,palm,dbs:palm.map(p=>({p,axis:X(0,0,1)})),kneePole:[X(-.1,0,1),X(.1,0,1)],grip:"neu"};
 },
 hexDL(k){ // barra hexagonal: manos a los lados sobre el medio del pie, cadera y hombros suben juntos
  const g=.25, LAe=Math.sqrt((DIM.LA-.005)**2-(g-DIM.SW)**2);
  const solve=(f,a)=>{const d=legD(rad(f)), hz=DIM.MF-DIM.TL*Math.sin(rad(a)), hy=DIM.AH+Math.sqrt(Math.max(.01,d*d-hz*hz));return {hy,hz,hh:hy+DIM.TL*Math.cos(rad(a))-LAe};};
  if(G.hexF0==null){let lo=40,hi=120;for(let i=0;i<30;i++){const m=(lo+hi)/2;if(solve(m,46).hh>.285)lo=m;else hi=m;}G.hexF0=(lo+hi)/2;}
  const f=lerp(G.hexF0,3,k), a=lerp(46,2,k), r=solve(f,a), T=placeTorso(X(0,r.hy,r.hz),a,0,0), hh=T.Sc.y-LAe;
  return {T,hex:X(0,hh-.06,DIM.MF),palm:[X(-g,hh,DIM.MF),X(g,hh,DIM.MF)],elbPole:[X(-.3,0,-1),X(.3,0,-1)],ank:feet(.12),kneePole:[X(-.35,0,1),X(.35,0,1)],grip:"neu",load:X(0,hh,DIM.MF)};
 },
 goblet(k){ // sentadilla goblet a cajón: rodilla hasta ~90°, mancuerna pegada al pecho
  const s=rad(lerp(4,26,k)), ft=rad(lerp(-2,66,k)), ky=DIM.AH+DIM.LS*Math.cos(s), kz=DIM.LS*Math.sin(s);
  const T=placeTorso(X(0,ky+DIM.LT*Math.cos(ft),kz-DIM.LT*Math.sin(ft)),lerp(2,24,k),0,0);
  const db=T.Sc.clone().addScaledVector(T.u,-.16*G.S).addScaledVector(T.f,.17*G.S), top=db.clone().addScaledVector(T.u,.06);
  return {T,palm:[top.clone().add(X(-.045,0,0)),top.clone().add(X(.045,0,0))],gd:.03,dbs:[{p:db,axis:T.u.clone()}],elbPole:[X(-.4,-1,.3),X(.4,-1,.3)],ank:feet(.16),kneePole:[X(-.45,0,1),X(.45,0,1)],grip:T.u.clone()};
 },
 bulgara(k){ // búlgara: empeine atrás sobre el banco, torso inclinado para cargar glúteo
  const Af=X(-.10,DIM.AH,.30), Ab=X(.10,.49,-.42);
  const Kf0=Af.clone().add(X(0,DIM.LS*Math.cos(rad(10)),DIM.LS*Math.sin(rad(10))));
  const H0=X(0,Kf0.y+DIM.LT*Math.sin(rad(8)),Kf0.z-DIM.LT*Math.cos(rad(8)));
  const c=circ2([Af.y,Af.z],[Ab.y,Ab.z],legD(rad(12)),DIM.LT+DIM.LS-.03), H1=X(0,c[0],c[1]);
  const T=placeTorso(H0.clone().lerp(H1,eio(k)),lerp(26,14,k),0,0), palm=[hangPalm(T,0),hangPalm(T,1)];
  return {T,ank:[Af,Ab],sole:[X(0,-1,0),X(0,.7,-.7)],kneePole:[X(-.3,0,1),X(.1,-1,.3)],palm,dbs:palm.map(p=>({p,axis:X(0,0,1)})),grip:"neu",leadKnee:"r"};
 },
 wallSit(k){ // sentadilla isométrica en pared con balón entre las rodillas
  const s=rad(15), t=rad(45), ky=DIM.AH+DIM.LS*Math.cos(s), kz=DIM.LS*Math.sin(s);
  const H=X(0,ky+DIM.LT*Math.cos(t),kz-DIM.LT*Math.sin(t)), T=placeTorso(H,-1,0,0), sq=.12*k;
  return {T,ank:feet(.14),kneePole:[X(-.30+sq,0,1),X(.30-sq,0,1)],palm:[hangPalm(T,0,.10,-.03),hangPalm(T,1,.10,-.03)],wall:H.z-.135*G.S,ball:1,fingers:25};
 },
 stepUp(k){ // subida a cajón: empuja con el talón de arriba y termina de pie sobre el cajón
  const bx=.45, Ar=X(-.10,bx+DIM.AH,.36), d0=legD(rad(100)), y0=DIM.AH+(DIM.LT+DIM.LS)*.965, dy=y0-Ar.y;
  const H0=X(0,y0,Ar.z-Math.sqrt(Math.max(.01,d0*d0-dy*dy))), H1=X(0,bx+SY(),Ar.z-.02);
  const T=placeTorso(H0.clone().lerp(H1,eio(k)),lerp(28,3,eio(k)),0,0), t=smooth01(.45,.95,k);
  const Al0=X(.10,DIM.AH,H0.z-.05), Al1=X(.10,bx+DIM.AH,Ar.z);
  let Al=X(.10,lerp(Al0.y,Al1.y,smooth01(0,.6,t))+.06*Math.sin(Math.PI*t),lerp(Al0.z,Al1.z,smooth01(.3,1,t)));
  Al=clampReach(T.hip[1],Al,DIM.LT+DIM.LS-.012);
  const palm=[hangPalm(T,0),hangPalm(T,1)];
  return {T,ank:[Ar,Al],kneePole:[X(-.3,0,1),X(.1,0,1)],palm,dbs:palm.map(p=>({p,axis:X(0,0,1)})),grip:"neu",box:{x:[-.30,.30],z:[.16,.56],h:bx},leadKnee:"r"};
 },
 nordic(k){ // nordic isométrico: cuerpo recto de rodillas a cabeza, solo 20-30°
  const ph=lerp(0,26,k), kn=[X(-.10,.055,0),X(.10,.055,0)], ank=kn.map(q=>q.clone().add(X(0,.02,-DIM.LS)));
  const H=X(0,.055+DIM.LT*Math.cos(rad(ph)),DIM.LT*Math.sin(rad(ph))), T=placeTorso(H,ph,0,0);
  const palm=[T.sh[1].clone().addScaledVector(T.f,.10).addScaledVector(T.u,-.06),T.sh[0].clone().addScaledVector(T.f,.10).addScaledVector(T.u,-.06)];
  return {T,ank,sole:[X(0,.95,-.3),X(0,.95,-.3)],kneePole:[X(-.1,-.3,1),X(.1,-.3,1)],palm,elbPole:[X(-.3,-1,.4),X(.3,-1,.4)],fingers:20,mat:1,roller:X(0,.12,-DIM.LS)};
 },
 pullThrough(k){ // pull-through: bisagra de cadera con la cuerda entre las piernas
  const f=rad(lerp(24,4,k)), a=lerp(58,3,k), d=legD(f), hz=.02-DIM.TL*Math.sin(rad(a));
  const T=placeTorso(X(0,DIM.AH+Math.sqrt(Math.max(.01,d*d-hz*hz)),hz),a,0,0);
  const m=G.m; m.updateMatrixWorld(true);
  const kz=(DIM.LS*Math.sin(f*.4)), t0=X(0,DIM.AH+DIM.LS+.03,kz-.10), t1=T.H.clone().add(X(0,-.07,.17));
  let c=t0.clone().lerp(t1,eio(k)); c=clampReach(T.Sc,c,DIM.LA-.03);
  const palm=[c.clone().add(X(-.035,0,0)),c.clone().add(X(.035,0,0))], J=c.clone().add(X(0,-.04,-.05)), anc=X(0,.15,-.95);
  return {T,palm,ank:feet(.17),kneePole:[X(-.45,0,1),X(.45,0,1)],elbPole:[X(-.3,0,-1),X(.3,0,-1)],grip:"neu",anc,tower:X(0,0,-1.07),lines:[[J,anc]],trace:c};
 },
};
const POSE={}; for(const k in EX) POSE[k]=k==='granjero'?(t,v)=>EX[k](t,v):t=>EX[k](t);
POSE.rdlDb=t=>EX.rdl(t,true);
const SCAP={remoApoyado:k=>[0,lerp(.02,-.03,k)],yRaise:k=>[-.015*k,-.015*k],inclDb:()=>[-.01,-.02],jalonNeu:k=>[lerp(.03,-.02,k),lerp(.01,-.02,k)],facePull:k=>[-.01*k,lerp(.02,-.03,k)],
 latDb:()=>[-.01,0],curlIncl:()=>[0,-.012],hipThrust:()=>[0,-.01],rdl:()=>[-.012,0],talon:()=>[-.01,0],lungeRev:()=>[-.01,0],pressHombro:k=>[lerp(0,.025,smooth01(.6,1,k)),0],
 remoSentado:k=>[0,lerp(.035,-.03,eio(k))],overheadCable:()=>[.02,0],martillo:()=>[0,-.01],granjero:()=>[-.012,-.01],hexDL:()=>[-.012,0],bulgara:()=>[-.01,0],stepUp:()=>[-.01,0],kickRDL:()=>[-.012,0]};
const lateralPalm=k=>(s,d)=>slerpDir(V3(s?-1:1,0,0),V3(0,-1,0),Math.min(1,k*1.2));
const GRIPK={latDb:k=>lateralPalm(k)};
const MUS={remoApoyado:["back","lats","bi"],inclDb:["chestU","deltF","tri"],jalonNeu:["lats","bi"],facePull:["deltR","back","trap"],abdCable:["glute"],latDb:["deltS"],curlIncl:["bi"],
 hipThrust:["glute","ham"],rdl:["glute","ham","low"],talon:["calf"],lungeRev:["glute","quad"],femoral:["ham"],sidePlank:["glute","abs"],pressHombro:["deltF","deltS","tri"],
 remoSentado:["back","lats","bi"],kickCable:["glute"],overheadCable:["tri"],yRaise:["trap","back"],martillo:["bi","fore"],granjero:["fore","trap","abs"],hexDL:["glute","quad","ham","back"],
 goblet:["quad","glute"],bulgara:["glute","quad"],wallSit:["quad","add"],stepUp:["glute","quad"],kickRDL:["glute","ham"],nordic:["ham"],pullThrough:["glute","ham"]};
const MUS_NAME={chest:"pecho",chestU:"pecho alto",deltF:"hombro frontal",deltS:"hombro lateral",deltR:"hombro trasero",tri:"tríceps",bi:"bíceps",fore:"antebrazo",
 abs:"abdomen y oblicuos",back:"espalda media",lats:"dorsales",trap:"trapecio",low:"espalda baja",quad:"cuádriceps",glute:"glúteo",ham:"femoral",add:"aductores",calf:"pantorrilla"};
