# Spec 001: semana adaptativa (Día 1 a Día 5)

Estado: implementada en v14 (6/11/2026). App: `edrei/rutina.html` + `edrei/semana.js`.

## Problema

La rutina v13.1 está atada a los días de la semana (lunes = Empuje A, etc.). Edrei no siempre puede ir los 5 días. Si falta, la app no se entera: el día perdido se pierde completo, aunque sea lo más importante de la semana (por ejemplo, la pierna del miércoles).

## Objetivo

Las sesiones se llaman **Día 1 a Día 5** y son una cola: cada vez que va al gimnasio hace la siguiente. Edrei le dice a la app si fue o no; cuando quedan menos días disponibles que sesiones, la app **reacomoda lo que falta** en los días que quedan, con base en sus prioridades y en la evidencia, sin romper las reglas de `docs/plan-base-edrei.md`.

## Historias

1. **Voy todos los días.** Veo Día 1 a Día 5 como siempre; hoy se abre solo. Nada cambia.
2. **No fui ayer.** Al abrir la app hoy, ayer aparece como "no fuiste (supuesto)", con botones "Sí fui / No fui". La semana se reacomoda para los días que quedan y un aviso me dice qué junté y qué quité.
3. **Hoy no puedo.** Toco "Hoy no puedo ir" y la sesión de hoy se mueve; si ya no caben todas, se fusionan. Puedo deshacer.
4. **Sé que el jueves no podré.** Marco el jueves como "No podré ir" desde antes y la semana se ajusta.
5. **Sí fui pero no lo registré.** Marco ese día como "Sí fui" y se le asigna la sesión que tocaba.
6. **Quiero hacer otra sesión hoy** (estación ocupada, me duele algo). En otro día planeado toco "Hacerla hoy" y se intercambian.
7. **Fin de semana.** Si quedaron sesiones pendientes, el sábado o domingo de hoy aparece como día opcional.

## Reglas funcionales

- R1. La semana va de lunes a domingo. Días disponibles: hoy (si no dije que no) y los días hábiles futuros que no marqué como "No podré". Cada semana empieza limpia en Día 1.
- R2. Un día cuenta como "fui" si lo marqué así o si registré alguna serie o ejercicio. Un día pasado sin registro se supone "no fui" (y se puede corregir).
- R3. Lo hecho no cambia: la sesión de un día "fui" queda congelada (se guarda en su registro). Hoy se congela al registrar la primera serie.
- R4. Si las sesiones pendientes caben en los días disponibles, se hacen tal cual, en orden.
- R5. Si no caben: se juntan sesiones por tipo de día. **Reemplazada por la spec 002** (la primera versión repartía superseries libremente y era difícil de entender).
- R6. El plan es estable: si sigo el plan, no se recalcula. Solo cambia cuando cambia la asistencia (falté, marco un día, cambia la disponibilidad).
- R7. La app explica el ajuste: cuántas sesiones en cuántos días, qué superseries se juntaron y qué ejercicios quedaron fuera esta semana.

## Reglas del coach que el ajuste no rompe

Todas las de `docs/plan-base-edrei.md`, en especial:

- 60 min exactos: el trabajo termina antes del minuto 48 (modelo `blocksOf`). Máximo 6 ejercicios en 3 superseries.
- Máximo un remo por día. Sin ejercicios repetidos en el mismo día.
- No juntar sentadilla y peso muerto el mismo día (dos básicos pesados de pierna con barra, sin spotter, en déficit).
- La pierna nunca se pierde: la superserie de sentadilla siempre entra si está pendiente ("Nunca el miércoles de pierna").
- Orden dentro del día: básicos con barra (RIR 2) primero, luego compuestos (RIR 1), luego analíticos.
- Las superseries se mueven completas (A y B juntos), porque ya están pensadas para la misma estación.

## Base científica del ajuste

- **El volumen semanal manda, con rendimientos decrecientes** (Schoenfeld, Ogborn y Krieger, 2017; Pelland y cols., 2024). Por eso cada superserie vale por las series que aporta a cada músculo, con una curva logarítmica: la primera serie de un músculo sin trabajar vale más que la décima de uno ya trabajado.
- **Series indirectas cuentan la mitad** (conteo fraccional, Pelland y cols., 2024): músculo principal = 1, secundarios = 0.5.
- **Con volumen igual, la frecuencia importa poco** (Schoenfeld, Grgic y Krieger, 2019): juntar dos sesiones en una conserva casi todo el estímulo si se conservan las series.
- **Mantener cuesta poco** (Bickel, Cross y Bamman, 2011; Spiering y cols., 2021): un tercio del volumen con la misma intensidad mantiene músculo. Por eso la pierna pesa algo menos que los grupos prioritarios, pero nunca se queda en cero.
- **Prioridad estética de Edrei** (hombros, espalda y brazos completos) pesa 1.0; pecho y pierna 0.8; core, pantorrilla, aductores, trapecio y espalda baja 0.4 a 0.5. Estos pesos son criterio del coach, no un dato de la literatura.

## Fuera de alcance

- Agregar series extra para compensar lo que se quitó (no cabe en 60 min).
- Correr la cola a la semana siguiente (la semana siempre reinicia en Día 1).
- Sincronizar entre dispositivos (todo se guarda en el teléfono).

## Criterios de aceptación

- A1. Con asistencia completa, el plan es idéntico a v13.1 (5 sesiones, mismo orden y ejercicios).
- A2. Para los 32 patrones de asistencia de lunes a viernes, y para cada día de la semana como "hoy", todos los días planeados cumplen: minuto ≤ 48, ≤ 6 ejercicios, ≤ 1 remo, sin repetidos, sin sentadilla con peso muerto, y la sentadilla entra si está pendiente.
- A3. Seguir el plan no lo cambia (estabilidad).
- A4. Los registros viejos (`ed13:d:AAAA-MM-DD` sin plan) se leen como la sesión de ese día de la semana. No se cambian las claves.
- A5. Sin errores de consola y sin desbordamiento horizontal en móvil (390 px) y escritorio.
