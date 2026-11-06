"""Prueba de la interfaz de Zuly en móvil y escritorio. Capturas en out/."""
import sys
from playwright.sync_api import sync_playwright
import sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
from common import ROOT,setup,ARGS,edrei_preview,zuly_uri,launch
out=sys.argv[1] if len(sys.argv)>1 else "out/zuly_ui"
with sync_playwright() as p:
    b=launch(p)
    for name,vp,scheme in [("m",{"width":390,"height":844},"light"),("d",{"width":1100,"height":900},"dark")]:
        ctx=b.new_context(viewport=vp,color_scheme=scheme,device_scale_factor=1,has_touch=(name=="m"))
        pg=ctx.new_page(); errs=[]
        pg.on("pageerror",lambda e: errs.append("PE "+str(e))); pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
        setup(pg)
        pg.goto(zuly_uri()); pg.wait_for_timeout(5000)
        print(name,"HAS3D",pg.evaluate("HAS3D"),"cur",pg.evaluate("cur"),"live",pg.evaluate("live.length"))
        print(name,"overflow", pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth"))
        pg.screenshot(path=f"{out}_{name}_top.png")
        # interacción
        pg.click("#nbGo"); pg.wait_for_timeout(300)
        print(name,"bar1",pg.evaluate("[nowbar.dataset.mode,nbK.textContent,nbN.textContent,nbS.textContent,nbGo.textContent,nbClock.textContent]"))
        pg.click("#nbGo"); pg.wait_for_timeout(300)
        print(name,"bar2",pg.evaluate("[nowbar.dataset.mode,nbK.textContent,nbN.textContent,nbS.textContent,nbGo.textContent]"))
        pg.click("#nbGo"); pg.wait_for_timeout(300)
        print(name,"bar3",pg.evaluate("[nowbar.dataset.mode,nbK.textContent,nbN.textContent,nbS.textContent,nbGo.textContent]"))
        pg.click("#nbInfo"); pg.wait_for_timeout(1500)
        pg.screenshot(path=f"{out}_{name}_card.png")
        # cada día y la guía
        for i in range(6):
            pg.click(f"#tabs .tab:nth-child({i+1})"); pg.wait_for_timeout(1200)
            print(name,"day",i,"overflow",pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth"),"live",pg.evaluate("live.length"))
        pg.screenshot(path=f"{out}_{name}_guia.png",full_page=False)
        pg.click("#tabs .tab:nth-child(2)"); pg.wait_for_timeout(1500)
        pg.screenshot(path=f"{out}_{name}_mar_full.png",full_page=True)
        print(name,"errors",errs[:6])
        ctx.close()
    b.close()
