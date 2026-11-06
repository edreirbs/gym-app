# Spec 002: reacomodo por tipo de día

Estado: implementada (6/11/2026). Reemplaza la regla R5 de la spec 001.

## Problema

En la primera versión, si Edrei faltaba, la app repartía todas las superseries pendientes "como mejor sumaran". El resultado era correcto según las reglas, pero salían días difíciles de entender (por ejemplo press de banca + peso muerto + remo) y se perdía la estructura de empuje, jale y pierna. Edrei pidió que se respete su rutina y que solo se reconfigure un poco.

## Regla nueva

1. La unidad es la **sesión** (Día 1 a Día 5). Si ya hiciste algo de una sesión, cuenta como hecha.
2. Si las sesiones pendientes caben en los días disponibles, solo se recorren (sin cambios).
3. Si no caben, se junta lo mínimo, una vez por cada día que falte, en este orden:
   1. Jale A + Jale B = un día de **Jale** (el plan dice: si pierdes una, que sea Jale B).
   2. Empuje A + Empuje B = un día de **Empuje**.
   3. Empuje + Jale = **Torso**. La pierna se queda sola.
   4. Si solo queda un día: **Cuerpo completo** (sentadilla y lo más valioso de torso que quepa en 60 min).
4. El orden de los días sigue el de la rutina (por la sesión de origen más temprana): por ejemplo, Empuje A, Jale, Pierna, Empuje B.
5. Un día juntado tiene 3 lugares y cada uno conserva su papel:
   - Mismo tipo: lugar 1 = superserie 1 de A o de B, lugar 2 = superserie 2 de A o de B, lugar 3 = superserie 3 de A o de B.
   - Torso: 1 = empuje pesado, 2 = remo o jalón (sin peso muerto), 3 = analítico de cualquiera.
   - Cuerpo completo: 1 = sentadilla, 2 = básico de torso, 3 = analítico (si cabe).
   - En cada lugar gana la opción con más valor por minuto (volumen semanal con rendimientos decrecientes y pesos por prioridad, como en la spec 001). Empate: la sesión más temprana.
6. Se mantienen las reglas duras: minuto 48, máximo 6 ejercicios, un remo por día, sin sentadilla y peso muerto juntos, sin repetir ejercicio.
7. La app dice qué se juntó ("Jale A + Jale B = Jale") y explica la escalera en "Cómo se reacomoda".

## Criterios de aceptación

- Faltar el martes: Empuje A (hecho), Jale, Pierna, Empuje B.
- Faltar el miércoles y no ir el jueves: Pierna y Torso.
- Los 480 días planeados de la prueba cumplen las reglas duras y la sentadilla nunca sale.
- Un plan guardado con la lógica anterior se recalcula (versión `v: 2` en `ed13:w:`).
