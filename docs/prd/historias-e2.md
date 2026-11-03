# Historias de E2 «Gestión de tareas»

- **Base:** [`flowsync-mvp.md`](flowsync-mvp.md). Las referencias RF-, RNF- y PA- apuntan a ese PRD.
- **Rol:** siempre "miembro del equipo". Los roles son planos y no hay otro.
- **Leyenda:**
  - Sin marca: el criterio sale directamente del PRD (se indica el requisito).
  - **[PROPUESTO]**: no sale del PRD y está pendiente de revisión.
  - **[BLOQUEADO PA-n]**: no se puede cerrar hasta decidir ese punto abierto.

---

## FS-118: Fecha de vencimiento y tareas vencidas

**Como** miembro del equipo, **quiero** poner, cambiar o quitar la fecha de vencimiento de una tarea y ver cuáles se han pasado de plazo, **para** saber de un vistazo qué va tarde sin preguntar a nadie.

Requisitos: RF-25, RF-26, RNF-9 y RNF-10. Esta historia junta lo que en la descomposición inicial eran tres historias: poner o cambiar la fecha, quitarla y ver las vencidas.

> **No se puede cerrar todavía.** Su regla central (CA-9) depende de PA-12: falta decidir en qué momento vence una tarea para un equipo repartido en varios husos horarios.

### Poner y cambiar la fecha

**CA-1. Crear una tarea con fecha** (RF-25)
- DADO que estoy en la lista con la sesión iniciada
- CUANDO creo una tarea con título y fecha de vencimiento
- ENTONCES la tarea aparece en la lista con esa fecha junto a su título

**CA-2. Crear una tarea sin fecha** (RF-7, RF-25)
- DADO que estoy en la lista
- CUANDO creo una tarea escribiendo solo el título
- ENTONCES la tarea se crea igual, sin fecha y sin marca de «Vencida»

**CA-3. Poner fecha a una tarea que ya existe** (RF-25)
- DADO una tarea sin fecha
- CUANDO le pongo una fecha de vencimiento
- ENTONCES la lista muestra esa fecha junto a la tarea

**CA-4. Cambiar la fecha** (RF-25)
- DADO una tarea con fecha
- CUANDO le pongo otra fecha
- ENTONCES la lista muestra solo la nueva fecha

**CA-5. Cualquiera puede ponerla, aunque la tarea no sea suya** (RF-25)
- DADO una tarea que es de otra persona, o que está «Libre»
- CUANDO le pongo o le cambio la fecha
- ENTONCES el cambio se guarda igual que si fuera mía

**CA-6. Los demás ven el cambio** (RF-21)
- DADO que otra persona cambió la fecha de una tarea
- CUANDO abro la lista o vuelvo a mirarla
- ENTONCES veo la fecha nueva sin recargar a mano

### Quitar la fecha

**CA-7. Quitar la fecha** (RF-25)
- DADO una tarea con fecha
- CUANDO le quito la fecha
- ENTONCES la tarea deja de mostrar fecha y nunca aparece como «Vencida»

**CA-8. Quitar la fecha a una tarea vencida** (RF-25, RF-26)
- DADO una tarea marcada como «Vencida»
- CUANDO le quito la fecha
- ENTONCES deja de aparecer como «Vencida»

### Ver qué está vencido

**CA-9. Una tarea pasa a vencida** (RF-26) **[BLOQUEADO PA-12]**
- DADO una tarea que no está *Hecha*, con fecha de vencimiento
- CUANDO termina el día de su fecha
- ENTONCES aparece marcada con el texto «Vencida»

*Falta definir con qué reloj "termina el día" en un equipo repartido en 3 husos horarios.*

**CA-10. Todavía no vence el mismo día** **[PROPUESTO]** **[BLOQUEADO PA-12]**
- DADO una tarea cuya fecha de vencimiento es hoy
- CUANDO miro la lista durante ese día
- ENTONCES no aparece como «Vencida»

*Motivo: "vence el martes" se suele entender como "se puede entregar el martes".*

**CA-11. Una tarea hecha nunca está vencida** (RF-26)
- DADO una tarea con fecha ya pasada
- CUANDO está o pasa a *Hecha*
- ENTONCES no aparece como «Vencida»

**CA-12. La fecha de una tarea hecha se sigue viendo** **[PROPUESTO]**
- DADO una tarea *Hecha* con fecha
- CUANDO muestro las *Hechas* en el filtro
- ENTONCES se ve su fecha, sin la marca «Vencida»

**CA-13. Reabrir una tarea con fecha pasada** (RF-14, RF-26)
- DADO una tarea *Hecha* cuya fecha ya pasó
- CUANDO alguien la vuelve a poner en *Por hacer* o *En curso*
- ENTONCES vuelve a aparecer como «Vencida»

**CA-14. Mover la fecha al futuro** (RF-25, RF-26)
- DADO una tarea marcada como «Vencida»
- CUANDO le pongo una fecha futura
- ENTONCES deja de aparecer como «Vencida»

**CA-15. Vence mientras no estaba mirando** (RF-21)
- DADO que una tarea venció desde la última vez que miré la lista
- CUANDO abro la lista o vuelvo a mirarla
- ENTONCES ya aparece como «Vencida»

*Si la lista se queda abierta todo el día sin volver a mirarla, no hay garantía de que se actualice (PA-5).*

**CA-16. «Vencida» se distingue por texto** (RF-26, RNF-9)
- DADO una tarea vencida
- CUANDO la miro
- ENTONCES la distingo por el texto «Vencida», no solo por un color

### Errores y casos límite

**CA-17. Fecha que no existe** **[PROPUESTO]**
- DADO que estoy poniendo una fecha
- CUANDO escribo una fecha que no existe en el calendario (por ejemplo, el 31 de febrero)
- ENTONCES veo un mensaje claro en español, y la tarea mantiene la fecha que tenía antes (o ninguna, si no tenía)

**CA-18. Fecha en el pasado** **[PROPUESTO]**
- DADO que estoy creando una tarea o cambiando su fecha
- CUANDO elijo una fecha que ya pasó
- ENTONCES se acepta, y la tarea aparece como «Vencida» en ese momento si no está *Hecha*

*Motivo: un equipo que llega desde su gestor anterior trae tareas que ya van tarde (PA-2). Rechazar esas fechas lo obligaría a mentir sobre el plazo.*

**CA-19. Título inválido con fecha** (RF-8)
- DADO que estoy creando una tarea con fecha, pero sin título
- CUANDO intento crearla
- ENTONCES la tarea no se crea, y veo el mismo mensaje que sin fecha

**CA-20. Falla al guardar** (RF-22)
- DADO que cambio o quito la fecha de una tarea
- CUANDO el cambio no se puede guardar
- ENTONCES veo un mensaje de error, y la tarea muestra la fecha que tenía antes, no la que intenté poner

**CA-21. Dos personas cambian la fecha a la vez** **[PROPUESTO]** (RNF-5)
- DADO que dos personas cambian la fecha de la misma tarea casi a la vez
- CUANDO las dos vuelven a mirar la lista
- ENTONCES ambas ven la misma fecha: la del último cambio que se guardó

*Motivo: RNF-5 exige que las dos vean lo mismo, pero no dice qué cambio prevalece.*

**CA-22. La fecha se lee igual en cualquier país** **[PROPUESTO]**
- DADO una tarea con fecha
- CUANDO la ve cualquier persona del equipo
- ENTONCES la fecha aparece con el mes en letras (por ejemplo, «12 nov»), para que nadie confunda 03/04 con 04/03

### Fuera de esta historia
- Ordenar por fecha, filtrar por «Vencida» y avisar de que algo va a vencer: están fuera de alcance (PRD, sección 4). «Vencida» es una marca, no un estado.
- La exigencia de tener la sesión iniciada: ya está cubierta en E1 (RF-5).

---

## FS-142: Filtrar las tareas por estado

**Como** miembro del equipo, **quiero** filtrar la lista por estado, con las *Hechas* ocultas por defecto, **para** centrarme en lo pendiente.

Requisitos: RF-19 y RNF-9.

### Camino feliz

**CA-1. Filtro por defecto** (RF-19)
- DADO que abro la lista sin haber elegido ningún filtro
- CUANDO la miro
- ENTONCES veo las tareas *Por hacer* y *En curso*, y no aparece ninguna *Hecha*

**CA-2. Un solo estado** (RF-19)
- DADO que hay tareas en los tres estados
- CUANDO filtro solo por *En curso*
- ENTONCES veo únicamente las tareas *En curso*

**CA-3. Varios estados a la vez** (RF-19)
- DADO que hay tareas en los tres estados
- CUANDO filtro por *Por hacer* y *Hecha*
- ENTONCES veo las tareas de esos dos estados y ninguna *En curso*

**CA-4. Mostrar las hechas** (RF-19)
- DADO que tengo el filtro por defecto
- CUANDO añado *Hecha* al filtro
- ENTONCES las tareas *Hechas* aparecen junto a las demás

**CA-5. Se ve qué filtro está activo** (RF-19, RNF-9)
- DADO cualquier filtro aplicado
- CUANDO miro la lista
- ENTONCES veo qué estados se están mostrando, indicados por su nombre y no solo por un color

**CA-6. Los cambios de los demás respetan el filtro** (RF-21)
- DADO que filtro por *En curso* y otra persona pasa una tarea de *Por hacer* a *En curso*
- CUANDO vuelvo a mirar la lista
- ENTONCES esa tarea aparece entre las que veo

### Estado que no existe

**CA-7. Pedir un estado que no existe**
- DADO que la lista se abre pidiendo un estado que no existe (por ejemplo, «Bloqueada», o «Vencida», que es una marca y no un estado), sea desde un enlace compartido o por cualquier otra vía
- CUANDO se intenta aplicar ese filtro
- ENTONCES veo un aviso claro en español que dice que ese estado no existe y cuáles son los válidos (*Por hacer*, *En curso* y *Hecha*), y nunca una lista vacía sin explicación

**CA-8. Qué se muestra después del aviso** **[PROPUESTO]**
- DADO que se pidió un estado que no existe
- CUANDO aparece el aviso
- ENTONCES ese filtro no se aplica, y veo la lista con el filtro por defecto

**CA-9. Mezcla de estados válidos e inválidos** **[PROPUESTO]**
- DADO que se pide *En curso* junto con un estado que no existe
- CUANDO se aplica el filtro
- ENTONCES veo el aviso por el estado que no existe, y la lista filtra por *En curso*, que sí es válido

### Casos límite

**CA-10. Filtro válido sin resultados** **[PROPUESTO]**
- DADO que no hay ninguna tarea *En curso*
- CUANDO filtro por *En curso*
- ENTONCES veo un mensaje que dice que no hay tareas en ese estado, distinto del aviso de estado inexistente

*Motivo: que "no hay nada" no se confunda con "has pedido algo que no existe".*

**CA-11. Quitar todos los estados** **[PROPUESTO]**
- DADO que tengo un solo estado seleccionado en el filtro
- CUANDO intento quitarlo
- ENTONCES no puedo dejar el filtro sin ningún estado: siempre queda al menos uno

**CA-12. Una tarea deja de cumplir el filtro** **[PROPUESTO]** (RF-22)
- DADO que filtro por *En curso*
- CUANDO paso una de esas tareas a *Hecha*
- ENTONCES desaparece de lo que veo en ese mismo momento, porque ya no cumple el filtro

**CA-13. Crear una tarea que el filtro oculta** **[PROPUESTO]**
- DADO que filtro solo por *En curso*
- CUANDO creo una tarea, que nace en *Por hacer* (RF-9)
- ENTONCES veo una confirmación de que se creó, aunque el filtro la oculte, para que no parezca perdida

**CA-14. El filtro es personal** **[PROPUESTO]**
- DADO que filtro la lista de una manera
- CUANDO otra persona mira su lista
- ENTONCES ve su propio filtro, no el mío

**CA-15. Al volver, el filtro por defecto** **[PROPUESTO]**
- DADO que había cambiado el filtro
- CUANDO vuelvo a abrir la lista más tarde
- ENTONCES vuelve a estar el filtro por defecto

*Decisión de producto pendiente: la alternativa es recordar el último filtro de cada persona.*

### Fuera de esta historia
- Filtrar por responsable, por fecha o por «Vencida»: fuera de alcance (solo se filtra por estado).
- Contadores de tareas por estado.
