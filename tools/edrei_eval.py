"""Uso: python3 tools/edrei_eval.py archivo.js  (evalúa una expresión JS en la página de Edrei ya cargada con 3D)"""
import sys,json
from playwright.sync_api import sync_playwright
import sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
from common import ROOT,setup,ARGS,edrei_preview,zuly_uri,launch
js=open(sys.argv[1]).read()
with sync_playwright() as p:
    b=launch(p); pg=b.new_page()
    setup(pg)
    errs=[]; pg.on("pageerror",lambda e: errs.append(str(e))); pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto(edrei_preview()); pg.wait_for_timeout(2500)
    print(pg.evaluate(js)); print("errors",errs[:4])
