"""Prueba de la interfaz de Edrei en móvil (390x844, claro) y escritorio (oscuro). Capturas en out/."""
from playwright.sync_api import sync_playwright
import sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
from common import ROOT,setup,ARGS,edrei_preview,zuly_uri,launch
with sync_playwright() as p:
    b=launch(p)
    for name,vp,sch in [("m",{"width":390,"height":844},"light"),("d",{"width":1100,"height":900},"dark")]:
        ctx=b.new_context(viewport=vp,color_scheme=sch,has_touch=(name=="m")); pg=ctx.new_page(); errs=[]
        pg.on("pageerror",lambda e: errs.append("PE "+str(e))); pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
        setup(pg)
        pg.goto(edrei_preview()); pg.wait_for_timeout(4500)
        print(name,"HAS3D",pg.evaluate("HAS3D"),"cur",pg.evaluate("current"),"live",pg.evaluate("live.length"),"overflow",pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth"))
        if name=="m":
            print("timings",pg.evaluate("DAYS.map(D=>D.d+' '+blocksOf(D).map(b=>b.end.toFixed(1)).join('/')).join(' | ')"))
            pg.screenshot(path="out/edrei_m_top.png")
            # serie de A, luego serie de B -> descanso visible
            pg.click('#ex-0 .set[data-k="0"]'); pg.wait_for_timeout(200)
            pg.click('#ex-1 .set[data-k="0"]'); pg.wait_for_timeout(700)
            print("prog during rest:",pg.evaluate("document.querySelector('#prog .pt').textContent"))
            pg.evaluate("document.getElementById('ex-1').scrollIntoView({block:'start'})"); pg.wait_for_timeout(800)
            pg.screenshot(path="out/edrei_m_rest.png")
            # Ya lo hice en 0
            pg.click('#ex-0 [data-done]'); pg.wait_for_timeout(600)
            print("card0 done:",pg.evaluate("document.getElementById('ex-0').classList.contains('done')"),"prog:",pg.evaluate("document.querySelector('#prog').textContent"),"toast:",pg.evaluate("document.getElementById('toast').hidden"),pg.evaluate("document.querySelector('#toast span').textContent"))
            pg.evaluate("document.getElementById('ex-0').scrollIntoView({block:'center'})"); pg.wait_for_timeout(900)
            pg.screenshot(path="out/edrei_m_done.png")
            # completar todas las series de 1 -> se apaga solo
            for k in range(1,pg.evaluate("DAYS[current].ex[1][1]")): pg.click(f'#ex-1 .set[data-k="{k}"]'); pg.wait_for_timeout(150)
            pg.wait_for_timeout(800)
            print("card1 auto done:",pg.evaluate("document.getElementById('ex-1').classList.contains('done')"))
            pg.click('[data-undo="1"]'); pg.wait_for_timeout(300)
            print("card1 after undo:",pg.evaluate("document.getElementById('ex-1').classList.contains('done')"))
            pg.reload(); pg.wait_for_timeout(3500)
            print("after reload done:",pg.evaluate("stOf(current)"), pg.evaluate("[...document.querySelectorAll('.card.done')].map(c=>c.id)"))
            # completar todo el día
            pg.evaluate("[0,1,2,3,4,5].forEach(n=>setDone(n,true))"); pg.wait_for_timeout(600)
            print("all:",pg.evaluate("document.querySelector('#prog').textContent"),pg.evaluate("[...document.querySelectorAll('.tab.ok')].map(t=>t.id)"))
            pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(500)
            pg.screenshot(path="out/edrei_m_all.png")
            for i in range(5):
                pg.click(f"#tab-{i}"); pg.wait_for_timeout(1000)
                print("day",i,"overflow",pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth"),"live",pg.evaluate("live.length"))
        else:
            pg.click("#tab-2"); pg.wait_for_timeout(1500)
            pg.screenshot(path="out/edrei_d_wed.png")
        print(name,"errors",errs[:5]); ctx.close()
    b.close()
