# PRD: FlowSync MVP

- **Base:** [`alcance-mvp.md`](alcance-mvp.md), el alcance acordado. Si este PRD y ese documento se contradicen, manda el alcance hasta que se actualice.
- **Estado:** borrador.
- **Marcas:** `[SUPUESTO]` señala algo que no está validado. `[EXISTENTE]` señala algo que el producto ya hace hoy.

## 1. Problema y contexto

En un equipo remoto pequeño, nadie ve en qué está cada uno sin interrumpir a alguien. Hoy eso cuesta dos cosas:

- **La ronda de "¿en qué estás?"** ocupa la mitad de una daily de 15 minutos, y se repite en mensajes sueltos por chat.
- **Las colisiones:** dos personas empiezan lo mismo sin saberlo. Episodio de referencia: el mismo módulo, la misma semana, dos días perdidos.

La daily no desaparece entera: solo su ronda de estado. La parte de bloqueos sigue, y este MVP no la resuelve.

**Contexto del producto.** Hoy FlowSync solo tiene cuentas de usuario: registro, inicio de sesión, perfil y cierre de sesión. Las tareas no existen. El MVP añade una sola vertical, usable de punta a punta: una lista compartida de tareas. No se construye el andamiaje amplio de un producto completo.

**Regla de recorte.** Solo entra lo necesario para pasar la prueba de una semana (ver la sección 9).

## 2. Usuarios y jobs-to-be-done

**Usuario:** cada miembro de un equipo remoto pequeño, de 3 a 10 personas, con roles planos. Todos ven y hacen lo mismo. No hay manager ni reporte hacia arriba.

**Primer usuario: un caso de estudio, no un cliente real.** Es un equipo de 6 personas de un producto SaaS, repartido en 3 husos horarios. Hoy usa un gestor de tareas pesado y una daily de 15 minutos por videollamada. Todo lo que este PRD dice sobre su uso es una hipótesis.

**Jobs-to-be-done:**

- **JTBD-1:** Cuando voy a empezar algo, quiero saber si otra persona ya lo está tocando, para no duplicar trabajo.
- **JTBD-2:** Cuando termino una tarea, quiero ver qué está libre, para elegir lo siguiente sin preguntar a nadie.
- **JTBD-3:** Cuando llego por la mañana o vuelvo de una reunión, quiero ver en qué está el equipo, para no tener que interrumpir a nadie ni esperar a la daily.
- **JTBD-4:** Cuando cambio lo que estoy haciendo, quiero reflejarlo en segundos, para que nadie tenga que preguntarme cómo va.

## 3. Propuesta de valor

Una lista compartida que es a la vez **la cola de trabajo de cada uno** y **el estado del equipo**.

- Coger una tarea o cambiarle el estado cuesta dos clics. Para crearla solo hace falta escribir el título, y no hay nada que configurar.
- Quien la actualiza cobra en el momento: mira la lista para decidir qué coge, y deja de recibir preguntas sobre cómo va lo suyo.
- Mejora dos decisiones concretas: no empezar algo que otra persona ya está tocando, y elegir lo siguiente sabiendo qué está libre. "Sentirse informado" no cuenta como valor.
- FlowSync es donde se hace el trabajo, no donde se cuenta. **Sustituye** al gestor de tareas, no convive con él.

## 4. Alcance / Fuera de alcance

### Alcance

1. **Ver la lista compartida.** Un único espacio para todas las personas registradas. Cada tarea muestra título, responsable y estado. Las tareas hechas quedan ocultas por defecto.
2. **Crear una tarea solo con el título.** Nace en *Por hacer* y sin responsable, o sea, libre.
3. **Cogerla o soltarla.** Asignármela a mí, o dejar de ser su responsable.
4. **Cambiar el estado en dos clics.** Tres estados fijos: *Por hacer*, *En curso* y *Hecha*.
5. **Ver la lista al día cada vez que la miras**, sin recargar a mano.
6. **Fecha de vencimiento opcional.** Para ver de un vistazo qué se ha pasado de plazo.
7. **Filtrar la lista por estado**, para centrarse en lo pendiente.

### Fuera de alcance

La justificación de cada exclusión está en [`alcance-mvp.md`, bloque 5](alcance-mvp.md#5-no-alcance-queda-fuera).

- Asignar una tarea a otra persona.
- Filtros por cualquier cosa que no sea el estado.
- Editar el título y borrar tareas.
- Descripción, comentarios y adjuntos.
- Que la lista cambie sola mientras la estás mirando.
- Resumen de "qué cambió desde tu última visita".
- Notificaciones de cualquier tipo.
- Presencia ("quién está conectado") e indicadores de actividad de personas.
- Varios equipos o espacios, invitaciones y permisos.
- Integraciones (Git, PRs, CI, calendario) e importación desde otros gestores.
- Historial o registro de actividad de una tarea.
- Sprints, estimaciones, épicas, prioridades e informes.
- Resolver bloqueos.

## 5. Épicas del MVP

- **E1 «Cuentas y acceso»:** registro, inicio y cierre de sesión, perfil, y el acceso al espacio compartido solo con sesión iniciada.
- **E2 «Gestión de tareas»:** crear tareas, cogerlas o soltarlas, cambiar su estado, ponerles fecha de vencimiento y filtrar la lista por estado.
- **E3 «Actividad del equipo»:** la vista compartida de en qué está cada uno, es decir, la lista con su responsable y su estado, siempre al día. **No incluye** historial, feed de cambios ni presencia (ver la sección 4).

## 6. Requisitos funcionales

### E1: Cuentas y acceso

- **RF-1** `[EXISTENTE]` Una persona puede registrarse con un email y una contraseña, y opcionalmente su nombre. Al registrarse queda con la sesión iniciada.
- **RF-2** `[EXISTENTE]` Una persona registrada puede iniciar sesión con su email y su contraseña. Si las credenciales son incorrectas, ve un mensaje de error y no entra.
- **RF-3** `[EXISTENTE]` Una persona con sesión iniciada puede ver su perfil (nombre, email e iniciales) y cerrar sesión.
- **RF-4** Toda persona registrada accede al mismo espacio compartido, sin invitaciones ni pasos adicionales.
- **RF-5** Sin sesión iniciada no se puede ver ni modificar ninguna tarea. Quien intenta entrar a la lista sin sesión es llevado al inicio de sesión.
- **RF-6** Tras iniciar sesión o registrarse, la persona aterriza en la lista de tareas.

### E2: Gestión de tareas

- **RF-7** Una persona puede crear una tarea escribiendo solo el título, desde la propia lista y sin salir de ella.
- **RF-8** No se puede crear una tarea sin título. El título es una frase corta que se lee entera en la lista; uno demasiado largo para leerse de un vistazo no se acepta `[SUPUESTO]`. En ambos casos, la persona ve un mensaje claro y la tarea no se crea.
- **RF-9** Una tarea nueva nace en *Por hacer*, sin responsable, y aparece en la lista de quien la crea en cuanto se crea.
- **RF-10** Una persona puede **coger** una tarea libre: pasa a ser su responsable.
- **RF-11** No se puede coger una tarea que ya tiene otra persona como responsable. Para cambiar de responsable, la persona actual tiene que soltarla antes.
- **RF-12** Si dos personas intentan coger la misma tarea libre a la vez, solo una lo consigue. La otra ve un aviso que dice quién la cogió, y la tarea aparece con ese responsable.
- **RF-13** El responsable de una tarea puede **soltarla**: la tarea queda sin responsable, es decir, libre. Nadie más puede soltarla.
- **RF-14** Cualquier persona puede cambiar el estado de cualquier tarea entre *Por hacer*, *En curso* y *Hecha*, en cualquier orden. Así lo permiten los roles planos `[SUPUESTO]`.
- **RF-15** Cambiar el estado y coger o soltar una tarea son acciones independientes: ninguna cambia la otra automáticamente.
- **RF-16** Cambiar el estado, coger y soltar se hacen desde la lista, con **dos clics como máximo**, sin abrir otra pantalla ni rellenar nada.
- **RF-17** Los estados son exactamente esos tres. No se pueden añadir, renombrar ni reordenar.
- **RF-19** Una persona puede filtrar la lista por estado, eligiendo cuáles de los tres quiere ver. Por defecto se ven *Por hacer* y *En curso*, y las *Hechas* quedan ocultas.
- **RF-25** Cualquier persona puede poner, cambiar o quitar la fecha de vencimiento de una tarea, al crearla o después. La fecha es opcional: una tarea sin fecha es válida.
- **RF-26** La fecha de vencimiento se ve en la lista junto a la tarea. Una tarea cuya fecha ya pasó y que no está *Hecha* aparece marcada con el texto «Vencida».

### E3: Actividad del equipo

- **RF-18** La lista muestra todas las tareas del espacio. De cada una se ve su título, su estado y su responsable (su nombre o, si no lo tiene, su email), o la indicación visible **«Libre»** si no tiene responsable.
- **RF-20** La lista agrupa u ordena las tareas por estado: primero *En curso*, después *Por hacer* y, si se muestran, *Hechas*. Dentro de cada estado, la más reciente primero `[SUPUESTO]`.
- **RF-21** Cada vez que una persona abre la lista o vuelve a mirarla después de estar en otra cosa, ve los cambios que hicieron los demás hasta ese momento, sin tener que recargar ni preguntar.
- **RF-22** Después de una acción propia (crear, coger, soltar o cambiar el estado), la lista refleja el resultado de inmediato. Si la acción falla, se muestra el error y la tarea queda en su estado anterior.
- **RF-23** La lista distingue a simple vista las tareas cuyo responsable es la persona que la está mirando, para que funcione como su cola de trabajo.
- **RF-24** El producto no muestra ni guarda quién está conectado, cuándo se conectó alguien por última vez ni ningún otro indicador de actividad de las personas.

## 7. Requisitos no funcionales

- **RNF-1 Rapidez de uso.** Una persona que ya conoce la lista crea una tarea en menos de 10 segundos y cambia un estado en menos de 5 `[SUPUESTO]`. Se verifica cronometrando a un miembro del equipo piloto.
- **RNF-2 Sin configuración.** Un equipo puede empezar a usar la lista sin configurar nada después del registro. No hay ajustes, ni flujos de trabajo que diseñar, ni información extra que pedir en cada tarea.
- **RNF-3 Privacidad.** FlowSync no observa a las personas: no guarda cuándo se conectan, cuánto tiempo pasan dentro ni qué miran. Lo único que sabe de cada persona es qué tareas tiene y en qué estado están.
- **RNF-4 Seguridad.** `[EXISTENTE]` Nadie, ni siquiera la propia persona, puede ver la contraseña de una cuenta. Las tareas solo las ven personas con sesión iniciada (RF-5).
- **RNF-5 Fiabilidad.** Dos personas que miran la lista después del último cambio ven exactamente lo mismo. Cuando a alguien se le confirma un cambio, ese cambio no se pierde ni queda a medias.
- **RNF-6 Rendimiento percibido.** La lista se muestra completa en menos de 2 segundos con hasta 500 tareas en una conexión doméstica normal `[SUPUESTO]`.
- **RNF-7 Idioma.** Toda la interfaz y todos los mensajes de error están en español.
- **RNF-8 Navegadores.** La aplicación funciona en las dos últimas versiones de Chrome, Firefox, Safari y Edge de escritorio `[SUPUESTO]`. En móvil debe poder usarse, pero no es objetivo de optimización.
- **RNF-9 Accesibilidad básica.** Todas las acciones de la lista se pueden hacer solo con teclado, y cada estado se distingue por texto, no solo por color.
- **RNF-10 Husos horarios.** La fecha de vencimiento es un día del calendario, sin hora. Todavía no está decidido en qué momento pasa a «Vencida» para personas que están en husos horarios distintos (ver PA-12).

## 8. Restricciones

- **Stack actual, que no se cambia:** AdonisJS 7 y React 19.
- **La autenticación ya existe** (registro, login, perfil y logout) y se reutiliza tal cual. E1 solo añade el acceso al espacio (RF-4 a RF-6); no se rehace el sistema de cuentas.
- **Un solo espacio compartido:** no hay concepto de equipo ni de organización. Cualquiera que se registre entra en él `[SUPUESTO]`. Esto es aceptable para el caso de estudio, no para equipos reales.
- **Sin servicios de terceros:** ni integraciones, ni proveedores de notificaciones, ni analítica externa (RNF-3).
- **Interfaz en español** (RNF-7).
- **Entrega como vertical fina:** las tres épicas tienen que quedar usables de punta a punta antes de añadir nada fuera de la sección 4.

## 9. Métricas de éxito

Se miden durante **una semana de uso real** con el equipo piloto. Hoy no existe ese equipo: es el caso de estudio de la sección 2, y que haya uno disponible es un `[SUPUESTO]`. Todas las métricas se observan a mano, sin analítica (RNF-3).

| # | Métrica | Cómo se mide | Objetivo |
|---|---|---|---|
| M-1 (principal) | La ronda de "¿en qué estás?" se cancela | Observación de las dailies de la semana | Se elimina y **nadie pide que vuelva** antes del final de la semana. Si se sigue haciendo igual, el MVP falla. |
| M-2 | Concordancia entre la lista y la realidad | **No es medible tal como está definida.** Su único método era comparar la lista con lo que cada persona dice en la ronda de "¿en qué estás?", y esa ronda es justo la que M-1 elimina. Si M-1 se cumple, M-2 se queda sin medir. | Sin objetivo mientras no haya un método que no dependa de la ronda (ver PA-4). |
| M-3 | Colisiones | Preguntar en la retro de fin de semana | 0 casos de dos personas trabajando en lo mismo sin saberlo |
| M-4 | Preguntas de estado por chat | Contar los mensajes del tipo "¿cómo va X?" / "¿en qué estás?" la semana anterior y la del piloto | Bajan respecto a la semana anterior. No hay línea base todavía: se mide la semana previa `[SUPUESTO]` |
| M-5 | Adopción | Comprobar la lista al final de la semana | Cada miembro del equipo cogió al menos una tarea |
| M-6 (guarda) | No hay doble sistema | Preguntar en la retro | Nadie mantiene el gestor anterior en paralelo para el trabajo del piloto |

## 10. Puntos abiertos

Hallazgos de la revisión adversarial que no se resuelven en este documento. Cada uno es una decisión de producto o algo que se precisará durante la construcción. Ninguno saca nada del alcance: la fecha de vencimiento y el filtrado por estado siguen dentro, en E2.

| # | Tema | Argumento | Qué hace falta para decidir |
|---|---|---|---|
| PA-1 | No hay piloto real | Todas las métricas (sección 9) requieren una semana de uso con un equipo que hoy no existe: el primer usuario es un caso de estudio. Sin piloto, el MVP se puede construir, pero no validar. | Confirmar si hay un equipo disponible y dispuesto a usarlo una semana. Si no lo hay, redefinir el objetivo del MVP sin prometer validación. |
| PA-2 | Sustituir el gestor actual con un producto recortado | La tesis es "sustituye, no convive". Pero sin descripción, edición, borrado ni importación, lo racional para un equipo real es usar los dos a la vez. Eso es la doble actualización que mata esta categoría, y es justo lo que vigila M-6. | Decidir si el piloto sustituye todo el trabajo o solo una parte acotada, o qué mínimo hay que recuperar para que sustituir sea creíble. Hablarlo con el equipo piloto. |
| PA-3 | Colisión de tarea frente a colisión de trabajo | El episodio de referencia fue tocar el *mismo módulo*. La lista compara *títulos*, y dos tareas con títulos distintos pueden ser el mismo módulo. Evitar colisiones depende de cómo se nombren y dimensionen las tareas, y el PRD no lo garantiza. | Decidir si es un supuesto explícito sobre cómo crea las tareas el equipo, o si se reformula la promesa ("ver quién está en una tarea", no "en un código"). |
| PA-4 | El riesgo principal no tiene métrica | Que la información se quede vieja es el riesgo #1 del alcance. M-5 mide que la gente entró, no que la lista siga al día, y M-2 no se puede medir (sección 9). Hoy nada detecta que la lista se está quedando vieja. | Encontrar un método para medir la frescura que no dependa de la ronda de estado ni de vigilar a las personas (RNF-3). |
| PA-5 | Lista abierta todo el día | RF-21 actualiza la lista "al volver a mirarla", pero quien la deja abierta en otra pantalla nunca "vuelve", y ve datos viejos sin saberlo. En ese caso tampoco se cumple RNF-5 ("ven lo mismo"). Es la consecuencia del recorte de "la lista cambia sola", que ya estaba marcado como el más discutible. | Decidir si se avisa de que la lista puede estar desactualizada, si se recupera la actualización en directo, o si se acepta el hueco. Definir también qué significa exactamente "volver a mirarla". |
| PA-6 | M-3 no aporta información | Hubo un episodio en un periodo desconocido. Una semana sin colisiones es lo esperable aunque FlowSync no exista, así que el resultado no distingue nada. | Saber con qué frecuencia ocurren hoy las colisiones, o sustituir M-3 por algo observable a diario. |
| PA-7 | "Empezar una tarea" no cabe en dos clics | Coger una tarea y pasarla a *En curso* son acciones independientes (RF-15), así que la acción más habitual cuesta el doble de lo prometido. Además, RNF-9 exige teclado, así que "clics" no es la unidad correcta. | Decidir si existe una acción combinada de "empezar", o reformular la promesa. Probarlo con un prototipo. |
| PA-8 | Permisos asimétricos | Nadie puede soltar una tarea ajena (RF-13), pero cualquiera puede marcarla como *Hecha* (RF-14). Si alguien se va con tareas *En curso*, quedan bloqueadas o se cierran en falso, y en los dos casos la lista miente. | Elegir un modelo simétrico con roles planos: o cualquiera puede soltar, o nadie cambia el estado de lo ajeno. |
| PA-9 | Las cuentas existentes frente a RF-24 | El sistema de cuentas actual guarda cuándo se usó la sesión por última vez, y la sección 8 obliga a reutilizarlo tal cual. RF-24 prohíbe guardar cuándo se conectó alguien. | Decidir si RF-24 se limita a lo que el producto *muestra*, o si se acepta tocar el sistema de cuentas. |
| PA-10 | Criterios por precisar durante la construcción | RF-8: límite de longitud del título (un número). RF-20: agrupar *u* ordenar, y si "más reciente" significa creada o cambiada. RF-22 "de inmediato" y RF-23 "a simple vista", sin criterio. RNF-1: muestra de una sola persona. RNF-6: cifras sin justificar. RNF-8: "en móvil debe poder usarse" no se puede probar. | Fijarlos al escribir los criterios de aceptación de cada historia. |
| PA-11 | Alcance que se cuela | RNF-8 pide 4 navegadores más móvil para un piloto de 6 personas. RF-23 (distinguir mis tareas) y RF-6 (aterrizar en la lista, cuando hoy se llega al perfil) no estaban en el alcance acordado. M-4 exige leer el chat del equipo, lo que choca con el espíritu de RNF-3. | Decidir si cada uno se queda, y medir su coste frente a lo que aporta a la validación. |
| PA-12 | Vencimiento con varios husos horarios | El equipo piloto está en 3 husos horarios. Una tarea que vence "el martes" pasa a «Vencida» en momentos distintos según quién mire. | Decidir con qué reloj se considera vencida (el de quien mira, el de quien la tiene o uno común del equipo). |
| PA-13 | Fecha y filtro frente a las dos decisiones | En el recorte del alcance argumenté que la fecha no ayuda a no pisar trabajo ni a elegir lo libre, y que puede traer control de plazos. Con 10 personas, filtrar por estado aporta poco más que ocultar las hechas. **Ambas cosas se quedan dentro del alcance (E2).** | Observar en el piloto si se usan, y si la fecha cambia lo que la gente coge o solo añade presión. |
