# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from urllib.parse import quote_plus

NAVY = HexColor("#16213E"); ACC = HexColor("#E94560"); SOFT = HexColor("#F2F4F8")
GRAY = HexColor("#5A6270"); LINE = HexColor("#D5D9E0"); SS = HexColor("#FDECEF")

# (nombre, series, reps, descanso_min, tipo, superserie_con_siguiente, busqueda, como, error, siente)
# tipo: C compuesto (0.75 min/serie), A analitico (0.6), U unilateral (1.2)
DAYS = [
 ("LUNES", "EMPUJE A", "Fuerza: pecho, hombro y tríceps pesados",
  ["3 min de bicicleta suave", "Rotación externa en polea ligera: 1×15 por brazo",
   "Aproximación del press de banca: barra sola ×10, luego 50 % ×5"],
  [
   ("Press de banca con barra", 4, "6-8", 2, "C", False, "press de banca con barra tecnica",
    "Acostado con los ojos bajo la barra y los pies firmes en el piso. Agarre un poco más ancho que los hombros. Junta las escápulas y saca el pecho. Baja controlado a la parte baja del pecho con los codos a unos 45° del torso y empuja hacia arriba.",
    "Rebotar la barra en el pecho o abrir los codos a 90°.", "Pecho, hombro frontal y tríceps"),
   ("Press militar de pie con barra", 3, "6-8", 2, "C", False, "press militar de pie con barra tecnica",
    "Barra en el rack a la altura de la clavícula, agarre justo por fuera de los hombros. Aprieta glúteos y abdomen. Empuja en vertical y mete la cabeza hacia adelante cuando la barra pase la frente.",
    "Arquear la espalda baja para ayudarte.", "Hombros y tríceps"),
   ("Press inclinado 30° con mancuerna", 3, "8-10", 1.5, "C", False, "press inclinado con mancuernas tecnica",
    "Banco a 30° (una o dos muescas). Mancuernas a los lados del pecho, codos un poco por debajo. Sube juntándolas sin chocarlas y baja en 2-3 segundos.",
    "Poner el banco muy vertical: se vuelve press de hombro.", "Pecho alto"),
   ("Elevación lateral con mancuerna", 4, "12-15", 0, "A", True, "elevacion lateral con mancuernas tecnica",
    "De pie, torso un poco inclinado al frente, codos ligeramente doblados. Sube los brazos hacia los lados hasta la altura del hombro, guiando con los codos. Pausa 1 s y baja lento.",
    "Columpiar el cuerpo o subir los hombros hacia las orejas.", "Parte lateral del hombro"),
   ("Jalón de tríceps en polea alta", 4, "10-12", 1, "A", False, "extension de triceps en polea alta tecnica",
    "Barra recta o en V. Codos pegados al costado y quietos. Extiende hasta estirar el brazo y aprieta. Solo se mueve el antebrazo.",
    "Separar los codos o empujar con el peso del cuerpo.", "Parte trasera del brazo"),
   ("Crunch en polea alta con cuerda", 3, "12-15", 1, "A", False, "crunch en polea alta cuerda tecnica",
    "Hincado frente a la polea, cuerda junto a la cabeza. Enrolla el tronco llevando las costillas hacia la pelvis. Exhala al bajar. La cadera no se mueve.",
    "Jalar con los brazos o sentarte sobre los talones.", "Abdomen"),
  ],
  ["Pecho en poste o marco de puerta: 30 s por lado", "Hombro cruzado al frente: 30 s por lado",
   "Tríceps detrás de la cabeza: 30 s por lado", "Abdomen boca abajo, apoyado en antebrazos: 45 s",
   "Respiración lenta sentado: 1 min"]),

 ("MARTES", "JALE A", "Fuerza: espalda pesada, deltoides posterior y bíceps",
  ["3 min de bicicleta o remo ergómetro suave", "Jalón al pecho ligero: 1×15",
   "Aproximación del remo: barra sola ×10, luego 50 % ×5"],
  [
   ("Remo con barra, torso a 45°", 4, "6-8", 2, "C", False, "remo con barra inclinado tecnica",
    "Pies al ancho de cadera, rodillas suaves. Lleva la cadera atrás hasta que el torso quede a 45°, espalda recta. Agarre prono al ancho de hombros. Jala la barra al ombligo llevando los codos atrás, aprieta 1 s y baja controlado.",
    "Levantar el torso para subir la barra o redondear la espalda.", "Espalda media y dorsales"),
   ("Jalón al pecho, agarre prono ancho", 4, "8-10", 1.5, "C", False, "jalon al pecho agarre ancho tecnica",
    "Ajusta el rodillo sobre los muslos. Agarre 1.5 veces el ancho de hombros. Pecho arriba, leve inclinación atrás. Jala a la parte alta del pecho llevando los codos hacia abajo y a los costados. Sube lento hasta estirar.",
    "Jalar detrás del cuello o balancearte.", "Dorsales (el ancho de la espalda)"),
   ("Aperturas posteriores con mancuerna, sentado", 4, "12-15", 0, "A", True, "aperturas posteriores sentado mancuernas deltoides posterior",
    "Sentado en el borde del banco, torso inclinado sobre los muslos y espalda recta. Mancuernas bajo las piernas. Abre los brazos hacia los lados, codos un poco doblados, hasta la altura del hombro. Peso ligero.",
    "Usar mucho peso y jalar con la espalda.", "Parte trasera del hombro"),
   ("Curl con barra Z de pie", 4, "8-10", 1, "A", False, "curl con barra z de pie tecnica",
    "Agarre en la curva exterior de la barra. Codos pegados al costado. Sube sin mover el torso y baja en 2-3 segundos hasta casi estirar.",
    "Columpiar el cuerpo.", "Bíceps"),
   ("Curl martillo con mancuerna", 3, "10-12", 1, "A", False, "curl martillo mancuernas tecnica",
    "Palmas mirándose entre sí todo el recorrido. Codos fijos al costado. Sube y baja controlado, simultáneo o alternado.",
    "Girar la muñeca o adelantar los codos.", "Bíceps externo, braquial y antebrazo"),
   ("Pallof press en polea", 3, "10 por lado", 0.75, "U", False, "pallof press polea tecnica",
    "Polea a la altura del pecho. De lado a la máquina, a un paso. Maneral al pecho con ambas manos. Empuja al frente, sostén 2 s sin dejar que te gire y regresa. Luego el otro lado.",
    "Girar el torso hacia la polea.", "Abdomen y oblicuos"),
  ],
  ["Dorsal: agarra un poste y lleva la cadera atrás: 30 s por lado", "Bíceps con la palma contra la pared: 30 s por lado",
   "Antebrazo: dedos hacia ti, brazo estirado: 30 s por lado", "Espalda alta: abrázate y redondea: 45 s",
   "Respiración lenta sentado: 1 min"]),

 ("MIÉRCOLES", "PIERNA", "Mantener piernas con básicos; el torso descansa",
  ["3 min de bicicleta suave", "Bisagra de cadera con barra sola: 1×10",
   "Aproximación de sentadilla: barra sola ×10, luego 50 % ×5"],
  [
   ("Sentadilla libre con barra", 4, "6-8", 2.5, "C", False, "sentadilla libre con barra tecnica",
    "Barra sobre los trapecios, no sobre el cuello. Pies al ancho de hombros, puntas un poco afuera. Toma aire y aprieta el abdomen. Baja llevando la cadera atrás y abajo, rodillas en dirección de las puntas, hasta que el muslo quede paralelo al piso. Sube empujando el piso. Pon las barras de seguridad del rack.",
    "Rodillas hacia adentro o talones despegados.", "Cuádriceps y glúteo"),
   ("Prensa de pierna [máquina]", 4, "10-12", 1.5, "C", False, "prensa de pierna 45 tecnica",
    "Espalda y cadera pegadas al respaldo. Pies al ancho de hombros en medio de la plataforma. Baja hasta que la rodilla quede en 90° sin que se despegue la cadera. Empuja sin bloquear las rodillas.",
    "Bajar tanto que la cadera se levanta del asiento.", "Cuádriceps y glúteo"),
   ("Hip thrust con barra en banco", 3, "8-10", 1.5, "C", False, "hip thrust con barra tecnica",
    "Espalda alta (bajo los omóplatos) apoyada en el borde del banco. Barra sobre la cadera con almohadilla. Pies al ancho de cadera. Sube la cadera apretando glúteos hasta que el tronco quede paralelo al piso. Barbilla metida, pausa 1 s.",
    "Arquear la espalda baja en lugar de subir con el glúteo.", "Glúteo"),
   ("Curl femoral sentado [máquina]", 3, "12-15", 0, "A", True, "curl femoral sentado maquina tecnica",
    "Rodilla alineada con el eje de la máquina. Rodillo arriba del tobillo. Jala hacia abajo y atrás, pausa y sube lento.",
    "Despegar la cadera del asiento.", "Femoral (parte trasera del muslo)"),
   ("Aductores [máquina]", 3, "12-15", 0.75, "A", False, "maquina de aductores tecnica",
    "Espalda pegada al respaldo. Cierra las piernas controlado, pausa 1 s y abre lento hasta un estiramiento cómodo.",
    "Soltar el peso de golpe al abrir.", "Cara interna del muslo"),
   ("Elevación de talón de pie con mancuerna", 4, "12-15", 0.75, "A", False, "elevacion de talones de pie con mancuernas sobre disco",
    "Puntas de los pies sobre un disco, una mancuerna en cada mano. Baja el talón hasta estirar la pantorrilla, sube a la punta máxima y pausa 1 s.",
    "Rebotar rápido sin pausa arriba ni abajo.", "Pantorrilla"),
  ],
  ["Cuádriceps de pie, talón al glúteo: 30 s por lado", "Femoral con el talón sobre el banco: 30 s por lado",
   "Flexor de cadera, rodilla al piso: 30 s por lado", "Glúteo en figura 4, sentado: 30 s por lado",
   "Pantorrilla contra la pared: 30 s por lado"]),

 ("JUEVES", "EMPUJE B", "Volumen: hombro primero, pecho alto y tríceps",
  ["3 min de bicicleta suave", "Rotación externa en polea ligera: 1×15 por brazo",
   "Aproximación del press de hombro: 2 series ligeras de 10 y 6"],
  [
   ("Press de hombro sentado con mancuerna", 4, "8-10", 2, "C", False, "press de hombro sentado con mancuernas tecnica",
    "Respaldo del banco a 80-90°. Mancuernas a la altura de las orejas, palmas al frente, codos un poco adelante. Empuja arriba sin chocarlas y baja hasta las orejas. Espalda pegada al respaldo.",
    "Despegar la espalda y arquearte.", "Hombros (frente y lateral)"),
   ("Press inclinado 30° con barra", 3, "8-10", 2, "C", False, "press inclinado con barra tecnica",
    "Banco inclinado a 30°. Mismas claves que el press de banca: escápulas juntas y pies firmes. Baja la barra justo debajo de la clavícula y empuja.",
    "Bajar la barra al cuello o rebotarla.", "Pecho alto y hombro frontal"),
   ("Elevación lateral en polea baja, un brazo", 4, "12-15 por brazo", 0, "U", True, "elevacion lateral en polea baja un brazo tecnica",
    "Polea en lo más bajo. Párate de lado a la máquina y toma el maneral con la mano más lejana, el cable pasa frente a ti. Sube el brazo hacia afuera hasta la altura del hombro. La polea mantiene la tensión todo el recorrido.",
    "Inclinar el torso hacia el otro lado para ayudarte.", "Parte lateral del hombro"),
   ("Extensión de tríceps sobre la cabeza, cuerda", 4, "10-12", 1, "A", False, "extension de triceps sobre la cabeza con cuerda polea",
    "Cuerda en polea alta. Date la vuelta, un pie adelante, torso inclinado y la cuerda detrás de la cabeza. Extiende los brazos al frente y abre la cuerda al final. Codos apuntando al frente y quietos.",
    "Mover los codos hacia abajo como si fuera un press.", "Tríceps (cabeza larga)"),
   ("Press cerrado con barra", 3, "8-10", 1.5, "C", False, "press de banca agarre cerrado tecnica",
    "En banco plano, agarre al ancho de hombros (no más cerrado). Codos pegados al cuerpo. Baja a la parte baja del pecho y empuja.",
    "Agarre demasiado cerrado: lastima las muñecas.", "Tríceps y pecho"),
   ("Paseo del granjero con mancuerna", 2, "30-40 m", 1, "A", False, "paseo del granjero mancuernas tecnica",
    "Mancuernas pesadas a los lados, hombros atrás y abajo, abdomen firme. Camina con pasos cortos y rectos. Si no hay espacio: sostén de pie 40 s.",
    "Inclinarte hacia un lado o encorvarte.", "Antebrazo, trapecio y abdomen"),
  ],
  ["Hombro cruzado al frente: 30 s por lado", "Pecho en poste o marco de puerta: 30 s por lado",
   "Tríceps detrás de la cabeza: 30 s por lado", "Antebrazo, dedos hacia ti: 30 s por lado",
   "Respiración lenta sentado: 1 min"]),

 ("VIERNES", "JALE B", "Volumen: bisagra pesada, espalda, deltoides posterior y bíceps",
  ["3 min de bicicleta o remo ergómetro suave", "Bisagra de cadera con barra sola: 1×10",
   "Aproximación del peso muerto: 40 % ×5, luego 60 % ×3"],
  [
   ("Peso muerto convencional con barra", 3, "5-6", 2.5, "C", False, "peso muerto convencional tecnica",
    "Barra sobre la mitad del pie, pies al ancho de cadera. Agarra justo por fuera de las piernas. Espinillas tocando la barra, pecho arriba, espalda recta. Empuja el piso y sube cadera y hombros a la vez, barra pegada a las piernas. Arriba aprieta glúteo sin echarte atrás. Baja por el mismo camino.",
    "Redondear la espalda baja o alejar la barra del cuerpo.", "Glúteo, femoral y toda la espalda"),
   ("Jalón al pecho, agarre supino cerrado", 4, "8-10", 1.5, "C", False, "jalon al pecho agarre supino cerrado tecnica",
    "Palmas hacia ti, manos al ancho de hombros. Pecho arriba. Jala a la parte alta del pecho llevando los codos hacia las costillas. Sube lento hasta estirar.",
    "Balancearte hacia atrás.", "Dorsales y bíceps"),
   ("Remo sentado en polea, agarre neutro", 4, "10-12", 1.5, "C", False, "remo sentado en polea agarre neutro tecnica",
    "Maneral en V, pies en la plataforma y rodillas dobladas. Torso erguido y quieto. Jala al ombligo con los codos pegados y junta las escápulas. Al regresar deja que los hombros se estiren al frente sin redondear la espalda baja.",
    "Balancear el torso adelante y atrás.", "Espalda media y dorsales"),
   ("Apertura posterior en polea, un brazo", 3, "15 por brazo", 0, "U", True, "apertura posterior en polea un brazo deltoides posterior",
    "Polea a la altura del hombro. De lado a la máquina, toma el cable con la mano más lejana y el brazo estirado frente a ti. Abre el brazo hacia atrás en línea con el hombro hasta quedar en forma de T.",
    "Girar el torso para mover más peso.", "Parte trasera del hombro"),
   ("Curl predicador banco Scott, barra Z", 3, "10-12", 1, "A", False, "curl predicador barra z tecnica",
    "Axilas pegadas al borde del cojín y brazos completamente apoyados. Sube sin despegar los codos. Baja controlado casi hasta estirar, sin bloquear.",
    "Soltar el peso de golpe abajo.", "Bíceps (parte baja)"),
   ("Curl inclinado 45° con mancuerna", 3, "10-12", 1, "A", False, "curl inclinado con mancuernas tecnica",
    "Banco a 45°, espalda pegada, brazos colgando detrás del torso. Sube sin adelantar los codos y baja lento.",
    "Adelantar los hombros y los codos.", "Bíceps estirado (cabeza larga)"),
  ],
  ["Dorsal en poste, cadera atrás: 30 s por lado", "Femoral sentado, alcanza tus pies: 45 s",
   "Bíceps con la palma contra la pared: 30 s por lado", "Espalda baja, rodillas al pecho acostado: 45 s",
   "Respiración lenta: 1 min"]),
]

WORK = {"C": 0.75, "A": 0.6, "U": 1.2}

def work_minutes(exs):
    t, i = 0, 0
    while i < len(exs):
        e = exs[i]
        if e[5]:  # superserie con el siguiente
            f = exs[i+1]
            t += e[1] * (WORK[e[4]] + WORK[f[4]] + f[3] + 0.25)
            i += 2
        else:
            t += e[1] * (WORK[e[4]] + e[3]); i += 1
    t += 0.75 * (len(exs) - 1)  # cambios de estación
    return t

for d in DAYS:
    print(d[0], d[1], "series", sum(e[1] for e in d[4]), "trabajo %.1f min" % work_minutes(d[4]))

W, H = letter
M = 30
cue = ParagraphStyle("c", fontName="Helvetica", fontSize=7.1, leading=8.6, textColor=HexColor("#222222"))
small = ParagraphStyle("s", fontName="Helvetica", fontSize=6.9, leading=8.3, textColor=GRAY)

def qr(c, url, x, y, size):
    w = QrCodeWidget(url); b = w.getBounds()
    d = Drawing(size, size, transform=[size/(b[2]-b[0]), 0, 0, size/(b[3]-b[1]), 0, 0]); d.add(w)
    renderPDF.draw(d, c, x, y)

def rest_txt(r):
    if r == 0: return "ninguno, pasa al siguiente"
    return ("%g min" % r) if r >= 1.5 else ("%d s" % round(r*60))

c = canvas.Canvas("Rutina_Edrei_v11.pdf", pagesize=letter)
c.setTitle("Rutina Edrei v11")
for day, ses, foco, warm, exs, cool in DAYS:
    y = H - M
    c.setFillColor(NAVY); c.rect(M, y-46, W-2*M, 46, fill=1, stroke=0)
    c.setFillColor(ACC); c.rect(M, y-46, 6, 46, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 19); c.drawString(M+16, y-24, "%s  ·  %s" % (day, ses))
    c.setFont("Helvetica", 8.5); c.drawString(M+16, y-38, foco)
    c.setFont("Helvetica-Bold", 10); c.drawRightString(W-M-10, y-22, "60 min")
    c.setFont("Helvetica", 7.5); c.drawRightString(W-M-10, y-35, "6 calentamiento + 47 trabajo + 7 enfriamiento")
    y -= 56
    # calentamiento
    c.setFillColor(SOFT); c.rect(M, y-34, W-2*M, 34, fill=1, stroke=0)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 8.5); c.drawString(M+8, y-12, "CALENTAMIENTO · 6 min")
    c.setFont("Helvetica", 7.6); c.setFillColor(HexColor("#222222"))
    c.drawString(M+8, y-25, "   ·   ".join(warm))
    y -= 42
    # ejercicios
    cardH = 92
    sup_open = False
    for n, e in enumerate(exs, 1):
        name, s, reps, rest, tipo, sup, q, como, err, siente = e
        top = y
        in_ss = sup or sup_open
        c.setFillColor(SS if in_ss else white); c.setStrokeColor(LINE)
        c.rect(M, top-cardH, W-2*M, cardH, fill=1, stroke=1)
        # columna 1
        c.setFillColor(ACC); c.circle(M+16, top-16, 10, fill=1, stroke=0)
        c.setFillColor(white); c.setFont("Helvetica-Bold", 10); c.drawCentredString(M+16, top-19.5, str(n))
        p = Paragraph("<b>%s</b>" % name, ParagraphStyle("n", fontName="Helvetica-Bold", fontSize=9.6, leading=11.2, textColor=NAVY))
        _, ph = p.wrap(150, 40); p.drawOn(c, M+32, top-8-ph)
        c.setFillColor(HexColor("#111111")); c.setFont("Helvetica-Bold", 13)
        c.drawString(M+32, top-50, "%d × %s" % (s, reps))
        c.setFont("Helvetica", 7.6); c.setFillColor(GRAY)
        c.drawString(M+32, top-62, "Descanso: " + rest_txt(rest))
        if sup:
            c.setFillColor(ACC); c.setFont("Helvetica-Bold", 7.4)
            c.drawString(M+32, top-76, "SUPERSERIE con el %d: haz 1 serie de" % (n+1))
            c.drawString(M+32, top-85, "cada uno seguidas y luego descansa")
        elif sup_open:
            c.setFillColor(ACC); c.setFont("Helvetica-Bold", 7.4)
            c.drawString(M+32, top-76, "SUPERSERIE con el %d" % (n-1))
        # columna 2
        x2 = M+186
        para = Paragraph("<b>Cómo:</b> %s" % como, cue); _, h1 = para.wrap(236, 70); para.drawOn(c, x2, top-6-h1)
        p2 = Paragraph("<font color='#E94560'><b>Evita:</b></font> %s &nbsp; <b>Lo sientes en:</b> %s" % (err, siente), small)
        _, h2 = p2.wrap(236, 30); p2.drawOn(c, x2, top-cardH+5)
        # QR
        url = "https://www.youtube.com/results?search_query=" + quote_plus(q)
        qr(c, url, W-M-120, top-62, 54)
        c.setFont("Helvetica", 6); c.setFillColor(GRAY); c.drawCentredString(W-M-93, top-72, "Escanea: ver video")
        # registro
        xr = W-M-60
        c.setFont("Helvetica-Bold", 6.6); c.setFillColor(NAVY); c.drawString(xr, top-12, "PESO (kg)")
        c.setFont("Helvetica", 6.4); c.setFillColor(GRAY)
        for k in range(4):
            yy = top-26-k*16
            c.drawString(xr, yy, "S%d" % (k+1)); c.setStrokeColor(LINE); c.line(xr+12, yy-2, xr+54, yy-2)
        sup_open = sup
        y -= cardH + 3
    # enfriamiento
    y -= 4
    c.setFillColor(SOFT); c.rect(M, y-46, W-2*M, 46, fill=1, stroke=0)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 8.5); c.drawString(M+8, y-12, "ENFRIAMIENTO · 7 min")
    c.setFont("Helvetica", 7.6); c.setFillColor(HexColor("#222222"))
    c.drawString(M+8, y-25, "   ·   ".join(cool[:3])); c.drawString(M+8, y-37, "   ·   ".join(cool[3:]))
    c.setFont("Helvetica", 6.5); c.setFillColor(GRAY)
    c.drawString(M, 18, "Progresión: cuando completes el máximo de reps en todas las series, sube peso (+2.5 kg compuestos, +2 kg analíticos, +5 kg pierna) y vuelve al mínimo de reps.")
    c.showPage()
c.save()
