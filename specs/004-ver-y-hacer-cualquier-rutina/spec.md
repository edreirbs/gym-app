# Spec 004: ver y hacer cualquier rutina

Estado: implementada (6/11/2026).

## Problema

El calendario (spec 001 a 003) decidía qué se podía registrar: en un día planeado que no era hoy las series estaban deshabilitadas, y las sesiones que salían de la semana al reacomodarla (por ejemplo, Jale B) ya no se podían ver. Edrei quiere que el calendario sugiera, no que lo encierre: ver cualquier rutina cuando quiera y hacer la que quiera.

## Reglas

- R1. Arriba de las pestañas hay un selector **Mi semana / Las 5 rutinas**.
  - Mi semana: el plan con calendario (como antes).
  - Las 5 rutinas: Día 1 a Día 5 originales y completos, siempre visibles, sin importar el día ni lo que se reacomodó.
- R2. En cualquier pestaña las series y "✓ Ya lo hice" están activos. Si la sesión no es la de hoy, la primera serie que toques (o el botón **Hacerla hoy**) la vuelve tu sesión de hoy, la app cambia a Mi semana en hoy y registra esa serie. La semana se recalcula con lo que hiciste.
- R3. Si hoy ya tenías series de otra sesión, la app pregunta antes de cambiar (se borran las de hoy). Siempre hay Deshacer.
- R4. En días del plan que no son hoy, "Hacerla hoy" intercambia con hoy si hoy no tiene nada registrado (como antes); si hoy ya tiene algo, adopta esa sesión para hoy con la regla R3.
- R5. El calendario sigue sugiriendo: al abrir, la app se pone en la sesión de hoy.

## Criterios de aceptación

- En Las 5 rutinas se ven 5 pestañas con las sesiones originales completas, incluso con la semana reacomodada.
- Tocar una serie de Jale B (Las 5 rutinas) un día sin registro deja hoy como Jale B, con esa serie marcada, en Mi semana.
- Sin errores de consola y sin desbordamiento.
