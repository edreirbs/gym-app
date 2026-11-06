"""Prueba de la interfaz de Edrei (v14, semana adaptativa) en móvil (390x844, claro) y escritorio (oscuro).
Fija la fecha del navegador para probar escenarios de asistencia. Capturas en out/. Sale con 1 si algo falla."""
from playwright.sync_api import sync_playwright
import sys,pathlib,json
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
from common import ROOT,setup,ARGS,edrei_preview,zuly_uri,launch

FAILS=[]
def ok(cond,msg):
    print(("OK   " if cond else "FALLA")+" "+msg)
    if not cond: FAILS.append(msg)

# Semana del lunes 2 al domingo 8 de noviembre de 2026
DAY={"lun":"2026-11-02","mar":"2026-11-03","mie":"2026-11-04","jue":"2026-11-05","vie":"2026-11-06","sab":"2026-11-07"}
def at(d): return d+"T10:00:00"

def page(b,name,vp,sch,when,store=None):
    ctx=b.new_context(viewport=vp,color_scheme=sch,has_touch=(name=="m")); pg=ctx.new_page(); errs=[]
    pg.on("pageerror",lambda e: errs.append("PE "+str(e))); pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
    setup(pg); pg.clock.set_fixed_time(at(when))
    if store:
        pg.add_init_script("(()=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();const s="+json.dumps(store)+";for(const k in s) localStorage.setItem(k,JSON.stringify(s[k]));})()")
    pg.goto(edrei_preview()); pg.wait_for_timeout(3500)
    return ctx,pg,errs

ov=lambda pg: pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
plan=lambda pg: pg.evaluate("WEEK.days.map(x=>x.kind[0]+':'+x.D.ex.map(e=>e[7]).join(','))")
names=lambda pg: pg.evaluate("WEEK.days.map(x=>'Día '+x.n+' '+x.date.slice(5)+' '+x.kind+' '+x.D.s)")

with sync_playwright() as p:
    b=launch(p)
    base=None
    # 1. Lunes sin registros: 5 días idénticos a v13.1 (A1)
    ctx,pg,errs=page(b,"m",{"width":390,"height":844},"light",DAY["lun"])
    base=pg.evaluate("DAYS.map(D=>D.ex.map(e=>e[7]).join(','))")
    ok(plan(pg)==["p:"+x for x in base],"lunes: 5 sesiones iguales a la base")
    ok(pg.evaluate("current")==0 and pg.evaluate("WEEK.days[0].today"),"lunes: abre en Día 1 (hoy)")
    print("     tiempos",pg.evaluate("DAYS.map(D=>'Día '+D.n+' '+blocksOf(D).map(b=>b.end.toFixed(1)).join('/')).join(' | ')"))
    ok(ov(pg)==0,"lunes: sin desbordamiento")
    pg.screenshot(path="out/edrei_m_top.png")
    # registrar series: A y luego B arranca el descanso; el día queda congelado
    pg.click('#ex-0 .set[data-k="0"]'); pg.wait_for_timeout(200)
    pg.click('#ex-1 .set[data-k="0"]'); pg.wait_for_timeout(700)
    ok("Descansa" in pg.evaluate("document.querySelector('#prog .pt').textContent"),"descanso arranca en la serie de B")
    rec=pg.evaluate("JSON.parse(localStorage.getItem('ed13:d:2026-11-02'))")
    ok(rec.get("att")=="fui" and len(rec.get("plan",[]))==6,"al registrar, el día queda como 'fui' con su plan guardado")
    pg.click('#ex-0 [data-done]'); pg.wait_for_timeout(600)
    ok(pg.evaluate("document.getElementById('ex-0').classList.contains('done')"),"✓ Ya lo hice apaga el ejercicio")
    pg.screenshot(path="out/edrei_m_done.png")
    # pestaña de un día futuro: series deshabilitadas y botón Hacerla hoy
    pg.click("#tab-2"); pg.wait_for_timeout(900)
    ok(pg.evaluate("[...document.querySelectorAll('.set')].every(b=>b.disabled)"),"día planeado futuro: series deshabilitadas")
    ok(pg.evaluate("!!document.querySelector('[data-swap]')")==False,"hoy ya registrado: no ofrece Hacerla hoy")
    print("     errores",errs[:5]); ok(not errs,"lunes: sin errores de consola"); ctx.close()

    # 2. Miércoles: fui el lunes (registro viejo de v13 sin plan), no registré el martes
    store={"ed13:d:2026-11-02":{"done":[0,1,2,3,4,5],"sets":{}}}
    ctx,pg,errs=page(b,"m",{"width":390,"height":844},"light",DAY["mie"],store)
    print("    ",names(pg))
    ok(pg.evaluate("WEEK.st['2026-11-02']")=="fui","registro viejo de v13 cuenta como 'fui' (A4)")
    ok(pg.evaluate("WEEK.st['2026-11-03']")=="supuesto","martes sin registro: supuesto no")
    ok(len(plan(pg))==4 and pg.evaluate("WEEK.W.merged"),"miércoles: 1 hecho + 3 días ajustados")
    ok(pg.evaluate("WEEK.days.flatMap(x=>x.D.ex.map(e=>e[7])).includes('sentadilla')"),"la sentadilla sigue en la semana")
    ok(pg.evaluate("WEEK.days[current].today"),"abre en el día de hoy")
    ok(pg.evaluate("!!document.querySelector('.wnote')"),"se ve el aviso de semana reacomodada")
    ok(pg.evaluate("WEEK.days.filter(x=>x.kind==='plan').every(x=>blocksOf(x.D).at(-1).end<=48)"),"días ajustados terminan antes del min 48")
    ok(ov(pg)==0,"miércoles: sin desbordamiento")
    pg.evaluate("window.scrollTo(0,0)"); pg.screenshot(path="out/edrei_m_ajustada.png",full_page=False)
    # estabilidad: recargar no cambia el plan (A3)
    before=plan(pg); pg.reload(); pg.wait_for_timeout(2500)
    ok(plan(pg)==before,"recargar no cambia el plan")
    # Sí fui el martes: le toca Jale A y la semana vuelve a ser 1 a 1
    pg.click('[data-wd="2026-11-03"]'); pg.wait_for_timeout(300)
    pg.click('[data-att="fui"][data-date="2026-11-03"]'); pg.wait_for_timeout(800)
    ok(plan(pg)==["f:"+base[0],"f:"+base[1],"p:"+base[2],"p:"+base[3],"p:"+base[4]],"'Sí fui' el martes: asigna Jale A y el resto queda como la base")
    # hoy no puedo ir
    pg.click('#week [data-wd="2026-11-04"]'); pg.wait_for_timeout(300)
    pg.click('#week [data-att="no"][data-date="2026-11-04"]'); pg.wait_for_timeout(800)
    print("    ",names(pg))
    ok(pg.evaluate("WEEK.st['2026-11-04']")=="no" and len(plan(pg))==4,"'Hoy no puedo ir': quedan jueves y viernes con 3 sesiones fusionadas")
    ok(not pg.evaluate("document.getElementById('toast').hidden"),"aviso con Deshacer")
    pg.evaluate("window.scrollTo(0,0)"); pg.screenshot(path="out/edrei_m_hoyno.png")
    pg.click("#toast button"); pg.wait_for_timeout(800)
    ok(pg.evaluate("WEEK.st['2026-11-04']")=="open" and len(plan(pg))==5,"Deshacer regresa el plan")
    # hacer hoy la sesión del viernes
    pg.click("#tab-4"); pg.wait_for_timeout(800)
    pg.click("[data-swap]"); pg.wait_for_timeout(900)
    ok(pg.evaluate("WEEK.days.find(x=>x.today).D.s")=="Jale B","'Hacerla hoy' intercambia la sesión")
    for i in range(pg.evaluate("WEEK.days.length")):
        pg.click(f"#tab-{i}"); pg.wait_for_timeout(700)
        ok(ov(pg)==0 and pg.evaluate("live.length")==pg.evaluate("WEEK.days[current].D.ex.length"),f"pestaña {i}: sin desbordamiento y con todas sus figuras")
    print("     errores",errs[:5]); ok(not errs,"miércoles: sin errores de consola"); ctx.close()

    # 3. Viernes después de faltar martes y jueves (lunes y miércoles fui)
    store={"ed13:d:2026-11-02":{"done":[],"sets":{"0":[0]},"att":"fui","plan":[[0,e] for e in range(6)]},
           "ed13:d:2026-11-04":{"done":[],"sets":{"0":[0]},"att":"fui","plan":[[2,e] for e in range(6)]}}
    ctx,pg,errs=page(b,"d",{"width":1100,"height":900},"dark",DAY["vie"],store)
    print("    ",names(pg))
    last=pg.evaluate("WEEK.days.at(-1)")
    ok(last["today"] and last["kind"]=="plan" and pg.evaluate("WEEK.W.merged"),"viernes: una sesión fusionada para hoy")
    ok(pg.evaluate("Semana.check(WEEK.days.at(-1).D.refs.filter(([s,e])=>DAYS[s].ex[e][5]).map(([s,e])=>pairOfRef(s,e))).length")==0,"la sesión fusionada cumple las reglas")
    pg.screenshot(path="out/edrei_d_viernes.png")
    print("     errores",errs[:5]); ok(not errs,"escritorio: sin errores de consola"); ctx.close()

    # 4. Sábado con una sesión pendiente: día opcional
    store={f"ed13:d:{DAY[k]}":{"done":[],"sets":{},"att":"fui","plan":[[i,e] for e in range(6)]} for i,k in enumerate(["lun","mar","mie","jue"])}
    ctx,pg,errs=page(b,"m",{"width":390,"height":844},"light",DAY["sab"],store)
    ok(pg.evaluate("WEEK.days.at(-1).today && WEEK.days.at(-1).D.s")=="Jale B","sábado: Jale B queda como opcional hoy")
    ok(ov(pg)==0 and not errs,"sábado: sin desbordamiento ni errores")
    ctx.close()

    # 5. Hora de Monterrey: 5 nov 03:00 UTC = 4 nov 21:00 en Monterrey (spec 003)
    ctx=b.new_context(viewport={"width":390,"height":844},timezone_id="Europe/Madrid"); pg=ctx.new_page(); setup(pg)
    pg.clock.set_fixed_time("2026-11-05T03:00:00Z"); pg.goto(edrei_preview()); pg.wait_for_timeout(2500)
    ok(pg.evaluate("WEEK.today")=="2026-11-04","teléfono en Madrid a las 4:00 del 5 nov: hoy es miércoles 4 en Monterrey")
    ok("hoy miércoles 4" in pg.evaluate("document.querySelector('.wkhead').textContent"),"encabezado con la fecha de hoy")
    # Restablecer: No fui y luego Restablecer deja el día como antes; Deshacer lo regresa
    before=plan(pg)
    pg.click('#week [data-wd="2026-11-04"]'); pg.wait_for_timeout(300)
    pg.click('#week [data-att="no"][data-date="2026-11-04"]'); pg.wait_for_timeout(700)
    ok(pg.evaluate("WEEK.st['2026-11-04']")=="no","marcado No voy hoy")
    pg.click('[data-reset="2026-11-04"]'); pg.wait_for_timeout(700)
    ok(pg.evaluate("WEEK.st['2026-11-04']")=="open" and plan(pg)==before and pg.evaluate("localStorage.getItem('ed13:d:2026-11-04')") is None,"Restablecer día: vuelve a disponible y el plan como antes")
    pg.click("#toast button"); pg.wait_for_timeout(700)
    ok(pg.evaluate("WEEK.st['2026-11-04']")=="no","Deshacer regresa la marca")
    pg.click('[data-reset="2026-11-04"]'); pg.wait_for_timeout(700)
    # con series registradas
    pg.click('#ex-0 .set[data-k="0"]'); pg.wait_for_timeout(400)
    ok(pg.evaluate("WEEK.st['2026-11-04']")=="fui","registrar una serie marca el día como fui")
    pg.click('#week [data-wd="2026-11-04"]'); pg.wait_for_timeout(300)
    pg.click('[data-reset="2026-11-04"]'); pg.wait_for_timeout(700)
    ok(pg.evaluate("WEEK.st['2026-11-04']")=="open" and not pg.evaluate("document.querySelector('.set[aria-pressed=true]')"),"Restablecer borra las series del día")
    ok(ov(pg)==0,"sin desbordamiento con el botón")
    pg.evaluate("window.scrollTo(0,0)"); pg.locator("#week").screenshot(path="out/edrei_m_reset.png")
    ctx.close()
    b.close()
print("\n"+("TODO BIEN" if not FAILS else f"{len(FAILS)} FALLAS: "+"; ".join(FAILS)))
sys.exit(1 if FAILS else 0)
