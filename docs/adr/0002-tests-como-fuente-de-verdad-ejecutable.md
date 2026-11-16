# 2. Los tests de integración como única fuente de verdad ejecutable

## Contexto

Este ADR reemplaza al [0001](0001-openspec-como-fuente-de-verdad.md), que hacía de las specs vivas de OpenSpec la fuente de verdad del comportamiento. Está redactado por adelantado, el 2026-11-15, como escenario a un año vista: se asume que en ese momento se deja de mantener `openspec/`. Lo que sigue describe el punto de partida de hoy y las premisas del cambio; no relata nada que haya ocurrido después.

**Lo que el 0001 reconocía como su punto débil.** La spec viva dice lo que *debería* pasar, pero nada comprueba que pase. Los tres changes archivados declaran «sin tests», y el ADR 0001 ya citaba dos desajustes visibles entre spec y código: el filtro `status` (la spec exige `422` para un estado inventado; desde el commit `8c15707` el validador acepta cualquier texto) y el cuerpo de `PUT /due-date` (los scenarios omiten `today`, que el validador exige). Un contrato que nadie ejecuta se desvía sin que nada falle.

**Lo que hay hoy para sustituirlo.** Poco:

- El backend usa Japa con dos suites declaradas (`unit` y `functional`). `tests/unit/` no existe. Los functional cubren `auth` (registro, login, sesión, iniciales) y, de `tasks`, solo el responsable de la tarea en la lista (`responsable.spec.ts`, `responsable_lista.spec.ts`). Nada cubre el filtro, el vencimiento, el cambio de estado ni la creación.
- En los tests functional las rutas y sus payloads llegan tipados por el registro Tuyau generado en `.adonisjs/client/registry/`, enganchado al `apiClient` de Japa en `tests/bootstrap.ts`. Un test que se desvía del contrato de la API falla al compilar.
- Las suites functional pegan contra el mismo fichero SQLite que el servidor de desarrollo; escribir sin aislar con `testUtils.db()` filtra estado entre runs.
- El frontend no tiene runner de tests. Los 32 requisitos de `tasks` incluyen muchos scenarios de interfaz (por ejemplo «Volver a la lista», «La señal no es solo un color») que hoy no tienen dónde ejecutarse.

**Premisas que se asumen para tomar la decisión.** Que el equipo prefiere un contrato que falla ruidosamente a uno que se lee; que mantener specs, deltas, `design.md` y `tasks.md` por cada cambio se ha vuelto un coste que no se está pagando; y que antes de retirar las specs se habrá portado a tests lo que merece conservarse. Si alguna no se cumple, esta decisión no debe adoptarse.

## Decisión

A partir de esta decisión, **los tests de integración son la única fuente de verdad ejecutable del comportamiento de FlowSync**. Ante una discrepancia entre un test en verde y cualquier otra descripción (spec, PRD, comentario, documento OpenAPI), manda el test, y la otra descripción es la que se corrige o se descarta.

En concreto:

1. **Se deja de mantener `openspec/specs/` y no se abren changes nuevos.** El directorio queda como archivo histórico, marcado como no vigente, y no se borra: los `proposal.md` y `design.md` archivados siguen siendo el único registro del porqué de decisiones como el día de referencia obligatorio o la lista sin vencimiento.
2. **Cada requisito que se quiera conservar se porta como test functional** antes de retirar su spec, con el título del test redactado como el scenario de origen y citándolo. Lo que no se porte se da por abandonado, de forma explícita.
3. **Un cambio de comportamiento entra con su test.** El test que falla primero es la especificación del cambio; la descripción del porqué va en el mensaje de commit y en el PR, y las decisiones de arquitectura de calado, en un ADR.
4. **Los tests functional se aíslan** (`testUtils.db()` con truncado o transacción global) antes de que se conviertan en el contrato, para que dependan solo de lo que crean.
5. **Lo que no se puede probar con tests de integración del backend no es contrato.** Los scenarios de interfaz solo pasan a serlo si se monta un runner en el frontend; hasta entonces, se declaran fuera del contrato en lugar de quedar como prosa que nadie ejecuta.

## Estado

Aceptada (prevista para 2027-11; redactada el 2026-11-15). Reemplaza al [ADR 0001](0001-openspec-como-fuente-de-verdad.md).

## Consecuencias

### Lo que ganamos

- **El contrato se ejecuta.** Un desajuste como el del filtro `status` pasa de «alguien lo ve leyendo el código» a «la suite se pone en rojo».
- **Se acaba el mantenimiento en paralelo.** Ya no hay delta, spec viva, `design.md` y `tasks.md` que sincronizar a mano, ni el riesgo de que la spec describa lo contrario de lo que el código hace.
- **Los payloads están tipados.** Con el registro Tuyau, un test que se aparta de las rutas o los tipos generados falla al compilar, algo que ninguna spec en prosa daba.
- **Una sola fuente donde mirar.** Quien pregunta qué hace el sistema abre el test, no cruza spec, delta e historial.

### Lo que nos cuesta

- **Se pierde el porqué.** Un test dice *qué* pasa, rara vez *por qué* se decidió así. Las decisiones que `design.md` conservaba (por qué `today` no tiene valor por defecto, por qué la lista no lleva `dueDate`) ya no tienen sitio asignado, y quedan a merced de mensajes de commit y ADRs que alguien tiene que acordarse de escribir.
- **Las exigencias negativas son difíciles de expresar.** La spec decía «no existe ninguna operación para crear, renombrar o borrar un estado», «no hay lista personal», «no hay señales de presencia». Un test prueba lo que existe; probar que algo no existe exige recorrer la API entera (por ejemplo, contra `node ace list:routes`) y es frágil. Esas garantías se debilitan.
- **Se pierde lo que no está en el backend.** El frontend no tiene runner de tests, así que todos los scenarios de interfaz salen del contrato (decisión 5). Hoy eso es una parte sustancial de `tasks/spec.md`. Montar el runner es trabajo nuevo y no está hecho.
- **Los tests solo valen lo que se escriba.** La base actual es muy pequeña: nada cubre el filtro ni el vencimiento. Declarar los tests fuente de verdad sin haberlos escrito deja un hueco peor que la spec, que al menos describía todo. Todo el trabajo de portar depende de esta decisión.
- **Los tests son más difíciles de leer para quien no programa.** Producto y quien revisa el comportamiento sin leer TypeScript pierden el documento que podían leer. El PRD y el backlog pasan a ser la única descripción legible, y no son un contrato.
- **Un test en verde no es lo mismo que el comportamiento deseado.** Un test mal escrito fija un error como si fuera requisito, y ya no hay un texto independiente contra el que contrastarlo. La spec servía de segunda opinión.
- **El coste de aislamiento es previo.** Mientras las suites functional compartan fichero de BD con el servidor de desarrollo, correrlas puede ensuciar o depender de los datos de desarrollo. Hacerlas fiables es condición de esta decisión, no un extra.
- **Los documentos derivados siguen sin ser contrato.** El documento OpenAPI de `/api.json` se genera de decoradores en los controladores, no de los tests. Puede divergir de ambos, y nada obliga a mantenerlo alineado.

### Qué haría falta para que la decisión se sostenga

Portar los requisitos que se quieran conservar antes de retirar las specs; aislar la BD de los tests; decidir si se monta un runner en el frontend o se declara su comportamiento fuera del contrato; y establecer dónde se anota el porqué de las decisiones, para que no se pierda con las specs.
