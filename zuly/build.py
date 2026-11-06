"""Arma zuly/zuly.html a partir de zuly/src. Uso: python3 zuly/build.py"""
import pathlib
Z=pathlib.Path(__file__).resolve().parent; S=Z/"src"
pre="const rad=d=>d*Math.PI/180, lerp=(a,b,k)=>a+(b-a)*k;\n"
js=pre+"".join((S/f).read_text() for f in ["z_data.js","z_core.js","z_ex.js","z_tail.js","z_ui.js"])
html=(S/"shell.html").read_text().replace("/*JS*/",js)
bad=[c for c in ("\u2014","\u2013") if c in html]
assert not bad, "Hay rayas largas o medias en el texto: quítalas (regla de Edrei)"
(Z/"zuly.html").write_text(html)
print("zuly.html", len(html), "bytes")
