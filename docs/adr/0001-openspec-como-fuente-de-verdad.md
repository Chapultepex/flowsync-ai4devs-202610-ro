# 1. OpenSpec, con sus delta-specs, como fuente de verdad viva del comportamiento

## Contexto

FlowSync describe lo que hace en dos sitios distintos y con dos edades distintas, y hay que decidir cuál manda.

Lo que existe hoy en `openspec/`:

- **Specs vivas** en `openspec/specs/<capability>/spec.md`: `auth` (19 requisitos, 307 líneas) y `tasks` (32 requisitos, 753 líneas). Cada requisito va redactado como lo que el sistema debe hacer («SHALL…»), con scenarios `WHEN/THEN` colgando de él. Una misma spec mezcla scenarios de API (`POST /api/v1/tasks` responde `201`) y de interfaz («Volver a la lista»).
- **Changes archivados** en `openspec/changes/archive/`: `add-task-list`, `add-task-status-filter` y `add-task-due-date`, los tres con fecha `2026-08-13` y el esquema `spec-driven`. Cada uno trae `proposal.md` (por qué y qué cambia, con lo que queda fuera de alcance), `design.md` (decisiones y riesgos), `tasks.md` y un directorio `specs/` con las **delta-specs**: ficheros que solo contienen los requisitos `## ADDED` o `## MODIFIED` por ese change, no la spec entera.
- **La relación entre ambos:** la spec viva es el resultado de aplicar los deltas de los changes archivados, uno detrás de otro. El change es el registro de *por qué* cambió algo; la spec viva es el estado actual de *qué* se exige. El historial git lo confirma: solo dos commits tocan `openspec/` (`04940fc`, la capability de tareas completa, y `209df12`, «el filtro por estado entra en la spec viva»), de modo que la sincronización se hace a mano y por change.

Alrededor hay otros documentos que no son el contrato: `docs/prd/` y `docs/backlog/` (historias, criterios de aceptación y preguntas abiertas con identificadores como FS-118 o PA-7, que los `proposal.md` citan), `docs/architecture.md` y `docs/trazabilidad/`. Y el código, que es lo que de verdad se ejecuta.

El problema que hay que evitar es el habitual: una descripción de comportamiento que se queda atrás en cuanto alguien toca el código, sin que quede constancia de qué se decidió ni por qué. Además, el proyecto se trabaja con agentes que leen la spec antes de tocar código, y necesitan un único sitio al que fiarse.

## Decisión

El comportamiento que FlowSync promete se define en `openspec/specs/`, y **esa spec viva es la fuente de verdad**: ante una discrepancia entre ella y el PRD, el backlog, un comentario o el código, la discrepancia es un defecto que se resuelve en uno de los dos lados, no una cuestión de opinión.

La spec viva solo cambia a través de changes de OpenSpec:

1. Todo cambio de comportamiento se propone como un change con `proposal.md`, `design.md`, `tasks.md` y delta-specs que dicen exactamente qué requisitos se añaden o se modifican.
2. Al terminar, el change se archiva en `openspec/changes/archive/` y sus deltas se aplican a la spec viva.
3. El `design.md` archivado queda como registro del porqué de las decisiones; no se reescribe después.
4. Los `proposal.md` dicen explícitamente lo que queda fuera de alcance y los riesgos aceptados, para que una omisión no se confunda con un requisito.

El nivel de detalle de la spec es el de scenarios verificables: lo que la spec exige que se cumpla se escribe de forma que se pueda contrastar contra la API o la pantalla.

## Estado

Reemplazada por el [ADR 0002](0002-tests-como-fuente-de-verdad-ejecutable.md). Estuvo aceptada desde 2026-11-15. Registra una práctica ya en uso desde los tres changes de 2026-08-13; no sustituye ninguna decisión anterior.

## Consecuencias

### Lo que ganamos

- Hay un único sitio donde mirar qué debe hacer el sistema, escrito en términos de comportamiento observable y no de implementación.
- Los deltas hacen pequeña y revisable cada petición de cambio, y los `design.md` conservan el porqué de decisiones que el código no cuenta (por ejemplo, por qué `today` es obligatorio y no tiene valor por defecto, o por qué la lista no lleva el vencimiento).
- Las exclusiones quedan escritas. Los tres `proposal.md` dicen qué no se hace «a propósito» (sin tests, sin lista viva, sin ordenación propia pendiente de PA-3), y eso evita leer un hueco como un olvido.
- Los scenarios sirven de contrato contra el que contrastar otras descripciones derivadas, como el documento OpenAPI generado de `/api.json`: al compararlo con la spec salió una lista concreta de lo que le faltaba.

### Lo que nos cuesta

- **Nada verifica que el código cumpla la spec.** Es la consecuencia más seria. Los tres changes declaran explícitamente «sin tests», dos de sus `tasks.md` (`add-task-list` y `add-task-due-date`) tienen casillas sin marcar, y los scenarios son prosa, no pruebas ejecutables. La spec dice lo que *debería* pasar; que pase depende de que alguien lo compruebe. Ya hay dos desajustes visibles:
  - **El filtro `status`.** La spec exige `422` sobre el campo para un estado inventado (scenario «Estado inventado») y el `design.md` archivado dice que el validador usa `vine.enum(...)`. Desde el commit `8c15707`, `listTasksValidator` declara `status: vine.string().optional()` y el controlador solo hace `where('status', status)`. Por lectura del código, un estado inventado ya no llega como `422` sino como lista vacía, que es justo el fallo que la spec prohíbe. No he ejecutado la petición y no hay ningún test del filtro que lo detecte.
  - **El cuerpo de `PUT /due-date`.** Los scenarios de fijar y quitar la fecha envían solo `{"dueDate": ...}`, pero el validador también exige `today`. Seguir el scenario al pie de la letra da `422`.
- **La sincronización es manual y puede fallar en silencio.** Aplicar los deltas a la spec viva no está automatizado ni comprobado; uno de los changes (`add-task-status-filter`) existe solo para ponerse al día con comportamiento ya implementado, y corrigió requisitos de la spec que el código había vuelto falsos. Cuando el flujo se invierte (código primero, spec después), la spec sigue al código en vez de gobernarlo.
- **El mismo texto vive en varios sitios.** Un requisito aparece en el delta del change y luego en la spec viva, y un `MODIFIED` repite el requisito entero, no solo lo que cambia. El `design.md` repite además decisiones que están en el código. Cada duplicado es un sitio más que puede quedarse atrás.
- **Hay que leer dos lugares.** Para saber qué exige el sistema hoy se lee la spec viva; para saber por qué es así hay que bucear en changes archivados. Un lector nuevo tiene que conocer esa convención, y quien edita la spec viva directamente, sin pasar por un change, rompe el registro del porqué.
- **Las specs crecen y mezclan niveles.** `tasks/spec.md` ya tiene 753 líneas y combina contrato de API con comportamiento de interfaz. Cada requisito nuevo lo hace más caro de leer, de revisar y de mantener coherente consigo mismo.
- **El rigor del formato tiene un coste de entrada.** Cada cambio, también el pequeño, pide proposal, design, tasks y deltas. Hay un coste de proceso fijo, y una dependencia de las herramientas y skills de OpenSpec para generarlos y archivarlos.
- **Es una fuente de verdad de lo prometido, no de lo construido.** No sustituye a los tests ni al código, y los documentos derivados (OpenAPI, tipos generados) pueden quedar por debajo de ella sin que nadie lo vea hasta que se contrasten a mano.

### Qué haría falta para que la decisión se sostenga

Esta decisión solo funciona si hay algo que cierre la distancia entre spec y código. Quedan abiertos, y este ADR no los resuelve: tests que ejecuten los scenarios de la API (hoy solo existen los de `auth` y los del responsable de la tarea), una comprobación de que la spec viva coincide con los deltas archivados, y corregir los dos desajustes citados arriba.
