# Fechas de vencimiento y tareas vencidas

**Identificador:** FS-118

**Historia:** Como miembro del equipo, quiero poner, cambiar o quitar la fecha de vencimiento de una tarea y ver cuáles se han pasado de plazo para saber de un vistazo qué va tarde sin preguntar a nadie.

## Criterios de aceptación

**Criterio: Fijar una fecha de vencimiento**
- DADO una tarea existente
- CUANDO le asigno una fecha de vencimiento
- ENTONCES la tarea queda con esa fecha de vencimiento

**Criterio: Vencida solo si NO está terminada**
- DADO una tarea cuya fecha de vencimiento ya pasó y que no está terminada
- CUANDO consulto la tarea
- ENTONCES aparece marcada como vencida

**Criterio: Una tarea terminada nunca está vencida**
- DADO una tarea cuya fecha de vencimiento ya pasó y que está terminada
- CUANDO consulto la tarea
- ENTONCES NO aparece como vencida
