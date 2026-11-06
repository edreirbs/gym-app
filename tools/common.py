"""Utilidades compartidas por las pruebas. Sirve three y mannequin-js desde node_modules en vez del CDN."""
import pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
NM=ROOT/"node_modules"
ARGS=["--use-gl=swiftshader","--enable-unsafe-swiftshader"]
(ROOT/"out").mkdir(exist_ok=True)
def _route(r):
    u=r.request.url
    if "three@0.169.0/" in u: f=NM/"three"/u.split("three@0.169.0/")[1]
    elif "mannequin-js@5.2.3/" in u: f=NM/"mannequin-js"/u.split("mannequin-js@5.2.3/")[1]
    else: return r.fulfill(body="",status=404)
    r.fulfill(body=f.read_bytes(),content_type="application/javascript")
def setup(pg):
    pg.route("https://cdn.jsdelivr.net/**",_route)
    pg.route("https://fonts.googleapis.com/**",lambda r:r.fulfill(body="",content_type="text/css"))
def edrei_preview():
    """rutina.html es un documento HTML completo (se publica en GitHub Pages)."""
    return (ROOT/"edrei"/"rutina.html").as_uri()
def zuly_uri():
    return (ROOT/"zuly"/"zuly.html").as_uri()
def launch(p):
    """Usa Chromium del sistema si CHROMIUM_PATH está definido (entornos sin `playwright install`)."""
    import os
    exe=os.environ.get("CHROMIUM_PATH")
    if not exe and pathlib.Path("/opt/pw-browsers/chromium").exists(): exe="/opt/pw-browsers/chromium"
    return p.chromium.launch(args=ARGS,**({"executable_path":exe} if exe else {}))
