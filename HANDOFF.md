# Handoff: estado al 6 de noviembre de 2026

Todo esto se construyó en un chat de Claude (Proyecto GIMNASIO en claude.ai) y se pasa a Claude Code en la nube. Lee también `CLAUDE.md` (reglas y cómo trabajar) y los planes en `docs/`.

## Actualización 6/11/2026 (Claude Code)

- El repo `edreirbs/gym-app` es la fuente. La app se publica en **GitHub Pages** desde `main` (ya no depende del artifact).
- **Edrei v14: semana adaptativa.** Sesiones Día 1 a Día 5 en vez de lunes a viernes; marca si fue o no y, si falta, lo pendiente se reacomoda en los días que quedan. Spec: `specs/001-semana-adaptativa/`. Código: `edrei/semana.js` + `edrei/rutina.html`.

## App de Edrei: "Rutina Edrei v13" (v13.1)

- Publicada: https://claude.ai/artifact/9xhZVPT7q1oaZhBXobVvt3 · fuente: `edrei/rutina.html`.
- Edrei: 1.91 m, ~105 kg, recomposición; prioridad hombros, espalda y brazos completos; mantener piernas. Lunes a viernes, 60 min exactos, gimnasio lleno, sin entrenador.
- **Rutina:** 6 ejercicios por día en 3 superseries de 2 ejercicios distintos (así entrena él). Detalle completo, series, descansos y modelo de tiempo en `docs/plan-base-edrei.md`. Todas las series terminan entre el minuto 42 y 47.5.
- **Página:** pestañas por día con los colores de los discos olímpicos; por ejercicio: figura 3D que se gira con el dedo (vistas Frente/Lado/Atrás/Arriba, pausa, panel "Datos" con ángulos y claves ✓), series, intensidad (RIR 2 / RIR 1 / última al fallo), plan B si está ocupado, "Cómo se hace" y enlace a videos.
- **Registro del día (pedido por Edrei el 5/11):** tocar cada serie al terminarla; en la serie del ejercicio B arranca solo el descanso y la cuenta se ve en la barra fija de arriba; "✓ Ya lo hice" apaga el ejercicio (se encoge a una línea con "Reactivar") y también se apaga solo al marcar todas sus series; barra "Hoy: X de 6" con botones 1A a 3B; palomita en la pestaña al completar el día; aviso con "Deshacer". Se guarda en el teléfono por fecha (`ed13:d:AAAA-MM-DD`).
- **Cambios recientes:** v13 (5/11): de 5 ejercicios en 4 bloques a 6 en 3 superseries; nuevas figuras 3D de crunch en polea, aductores y leñador. v13.1 (5/11): el Pallof press se quitó porque no le gustó y no le entendía; ahora es leñador en polea alta (martes y viernes). La función de pose `pallof` sigue en el código pero no se usa.

## App de Zuly: "Rutina Zuly" (fase 2)

- Publicada: https://claude.ai/artifact/XK9TgM4aTcBuQXYYMYq9su (privada; Edrei la comparte con ella) · fuentes: `zuly/src/`, build con `python3 zuly/build.py`.
- Zuly (novia de Edrei): 31 años, 63 kg, estatura sin confirmar (modelo de 1.62 m). Meta: recomposición y glúteo en forma de "P", cuerpo completo. Cuidados: **pata de ganso** (rodilla) y **rectificación cervical**. Prefiere peso libre para no esperar máquinas. Mismas condiciones que Edrei (L-V, 60 min, gimnasio lleno).
- Basada en su propio plan de fase 2 (`docs/zuly_fase2_plan_original.pdf`, 2 al 29 nov): se respetó su división, su sistema de riesgo por ejercicio (bajo / medio / alto), su regla de dolor (0-3 sigue, 4 baja 20%, 5+ para), las claves de cuello y la readaptación de femoral y aductor. Su sábado pasó a viernes.
- **Página pensada para TDA:** un color fijo por tipo de día (turquesa torso, violeta glúteo, azul pierna), un solo acento naranja para "lo que toca ahora" (barra inferior con "Hecha ✓", descanso con pitido 10 s antes y al final, vibración y pantalla encendida), bloques con minuto meta y reloj de sesión, termómetro de rodilla 0 a 10 antes de empezar, reglas de la semana (semana 4 = descarga automática), pestaña "Guía" con comida, razones y fuentes. Se guarda en el teléfono por semana (`zuly2:*`).
- Validado el 3/11: todas las claves de técnica pasan; recortes menores en el piso (plancha lateral -2.0 cm, patada en polea -2.4 cm).

## Pendientes

- **Edrei:** recalcular calorías con su InBody del 23/10 (no lo ha compartido aún). El PDF de una hoja por día (`edrei/pdf`) es de v11: rehacerlo para v13.1 si lo pide (`v11.py` sirve de base, hay que cambiarle los datos). El registro en Excel de v10 está desactualizado.
- **Zuly:** falta su estatura y su actividad diaria (pasos) para calcular calorías. Su fase 2 termina el 29 de noviembre: planear fase 3. Su lunes todavía tiene Pallof como extra opcional (el cambio de Edrei fue solo en su app; preguntar si también lo quiere quitar de la de Zuly).

## Prompt para arrancar la sesión nueva

> Lee CLAUDE.md, HANDOFF.md y los planes en docs/. Prepara el entorno (npm install y Playwright), corre las pruebas de las dos apps (tools/edrei_ui_test.py y tools/zuly_ui_test.py) y dime en dos líneas si todo carga bien. Luego espera mis cambios.
