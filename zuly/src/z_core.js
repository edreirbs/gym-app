// ================== VISOR 3D: maniquí articulado + poses con restricciones físicas ==================
// Mundo en metros: piso y=0, la persona mira hacia +z, su lado derecho está en x negativo.
let HAS3D=false;
const G={};
const BASE={limb:"#d8d0c6",torso:"#d2c9be",joint:"#b8ada0",shoe:"#363b44"};
// Medidas del maniquí (mujer de 1.62 m): se miden al iniciar
const DIM={AH:.088,MF:.058,LT:.437,LS:.406,TL:.612,UA:.321,FA:.321,PALM:.077,SW:.175,HW:.117};
DIM.LA=DIM.UA+DIM.FA+DIM.PALM;
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const smooth01=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const eio=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
function init3(){
  UPY=new THREE.Vector3(0,1,0);
  const r=new THREE.WebGLRenderer({antialias:true,alpha:true});
  r.setPixelRatio(1); r.setSize(560,560,false);
  r.outputColorSpace=THREE.SRGBColorSpace; r.toneMapping=THREE.ACESFilmicToneMapping; r.toneMappingExposure=1.0;
  r.shadowMap.enabled=true; r.shadowMap.type=THREE.PCFSoftShadowMap;
  const sc=new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xffffff,0x707680,1.1));
  const key=new THREE.DirectionalLight(0xffffff,2.2); key.position.set(1.6,4,2.6); key.castShadow=true;
  Object.assign(key.shadow.camera,{left:-2.2,right:2.2,top:2.2,bottom:-2.2,near:.1,far:12}); key.shadow.mapSize.set(1024,1024); key.shadow.radius=5; key.shadow.bias=-.0004; sc.add(key);
  const rim=new THREE.DirectionalLight(0xcfe0ff,1.1); rim.position.set(-2.2,2.4,-2.6); sc.add(rim);
  const fill=new THREE.DirectionalLight(0xfff1e0,.5); fill.position.set(-1.8,1.2,2.2); sc.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(12,12),new THREE.ShadowMaterial({opacity:.22})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; sc.add(floor);
  const cv=document.createElement("canvas");cv.width=cv.height=256;const cx=cv.getContext("2d");const gr=cx.createRadialGradient(128,128,10,128,128,128);gr.addColorStop(0,"rgba(120,130,145,.26)");gr.addColorStop(1,"rgba(120,130,145,0)");cx.fillStyle=gr;cx.fillRect(0,0,256,256);
  const disc=new THREE.Mesh(new THREE.PlaneGeometry(4.2,4.2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false})); disc.rotation.x=-Math.PI/2; disc.position.y=.001; sc.add(disc);
  G.r=r;G.sc=sc;G.cam=new THREE.PerspectiveCamera(30,1,.05,50);
  const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c},o));
  G.pad=M(0x2b313b,{roughness:.6}); G.steel=M(0xc9ced6,{roughness:.25,metalness:.85}); G.iron=M(0x1c2028,{roughness:.5,metalness:.35});
  G.frame=M(0x3a404b,{roughness:.45,metalness:.5});
  G.plate=M(0xd62f2f,{roughness:.5}); G.cable=M(0x8a94a3,{roughness:.4,metalness:.6});
  G.rope=M(0x2c2f36,{roughness:.8}); G.wall=M(0xc9ced8,{roughness:.9}); G.ball=M(0xf2a900,{roughness:.6});
  const m=new window.Female(1.62); sc.add(m); G.m=m;
  m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  m.recolor(BASE.limb,BASE.shoe,BASE.torso,BASE.joint,BASE.limb,BASE.torso,BASE.joint);
  // medir el maniquí de pie para calibrar
  m.position.set(0,0,0); m.bend=0; m.updateMatrixWorld(true);
  const sole=new THREE.Box3().setFromObject(m).min.y; G.sole0=sole;
  const hipC=W(m.r_leg).add(W(m.l_leg)).multiplyScalar(.5), shC=W(m.r_arm).add(W(m.l_arm)).multiplyScalar(.5);
  DIM.TL=shC.distanceTo(hipC); DIM.LT=W(m.r_leg).distanceTo(W(m.r_knee)); DIM.LS=W(m.r_knee).distanceTo(W(m.r_ankle));
  DIM.UA=W(m.r_arm).distanceTo(W(m.r_elbow)); DIM.FA=W(m.r_elbow).distanceTo(W(m.r_wrist)); DIM.PALM=W(m.r_wrist).distanceTo(W(m.r_wrist,0,2.6,0));
  DIM.AH=W(m.r_ankle).y-sole; DIM.SW=Math.abs(W(m.r_arm).x); DIM.HW=Math.abs(W(m.r_leg).x); DIM.LA=DIM.UA+DIM.FA+DIM.PALM;
  G.armBase=[m.r_arm.position.clone(),m.l_arm.position.clone()];
  G.palmAx=[0,1].map(s=>{const wr=s?m.l_wrist:m.r_wrist, med=V3(s?-1:1,0,0);let best=null,bd=-9;
    for(const a of [V3(1,0,0),V3(-1,0,0),V3(0,0,1),V3(0,0,-1)]){const d=W(wr,a.x,a.y,a.z).sub(W(wr)).normalize().dot(med);if(d>bd){bd=d;best=a;}}return best;});
  G.guide=new THREE.LineDashedMaterial({color:0xd62f2f,dashSize:.025,gapSize:.018,transparent:true,opacity:.95});
  G.guideBal=new THREE.LineDashedMaterial({color:0x5e6670,dashSize:.04,gapSize:.03,transparent:true,opacity:.75});
  G.guideRing=new THREE.MeshBasicMaterial({color:0xd62f2f,transparent:true,opacity:.8,side:THREE.DoubleSide});
  G.S=(DIM.LT+DIM.LS)/.843; DIM.MF=.058*G.S;
  G.props={}; G.cache={}; G.ref={}; G.scap=[0,0];
}
const W=(j,x=0,y=0,z=0)=>j.localToWorld(new THREE.Vector3(x,y,z));
let UPY=null;
// ---------- orientar huesos ----------
const _Mr=()=>new THREE.Matrix4();
function aim(joint,child,grand,du,df,pole){
  child.rotation.set(0,0,0); joint.parent.updateMatrixWorld(true); joint.updateMatrixWorld(true);
  const jw=joint.getWorldPosition(new THREE.Vector3()), cw=child.getWorldPosition(new THREE.Vector3()), gw=grand.getWorldPosition(new THREE.Vector3());
  const jInv=new THREE.Matrix4().copy(joint.matrixWorld).invert();
  const a0=cw.clone().applyMatrix4(jInv).normalize();
  let z0=new THREE.Vector3(0,0,1).transformDirection(child.matrixWorld).transformDirection(jInv); z0.sub(a0.clone().multiplyScalar(z0.dot(a0))).normalize();
  const cInv=new THREE.Matrix4().copy(child.matrixWorld).invert();
  const pin=jw.clone().applyMatrix4(cInv).negate().normalize(), fout=gw.clone().applyMatrix4(cInv).normalize();
  const rest=Math.atan2(pin.x*fout.y-pin.y*fout.x, pin.x*fout.x+pin.y*fout.y);
  const inv=new THREE.Matrix4().copy(joint.parent.matrixWorld).invert();
  const toL=v=>v.clone().transformDirection(inv);
  const u=toL(du), f=toL(df);
  let n=new THREE.Vector3().crossVectors(u,f);
  if(n.lengthSq()<2e-3){ n=new THREE.Vector3().crossVectors(u,toL(pole).negate()); }
  n.normalize();
  const Mr=_Mr().makeBasis(a0,z0,new THREE.Vector3().crossVectors(a0,z0));
  const Mt=_Mr().makeBasis(u,n,new THREE.Vector3().crossVectors(u,n));
  joint.quaternion.setFromRotationMatrix(Mt.multiply(Mr.transpose()));
  const th=Math.atan2(new THREE.Vector3().crossVectors(u,f).dot(n),u.dot(f));
  child.rotation.set(0,0,th-rest);
  joint.updateMatrixWorld(true);
}
// cinemática inversa de dos huesos: articulación media hacia el polo
function ik2(root,target,a,b,pole){
  const d=target.clone().sub(root); let L=d.length(); const u=d.clone().normalize();
  L=Math.min(Math.max(L,Math.abs(a-b)+1e-3),a+b-1e-3);
  const ca=(a*a+L*L-b*b)/(2*a*L), sa=Math.sqrt(Math.max(0,1-ca*ca));
  let v=pole.clone().sub(u.clone().multiplyScalar(pole.dot(u))); if(v.lengthSq()<1e-6) v=new THREE.Vector3(0,0,1); v.normalize();
  return root.clone().addScaledVector(u,a*ca).addScaledVector(v,a*sa);
}
// gira el tobillo para que la planta mire hacia "sole" (piso: (0,-1,0))
function orientFoot(an,sole){
  let best=0,bd=-9; an.rotation.set(0,0,0);
  for(let a=-70;a<=70;a+=2){an.rotation.z=rad(a);an.updateMatrixWorld(true);const d=W(an,0,1,0).sub(W(an)).normalize().dot(sole);if(d>bd){bd=d;best=a;}}
  for(let a=best-2;a<=best+2;a+=.25){an.rotation.z=rad(a);an.updateMatrixWorld(true);const d=W(an,0,1,0).sub(W(an)).normalize().dot(sole);if(d>bd){bd=d;best=a;}}
  an.rotation.z=rad(best); an.updateMatrixWorld(true);
}
function orientPalm(wr,s,tgt){
  const ax=G.palmAx[s]; let best=0,bd=-9;
  const ev=a=>{wr.rotation.set(0,rad(a),0);wr.updateMatrixWorld(true);return W(wr,ax.x,ax.y,ax.z).sub(W(wr)).normalize().dot(tgt);};
  for(let a=-180;a<180;a+=15){const d=ev(a);if(d>bd){bd=d;best=a;}}
  for(let a=best-14;a<=best+14;a+=2){const d=ev(a);if(d>bd){bd=d;best=a;}}
  wr.rotation.set(0,rad(best),0); wr.updateMatrixWorld(true);
}
// coloca pelvis y tronco; devuelve marcos y puntos anatómicos de referencia
function placeTorso(hip,bend,spine,nod){
  const m=G.m; m.rotation.set(0,0,0); m.position.set(0,0,0); m.bend=bend||0;
  m.torso.rotation.set(0,0,0); m.torso.bend=spine||0; m.head.rotation.set(0,0,0); if(nod) m.head.nod=nod;
  m.updateMatrixWorld(true);
  if(G.armBase){m.r_arm.position.copy(G.armBase[0]);m.l_arm.position.copy(G.armBase[1]);}
  m.updateMatrixWorld(true);
  const hc=W(m.r_leg).add(W(m.l_leg)).multiplyScalar(.5); m.position.add(hip.clone().sub(hc)); m.updateMatrixWorld(true);
  const sc=G.scap||[0,0];
  if(sc[0]||sc[1]){ // escápulas: elevación/depresión y retracción/protracción en el marco del tronco
    const a=W(m.r_arm),b=W(m.l_arm),H0=W(m.r_leg).add(W(m.l_leg)).multiplyScalar(.5),u0=a.clone().add(b).multiplyScalar(.5).sub(H0).normalize(),f0=V3(0,-u0.z,u0.y).normalize();
    for(const arm of [m.r_arm,m.l_arm]){const t=W(arm).addScaledVector(u0,sc[0]).addScaledVector(f0,sc[1]);arm.position.copy(arm.parent.worldToLocal(t));}
    m.updateMatrixWorld(true);
  }
  const sR=W(m.r_arm), sL=W(m.l_arm), Sc=sR.clone().add(sL).multiplyScalar(.5), H=W(m.r_leg).add(W(m.l_leg)).multiplyScalar(.5);
  const u=Sc.clone().sub(H).normalize(), f=V3(0,-u.z,u.y).normalize();
  return {sh:[sR,sL],Sc,H,u,f,hip:[W(m.r_leg),W(m.l_leg)],lm:(up,fw,x=0)=>Sc.clone().addScaledVector(u,up).addScaledVector(f,fw).add(V3(x,0,0))};
}
function slerpDir(a,b,k){const c=Math.max(-1,Math.min(1,a.dot(b))),O=Math.acos(c);if(O<1e-4)return a.clone();const s=Math.sin(O);return a.clone().multiplyScalar(Math.sin((1-k)*O)/s).addScaledVector(b,Math.sin(k*O)/s).normalize();}
function arc(sh,p0,p1,k){const d0=p0.clone().sub(sh),d1=p1.clone().sub(sh);const r=lerp(d0.length(),d1.length(),k);return sh.clone().addScaledVector(slerpDir(d0.normalize(),d1.normalize(),k),r);}
const mir=v=>V3(-v.x,v.y,v.z);
function vertForearm(sh,p,pole,gd){const q=p.clone();for(let i=0;i<6;i++){const e=ik2(sh,q,DIM.UA,DIM.FA+gd,pole);q.x=e.x;q.z=e.z;}return q;}
// aplica brazos y piernas a partir de objetivos
function applyLimbs(P){
  const m=G.m, legs=[[m.r_leg,m.r_knee,m.r_ankle],[m.l_leg,m.l_knee,m.l_ankle]], arms=[[m.r_arm,m.r_elbow,m.r_wrist],[m.l_arm,m.l_elbow,m.l_wrist]];
  for(const s of [0,1]){
    const [lg,kn,an]=legs[s]; an.rotation.set(0,0,0);
    const root=W(lg), tgt=P.ank[s], pole=P.kneePole?P.kneePole[s]:V3(s?.25:-.25,0,1);
    const mid=ik2(root,tgt,DIM.LT,DIM.LS,pole);
    aim(lg,kn,an,mid.clone().sub(root).normalize(),tgt.clone().sub(mid).normalize(),pole);
    orientFoot(an,(P.sole&&P.sole[s])||V3(0,-1,0));
    const [ar,el,wr]=arms[s]; wr.rotation.set(0,0,0);
    const sr=W(ar), palm=P.palm[s];
    let elb;
    const gd=P.gd??DIM.PALM; if(P.elb) elb=P.elb[s]; else elb=ik2(sr,palm,DIM.UA,DIM.FA+gd,P.elbPole?P.elbPole[s]:V3(s?.3:-.3,-.2,-1));
    aim(ar,el,wr,elb.clone().sub(sr).normalize(),palm.clone().sub(elb).normalize(),P.elbPole?P.elbPole[s]:V3(0,0,-1));
    if(P.grip){const d=palm.clone().sub(elb).normalize(), xh=V3(1,0,0), med=V3(s?-1:1,0,0);
      let t=P.grip instanceof THREE.Vector3?P.grip.clone():P.grip==="sup"?new THREE.Vector3().crossVectors(d,xh):P.grip==="neu"?med:typeof P.grip==="function"?P.grip(s,d):new THREE.Vector3().crossVectors(xh,d);
      if(t.lengthSq()>1e-4) orientPalm(wr,s,t.normalize());}
  }
  const g=P.fingers??70; m.r_fingers.bend=g; m.l_fingers.bend=g;
  m.updateMatrixWorld(true);
}
