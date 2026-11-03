# Filtrar las tareas por estado

**Identificador:** FS-142

**Historia:** Como miembro del equipo, quiero filtrar la lista por estado, con las *Hechas* ocultas por defecto, para centrarme en lo pendiente.

## Criterios de aceptación

Los criterios marcados con **[PROPUESTO]** están pendientes de revisión.

**Criterio: Filtro por defecto**
- DADO que abro la lista sin haber elegido ningún filtro
- CUANDO la miro
- ENTONCES veo las tareas *Por hacer* y *En curso*, y no aparece ninguna *Hecha*

**Criterio: Un solo estado**
- DADO que hay tareas en los tres estados
- CUANDO filtro solo por *En curso*
- ENTONCES veo únicamente las tareas *En curso*

**Criterio: Varios estados a la vez**
- DADO que hay tareas en los tres estados
- CUANDO filtro por *Por hacer* y *Hecha*
- ENTONCES veo las tareas de esos dos estados y ninguna *En curso*

**Criterio: Mostrar las hechas**
- DADO que tengo el filtro por defecto
- CUANDO añado *Hecha* al filtro
- ENTONCES las tareas *Hechas* aparecen junto a las demás

**Criterio: Se ve qué filtro está activo**
- DADO cualquier filtro aplicado
- CUANDO miro la lista
- ENTONCES veo qué estados se están mostrando, indicados por su nombre y no solo por un color

**Criterio: Los cambios de los demás respetan el filtro**
- DADO que filtro por *En curso* y otra persona pasa una tarea de *Por hacer* a *En curso*
- CUANDO vuelvo a mirar la lista
- ENTONCES esa tarea aparece entre las que veo

**Criterio: Pedir un estado que no existe**
- DADO que la lista se abre pidiendo un estado que no existe (por ejemplo, «Bloqueada», o «Vencida», que es una marca y no un estado), desde un enlace compartido o por cualquier otra vía
- CUANDO se intenta aplicar ese filtro
- ENTONCES veo un aviso claro en español que dice que ese estado no existe y cuáles son los válidos (*Por hacer*, *En curso* y *Hecha*), y nunca una lista vacía sin explicación

**Criterio: Qué se muestra después del aviso** **[PROPUESTO]**
- DADO que se pidió un estado que no existe
- CUANDO aparece el aviso
- ENTONCES ese filtro no se aplica, y veo la lista con el filtro por defecto

**Criterio: Mezcla de estados válidos e inválidos** **[PROPUESTO]**
- DADO que se pide *En curso* junto con un estado que no existe
- CUANDO se aplica el filtro
- ENTONCES veo el aviso por el estado que no existe, y la lista se filtra por *En curso*, que sí es válido

**Criterio: Filtro válido sin resultados** **[PROPUESTO]**
- DADO que no hay ninguna tarea *En curso*
- CUANDO filtro por *En curso*
- ENTONCES veo un mensaje que dice que no hay tareas en ese estado, distinto del aviso de estado inexistente

**Criterio: Quitar todos los estados** **[PROPUESTO]**
- DADO que tengo un solo estado seleccionado en el filtro
- CUANDO intento quitarlo
- ENTONCES no puedo dejar el filtro sin ningún estado: siempre queda al menos uno

**Criterio: Una tarea deja de cumplir el filtro** **[PROPUESTO]**
- DADO que filtro por *En curso*
- CUANDO paso una de esas tareas a *Hecha*
- ENTONCES desaparece de lo que veo en ese mismo momento, porque ya no cumple el filtro

**Criterio: Crear una tarea que el filtro oculta** **[PROPUESTO]**
- DADO que filtro solo por *En curso*
- CUANDO creo una tarea, que nace en *Por hacer*
- ENTONCES veo una confirmación de que se creó, aunque el filtro la oculte, para que no parezca perdida

**Criterio: El filtro es personal** **[PROPUESTO]**
- DADO que filtro la lista de una manera
- CUANDO otra persona mira su lista
- ENTONCES ve su propio filtro, no el mío

**Criterio: Al volver, el filtro por defecto** **[PROPUESTO]**
- DADO que había cambiado el filtro
- CUANDO vuelvo a abrir la lista más tarde
- ENTONCES vuelve a estar el filtro por defecto
