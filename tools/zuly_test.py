"""Uso: python3 tools/zuly_test.py check|dir|dim|snap <keys> [out.png] [azimuts]  (prueba poses del modelo de Zuly sobre zuly/zuly.html)"""
import sys,json,base64,io
from playwright.sync_api import sync_playwright
from PIL import Image
import sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
from common import ROOT,setup,ARGS,edrei_preview,zuly_uri,launch
mode=sys.argv[1]; keys=sys.argv[2].split(",")
with sync_playwright() as p:
    b=launch(p); pg=b.new_page()
    setup(pg)
    errs=[]; pg.on("pageerror",lambda e: errs.append(str(e))); pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto(zuly_uri()); pg.wait_for_timeout(2500)
    if mode=="dim":
        print(pg.evaluate("()=>JSON.stringify(Object.fromEntries(Object.entries(DIM).map(([k,v])=>[k,+v.toFixed(3)])))+' S='+G.S.toFixed(3)"))
    if mode=="check":
        res=pg.evaluate("""(keys)=>{const out=[];let fails=0,tot=0;const m=G.m;
         for(const key of keys){propsFor(key);poseAt(key,0,1);G.ref[key]={E:W(m.r_elbow)};
          let pe=0,ae=0,minY=9,fl=[];
          for(let i=0;i<=20;i++){const k=i/20;const S=poseAt(key,k,1);m.updateMatrixWorld(true);
            if(!S.after){const gd=S.gd??DIM.PALM;[0,1].forEach(j=>{const wr=W(j?m.l_wrist:m.r_wrist),el=W(j?m.l_elbow:m.r_elbow);const exp=el.clone().add(wr.clone().sub(el).normalize().multiplyScalar(DIM.FA+gd));pe=Math.max(pe,S.palm[j].distanceTo(exp));});
              S.ank.forEach((q,j)=>{ae=Math.max(ae,q.distanceTo(W(j?m.l_ankle:m.r_ankle)));});}
            minY=Math.min(minY,new THREE.Box3().setFromObject(m).min.y);
            const M=measure();for(const c of (HUD[key]||{c:[]}).c){const r=c[1](M,S,G.ref[key]);if(r===null)continue;tot++;if(!r){fails++;fl.push(`${k.toFixed(2)}:${c[0]}`);}}}
          out.push(`${key}: mano ${(pe*100).toFixed(1)}cm pie ${(ae*100).toFixed(1)}cm piso ${(minY*100).toFixed(1)}cm ${fl.length?'FALLAS '+fl.slice(0,4).join(' | '):''}`);}
         out.unshift(`checks ${tot} fallas ${fails}`);return out.join("\\n");}""",keys)
        print(res)
    if mode=="dir":
        print(pg.evaluate("""(keys)=>keys.map(key=>{propsFor(key);const r=[0,1].map(k=>{poseAt(key,k,1);G.m.updateMatrixWorld(true);const M=measure();return `k${k}: knee ${Math.round(M.knee)} hip ${Math.round(M.hip)} elb ${Math.round(M.elbow)} sh ${Math.round(M.shoulder)}`});return key+' | '+r.join(' | ');}).join('\\n')""",keys))
    if mode=="snap":
        out=sys.argv[3]; azs=[float(a) for a in sys.argv[4].split(",")] if len(sys.argv)>4 else [0,45]
        rows=[]
        for key in keys:
            imgs=pg.evaluate("""([key,azs])=>{const bd=boundsFor(key);const res=[];const pr=propsFor(key);if(!G.ref[key]){poseAt(key,0,1);G.ref[key]={E:W(G.m.r_elbow)};}
              for(const az of azs) for(const k of [0,.5,1]){const S=poseAt(key,k,1);paintMuscles(key,0);for(const q in G.props)G.props[q].g.visible=false;pr.g.visible=true;pr.update(S);
                setCam({target:bd.c,dist:bd.r/Math.sin(rad(16))*1.06,az,el:10});G.r.render(G.sc,G.cam);res.push(G.r.domElement.toDataURL('image/png'));}
              return res;}""",[key,azs])
            rows.append([Image.open(io.BytesIO(base64.b64decode(u.split(",")[1]))).convert("RGBA") for u in imgs])
        w=250; m=Image.new("RGB",(w*len(rows[0]),w*len(rows)),"white")
        for r,ims in enumerate(rows):
            for c,im in enumerate(ims):
                bg=Image.new("RGBA",im.size,(236,238,241,255)); bg.alpha_composite(im); m.paste(bg.convert("RGB").resize((w,w)),(c*w,r*w))
        m.save(out)
    print("errors",errs[:5])
