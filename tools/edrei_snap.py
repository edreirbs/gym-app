"""Uso: python3 tools/edrei_snap.py banca,lenador 0,72 out/x.png  (fila por ejercicio; columnas k=0, .5, 1 por cada azimut)"""
import sys,base64
from playwright.sync_api import sync_playwright
from PIL import Image
import io
import sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
from common import ROOT,setup,ARGS,edrei_preview,zuly_uri,launch
keys=sys.argv[1].split(","); azs=[float(a) for a in sys.argv[2].split(",")]; out=sys.argv[3]
with sync_playwright() as p:
    b=launch(p); pg=b.new_page()
    setup(pg)
    errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
    pg.goto(edrei_preview()); pg.wait_for_timeout(2500)
    rows=[]
    for key in keys:
        imgs=pg.evaluate("""([key,azs])=>{const bd=boundsFor(key);const res=[];const pr=propsFor(key);if(!G.ref[key]){poseAt(key,0,1);G.ref[key]={E:W(G.m.r_elbow)};}
          const cv=document.createElement('canvas');cv.width=cv.height=560;const ctx=cv.getContext('2d');
          for(const az of azs) for(const k of [0,.5,1]){const S=poseAt(key,k,1);paintMuscles(key,0);for(const q in G.props)G.props[q].g.visible=false;pr.g.visible=true;pr.update(S);
            G.guide.color.set('#2E8B4E');G.guideRing.color.set('#2E8B4E');
            setCam({target:bd.c,dist:bd.r/Math.sin(rad(16))*1.06,az,el:10});G.r.render(G.sc,G.cam);ctx.fillStyle='#eceef1';ctx.fillRect(0,0,560,560);ctx.drawImage(G.r.domElement,0,0);drawHUD(ctx,key,S);res.push(cv.toDataURL('image/png'));}
          return res;}""",[key,azs])
        ims=[Image.open(io.BytesIO(base64.b64decode(u.split(",")[1]))).convert("RGBA") for u in imgs]
        rows.append(ims)
    w=280; m=Image.new("RGB",(w*len(rows[0]),w*len(rows)),"white")
    for r,ims in enumerate(rows):
        for c,im in enumerate(ims):
            bg=Image.new("RGBA",im.size,(236,238,241,255)); bg.alpha_composite(im); m.paste(bg.convert("RGB").resize((w,w)),(c*w,r*w))
    m.save(out); print("errors",errs[:3])
