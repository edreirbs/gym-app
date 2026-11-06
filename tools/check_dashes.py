"""Revisa que no haya raya larga (U+2014) ni raya media (U+2013) en las apps y docs."""
import pathlib,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
BAD=("\u2014","\u2013")
hits=[]
for p in [ROOT/"edrei"/"rutina.html",ROOT/"zuly"/"zuly.html",*ROOT.glob("*.md"),*(ROOT/"docs").glob("*.md"),*(ROOT/"zuly"/"src").glob("*")]:
    for i,l in enumerate(p.read_text(errors="ignore").splitlines(),1):
        if any(c in l for c in BAD): hits.append(f"{p.relative_to(ROOT)}:{i}: {l.strip()[:100]}")
print("\n".join(hits) if hits else "No hay rayas largas ni medias.")
sys.exit(1 if hits else 0)
