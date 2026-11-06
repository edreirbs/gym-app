# Plan técnico: spec 001

## Piezas

- `edrei/semana.js`: funciones puras (sin DOM ni localStorage), cargado con `<script src>` antes del script principal.
  - `pairsOf(DAYS, blocksOf)`: la unidad es la superserie (A y B), con su tiempo (`min`), músculos, series e intensidad.
  - `plan({pairs, consumed, doneVol, slots, MUS})`: devuelve `{days, dropped, merged}`.
  - `check(grupo)`: reglas del día (para pruebas).
- `edrei/rutina.html`: capa de estado y UI.
  - `buildWeek()`: lee registros por fecha, calcula el estado de cada día (`fui`, `no`, `supuesto`, `open`, `off`), lo hecho (superseries y volumen) y los días disponibles; usa el plan guardado si sigue válido o llama a `Semana.plan`.
  - `sessionOf(refs)`: arma una sesión con el mismo formato que `DAYS`, así el render, el registro de series y el descanso no cambian.
  - Tira de la semana (`#week`), pestañas Día N dinámicas, botones "Hoy no puedo ir", "Sí fui / No fui", "Hacerla hoy".

## Algoritmo de `plan`

1. Pendientes = superseries no hechas. Si están completas por sesión y caben, se devuelven tal cual (A1).
2. Si no caben: k = min(días, ceil(pendientes / 3)).
3. Selección voraz: primero la sentadilla; luego, la superserie con más **valor por minuto** dado el volumen ya hecho. Valor = suma por músculo de peso × (log2(1 + series después) − log2(1 + series antes)). Solo se acepta si aún existe un reparto válido en k días.
4. Reparto: búsqueda exhaustiva (máximo 15,400 repartos para 12 superseries en 4 días) con reglas duras (`okGroup`) y una puntuación: misma sesión de origen +3, misma familia (empuje, jale, pierna) +1, tamaños parejos, −4 si hay básico pesado de pierna dos días seguidos.
5. Orden: días por su sesión de origen; dentro del día, básicos RIR 2 primero (o el orden original si todo viene de una sesión).

## Datos

- `ed13:d:AAAA-MM-DD`: se agregan `att` y `plan` al registro existente. Sin `plan` se interpreta como la sesión del día de la semana (v13).
- `ed13:w:<lunes>`: `{slots, proj, dropped, merged}`. Válido mientras los días disponibles sean los esperados y lo planeado más lo que salió sea igual a lo pendiente (R6).

## Pruebas

- `node tools/edrei_semana_test.js`: 32 patrones × 5 días (480 días planeados) contra las reglas.
- `python3 tools/edrei_ui_test.py`: escenarios con fecha fija (lunes, miércoles con registro viejo, viernes, sábado), deshacer, intercambio, estabilidad al recargar, consola y desbordamiento.
