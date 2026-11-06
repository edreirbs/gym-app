# Spec 003: restablecer un día y fecha en hora de Monterrey

Estado: implementada (6/11/2026).

## Problema

1. Al marcar un día como "Fui" o "No fui" no hay forma de regresarlo a "sin marcar"; solo se puede cambiar a la otra opción.
2. La app toma la fecha del reloj del teléfono. Si el teléfono está en otra zona horaria (viaje, configuración) el "hoy" puede caer en otro día, y si la app se queda abierta después de medianoche no cambia sola.

## Reglas

- R1. Cada día con algo guardado (marca de asistencia, series o ejercicios) muestra **"↺ Restablecer día"**. Borra todo lo de ese día (marca, plan congelado, series) y el día vuelve a su estado automático: pasado = "¿Fuiste?", hoy o futuro = disponible. La semana se recalcula. Aparece un aviso con **Deshacer**.
- R2. "Hoy" siempre se calcula en la zona horaria **America/Monterrey** (UTC-6 todo el año; México quitó el horario de verano en 2022), sin importar la zona del teléfono. La semana va de lunes a domingo en esa zona.
- R3. Al abrir, la app se pone sola en el día de hoy. Si se queda abierta y cambia la fecha en Monterrey (medianoche) o se vuelve a mostrar la pestaña, se recalcula y se pone en el día nuevo.
- R4. Arriba de la tira de la semana se lee la fecha: "Semana del 2 al 8 nov · hoy viernes 6 (hora de Monterrey)".

## Criterios de aceptación

- Con el reloj en 2026-11-05 03:00 UTC (4 nov, 21:00 en Monterrey) la app dice que hoy es miércoles 4.
- Marcar "No fui" y luego "Restablecer día" deja el día igual que antes de marcarlo; Deshacer lo vuelve a marcar.
- Restablecer un día con series registradas las borra y la sesión vuelve al plan.
