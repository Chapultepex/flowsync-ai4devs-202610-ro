# Alcance del MVP de FlowSync

Este documento es el alcance acordado y la base del PRD. No es el PRD. Sale de una ronda de preguntas de producto y de un recorte deliberadamente agresivo. La regla del recorte: **entra solo lo necesario para pasar la prueba de una semana** (ver bloque 1).

Punto de partida del producto: hoy solo existe la cuenta de usuario (registro, login, perfil y logout).

## 1. Problema

En un equipo remoto pequeño nadie ve en qué está cada uno sin interrumpir a alguien. Hoy eso cuesta dos cosas:

- **La ronda de "¿en qué estás?"**: se come la mitad de una daily de 15 minutos, más los mensajes sueltos por chat.
- **Colisiones**: dos personas empiezan lo mismo sin saberlo. Episodio de referencia: el mismo módulo, la misma semana, dos días perdidos.

La daily no desaparece entera. Solo desaparece su ronda de estado. La parte de bloqueos sigue, y este MVP no la resuelve.

**Criterio de éxito, a una semana de uso real:** el equipo cancela la ronda de "¿en qué estás?" y nadie pide que vuelva. Si la siguen haciendo igual, el MVP no funcionó.

## 2. Usuarios

- **Pares de un equipo remoto pequeño, de 3 a 10 personas, con roles planos.** Todos ven y hacen lo mismo. No hay reporte hacia arriba, y a un manager esto le daría igual.
- El dolor lo sufren el que descubre tarde que iba a lo mismo que otro y el que tiene que interrumpir para preguntar.
- **Primer usuario: un caso de estudio, no un cliente real.** Un equipo de 6 personas de un producto SaaS, repartido en 3 husos horarios. Hoy usa un gestor de tareas pesado y una daily de 15 minutos por videollamada. Todo lo que se diga sobre su uso es una hipótesis, no evidencia.

## 3. Propuesta de valor

Una lista compartida que es a la vez **la cola de trabajo de cada uno** y **el estado del equipo**.

- **Coger una tarea o cambiarle el estado cuesta dos clics**, sin campos obligatorios ni configuración.
- **Quien la actualiza cobra en el momento.** Mira la lista para decidir qué coge, y deja de recibir preguntas sobre cómo va lo suyo. Si el beneficio fuera solo para los demás, no la actualizaría.
- **Mejora dos decisiones concretas:** no empezar algo que otra persona ya está tocando, y elegir lo siguiente sabiendo qué está libre. "Sentirse informado" no cuenta como valor.
- **Es donde se hace el trabajo, no donde se cuenta.** Sustituye al gestor de tareas, no convive con él: convivir obligaría a actualizar dos sitios.

## 4. Alcance (entra)

Cinco capacidades, sobre la cuenta de usuario que ya existe:

1. **Ver la lista compartida.** Un único espacio para todos los registrados. Cada tarea muestra título, responsable y estado. Las tareas hechas quedan ocultas por defecto, para centrarse en lo pendiente.
2. **Crear una tarea solo con el título.** Nace en *Por hacer* y sin responsable, es decir, libre.
3. **Cogerla o soltarla.** Me la asigno, o dejo de ser su responsable. "Sin responsable" es la señal de que la tarea está libre.
4. **Cambiar el estado en dos clics.** Hay tres estados fijos, no configurables: *Por hacer*, *En curso* y *Hecha*.
5. **Ver la lista al día cada vez que la miras**, sin recargar a mano ni preguntar a nadie.

## 5. NO-alcance (queda fuera)

| Fuera | Por qué |
|---|---|
| Fecha de vencimiento y vista de tareas vencidas | No ayuda a ninguna de las dos decisiones ni a cancelar la ronda. Además, mete control de plazos, que es justo el peso de los gestores pesados. Si en la semana de prueba alguien la echa de menos, esa ya es una señal útil. |
| Asignar tareas a otra persona | Cada uno coge su propio trabajo. Repartir tareas a otros es planificar, y con roles planos no hay quién planifique. También rompe la regla de que quien escribe es quien cobra. |
| Filtros, salvo ocultar o mostrar las hechas | Con 10 personas, lo pendiente cabe en una pantalla. "Centrarse en lo pendiente" es exactamente ocultar lo hecho. |
| Editar el título y borrar tareas | En una prueba de una semana, una tarea mal escrita o descartada se marca como *Hecha* y se crea otra. Es incómodo, pero no impide validar nada. Es lo primero que entraría en la siguiente iteración. |
| Descripción, comentarios y adjuntos | La conversación sobre una tarea ya ocurre en el chat. Meterla aquí convierte la lista en un gestor completo. |
| Que la lista cambie sola mientras la estás mirando | La necesidad real es "cuando miro, veo lo actual", y eso ya entra (punto 5 del alcance). Ver cambios en directo solo aporta si alguien coge una tarea justo en los segundos en que tú la miras, algo raro en un equipo de 6. **Es el recorte más discutible:** se añade si la prueba muestra colisiones en esa franja. |
| Resumen de "qué cambió desde tu última visita" | Es una segunda forma de ver lo mismo. Antes hay que comprobar si la lista sola basta para el caso de llegar por la mañana. |
| Notificaciones | La señal es un resumen que espera, no un aviso que interrumpe. |
| Presencia ("quién está conectado") e indicadores de actividad | Es vigilancia, y se rechaza a propósito. El estado es de la tarea, no de la persona. |
| Varios equipos o espacios, invitaciones y permisos | Supuesto del MVP: un único espacio en el que entra cualquiera que se registre. Sirve para el caso de estudio, pero es lo primero que rompería con equipos reales. No hace falta para validar. |
| Integraciones (Git, PRs, CI, calendario) | Son otro producto, que depende de terceros. Además, si el estado se deduce solo, no se valida lo que hay que validar: que la gente lo actualiza porque le cuesta dos clics. |
| Importar tareas de otros gestores | FlowSync crea las tareas, no lee las de otro sitio. El caso de estudio arranca cargando a mano sus tareas en curso. |
| Historial o registro de actividad de una tarea | Nadie pidió saber quién cambió qué y cuándo. Sirve para auditar, no para decidir qué coger. |
| Sprints, estimaciones, épicas, prioridades e informes | Un equipo que necesite eso no es el usuario de FlowSync. |
| Resolver bloqueos | Sigue en la daily, como se acordó en el bloque 1. |
