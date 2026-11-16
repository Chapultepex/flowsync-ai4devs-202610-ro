# PROMPTS-HALR-s4

FlowSync, sesion 4. Tres secuencias de prompts: el ciclo de verificacion (validar tests, corregir y revisar de forma adversarial) y, despues, dos rondas que cierran lo que el revisor adversarial encontro en cada pasada (validar cobertura, mejorar tests, ejecutarlos y corregir).

**Secuencia A:** Prompts 1 a 3 (ciclo original). **Secuencia B:** Prompts 4 a 7 (hallazgos de la primera revision adversarial). **Secuencia C:** Prompts 8 a 11 (hallazgos de la segunda revision, sobre las correcciones de la B). Cada secuencia parte de la tabla de "Hallazgos de partida" de su seccion.

## Secuencia A - Ciclo de verificacion

**Como usarlo.** Abre Claude Code en la raiz del repo (`claude`) y pega cada prompt por separado, en este orden. No pegues el siguiente hasta haber leido el resultado del anterior: el Prompt 2 depende de lo que diga el 1, y el 3 de que el 2 haya dejado todo en verde.

### Prompt 1 - Validar los tests

*Ejecuta tests, lint y typecheck, explica que cubre cada test frente a la spec y da un veredicto PASA / NO PASA. Solo lectura y ejecucion: no cambia codigo.*

```text
Valida los tests del backend de FlowSync y dime que cubren y si pasan.
No modifiques ningun fichero en este paso.

1. Desde backend/, ejecuta `npm test`. Las suites functional usan el mismo
   SQLite que el servidor de desarrollo (backend/tmp/db.sqlite3): si hay un
   `npm run dev` abierto, avisame antes de lanzarlas. tests/unit/ no existe;
   si ace se queja por eso, dimelo.
2. Ejecuta tambien `npm run lint` y `npm run typecheck`.
3. Lee backend/tests/functional/ y openspec/specs/ (auth y tasks) y explicame,
   fichero por fichero, que cubre cada test: a que scenario de la spec
   corresponde y que comportamiento comprueba. Dime tambien que scenarios de
   la spec NO tienen ningun test.
4. Cierra con un veredicto en una linea: PASA o NO PASA (tests, lint y
   typecheck por separado). Si algo no pasa, lista cada fallo con titulo del
   test, fichero, mensaje de error y tu hipotesis de la causa. No arregles nada.
```

### Prompt 2 - Corregir

*Solo actua si el Prompt 1 dio NO PASA. Arregla la causa raiz sin debilitar los tests, repite hasta verde y cierra con /commit.*

```text
Corrige los fallos que salieron en la validacion anterior.

- Si todo paso (tests, lint y typecheck), dilo y no cambies nada.
- Si algo fallo, antes de tocar codigo comprueba que estas en una rama de
  trabajo (no main ni sN/*). Si no, crea feat/<slug>.
- Busca la causa raiz de cada fallo, no el sintoma. Arregla el codigo, no el
  test: no borres ni relajes asserts, no uses skip. Solo si el test contradice
  la spec de openspec/specs/, explicame por que antes de tocarlo.
- Respeta CLAUDE.md: respuestas con serialize() y transformers, imports por
  subpath (#controllers/*, #models/*...), y no edites a mano
  database/schema.ts ni nada de .adonisjs/.
- Despues de cada arreglo, vuelve a ejecutar desde backend/: `npm test`,
  `npm run lint` y `npm run typecheck`. Repite hasta que los tres esten en
  verde. Si tras 3 intentos sigue rojo, para y cuentame que probaste.
- Al terminar, usa la skill /commit.
```

### Prompt 3 - Revision adversarial

*Invoca el subagente definido en .claude/agents/adversarial-reviewer.md sobre el diff de la rama. Va al final, con los tests en verde.*

```text
Lanza el subagente adversarial-reviewer sobre los cambios de esta rama frente
a main.

Es de solo lectura y sus herramientas son Read, Grep y Glob (no tiene Bash),
asi que no puede sacar el diff el solo. Obtenlo tu: ejecuta
`git diff --stat main...HEAD` y pasale en su prompt la lista de ficheros
cambiados junto con las specs contra las que debe contrastar
(openspec/specs/auth/spec.md y openspec/specs/tasks/spec.md).

Pidele que intente REFUTAR el cambio: desviaciones de la spec, edge cases sin
manejar, fugas de seguridad o de datos (por ejemplo, datos de acceso de la
cuenta en las respuestas de tasks) y supuestos fragiles. Hallazgos
priorizados (critico/alto/medio), cada uno con archivo:linea y el scenario
que se rompe.

Cuando termine, pegame sus hallazgos tal cual, sin suavizarlos ni filtrarlos.
Despues dime cuales confirmas leyendo el codigo y cuales te parecen falsos
positivos. No corrijas nada en este paso.
```

## Secuencia B - Cerrar los hallazgos del adversarial-reviewer

**Como usarlo.** Se pega despues de la secuencia A, con la misma regla: un prompt cada vez y leyendo el resultado antes del siguiente. El Prompt 4 mide que hallazgos no tiene ningun test; el 5 escribe los tests que faltan (algunos fallaran a proposito); el 6 los ejecuta y separa los fallos esperados de los accidentales; el 7 corrige el codigo que esos fallos senalan. Los prompts hacen referencia a los identificadores (C1, C2, A1...) de la tabla siguiente.

### Hallazgos de partida

*Resultado de la revision adversarial de la rama feat/tests-responsable-tarea frente a main (15-11-2026), hecha por el subagente adversarial-reviewer leyendo el codigo, sin ejecutar nada. Las columnas Donde, Scenario y Fallo son del revisor; la columna Contraste es la comprobacion posterior leyendo el codigo.*

| ID | Gravedad | Dónde | Scenario que se rompe | Fallo | Contraste |
|---|---|---|---|---|---|
| C1 | Critico | `backend/app/models/task.ts:52-56` | Una tarea hecha con la fecha pasada; Darla por hecha la deja de vencer; Una tarea hecha no se anuncia vencida | isOverdueOn no mira el estado: una tarea done con fecha pasada llega con isOverdue true en GET /tasks/:id y en PUT /due-date; task-page.tsx:176 la pinta como vencida. | Confirmado |
| C2 | Critico | `backend/app/validators/task.ts:29-31` | Estado inventado; El error no se confunde con la ausencia; Un estado que no existe se rechaza, no se responde vacio | status es vine.string().optional(): ?status=archivado da 200 con lista vacia y no 422. La rama del 422 en tasks-page.tsx:103 es codigo muerto. ?status= vacio no marca opcion (task-filter.tsx:41). | Confirmado |
| A1 | Alto | frontend/src/pages/tasks-page.tsx:92-95, 349-357 | No queda nada abierto, pero si hay tareas hechas; Marcar como hecho saca la tarea de la vista por defecto | doneCount solo se resuelve si la carga inicial vino vacia: al marcar como hecha la ultima tarea visible queda un spinner eterno. | Confirmado leyendo |
| A2 | Alto | `frontend/src/pages/tasks-page.tsx:94` | Vacio que no es un espacio vacio | listTasks(token,'done').catch(() => []) convierte cualquier error en doneCount 0 y muestra la bienvenida de espacio vacio. | Confirmado leyendo |
| A3 | Alto | `frontend/src/pages/task-page.tsx:48-52` | Abrir una tarea que no existe | /tasks/abc o /tasks/1.5: con Number.isInteger falso el efecto sale sin fijar loadError y queda el spinner para siempre. | Confirmado |
| A4 | Alto | backend/app/models/user.ts:12; backend/app/validators/user.ts:13 | Iniciales de la cuenta; Responsable sin nombre | split(' ') sin trim: 'Ada  Lovelace' da AD; ' Ada' y '   ' dan iniciales vacias; un fullName vacio llega a tasks como nombre no nulo. Los tests solo cubren los casos felices. | Confirmado |
| A5 | Alto | `backend/app/validators/user.ts:6,14` | Email ya registrado | Sin normalizar el email: Ada@example.com y ada@example.com podrian coexistir (SQLite distingue mayusculas). | Plausible, sin verificar |
| M1 | Medio | `backend/app/transformers/task_assignee_transformer.ts:15` | La tarea no filtra datos de cuenta | El assignee expone el id de la cuenta; DATOS_DE_CUENTA de responsable_lista.spec.ts no lo prohibe. | Cierto, discutible |
| M2 | Medio | `backend/start/routes.ts:44-46` | Tarea que no existe | Sin matcher en :id, ids como '01' o '1e0' pueden resolver a la tarea 1 por afinidad numerica de SQLite; el orden 404/422 no es uniforme entre show y update. | Plausible, sin verificar |
| M3 | Medio | `backend/app/validators/task.ts:30` | Un solo estado por peticion | ?status=a&status=b o status[]=x dan 422 de tipo en lugar de sustituir al anterior. | Plausible, sin verificar |
| M4 | Medio | `frontend/src/pages/task-page.tsx:50-76` | Abrir una tarea que no existe | No se reinicia el estado al cambiar de :id: se queda la tarea anterior y un loadError previo. | Parcial |
| M5 | Medio | `frontend/src/pages/tasks-page.tsx:97-113` | El servidor rechaza la sesion recordada | Un 401 a mitad de uso muestra un aviso pero no llama a clearSession ni redirige. | Confirmado |
| M6 | Medio | `backend/app/validators/task.ts:52-59` | Una fecha que no existe se rechaza | Fecha formateada en la zona horaria del proceso; no hay test de 2026-02-31, 30/09/2026 ni 2026-2-3. | Sin verificar |
| M7 | Medio | backend/tests/functional/tasks/responsable.spec.ts y responsable_lista.spec.ts | Responsable sin nombre; La tarea no filtra datos de cuenta | Asserts debiles (property / isDefined pasan con vacio), notProperty solo sobre assignee, tests casi duplicados, y ningun test de estados, filtro, vencimiento, 401, 404 ni 422 de tasks. (Falso positivo: el bloqueo del SQLite con el servidor activo.) | Confirmado |

*Los hallazgos de frontend (A1, A2, A3, M4, M5) no tienen runner de tests: el repo no lo instala. Los prompts 4 a 7 los tratan aparte para no darlos por cubiertos.*

### Prompt 4 - Validar si los tests cubren lo del adversarial

*Solo lectura: para cada hallazgo de la tabla, dice si algun test lo detectaria. Un test que pasaria aunque el defecto siga ahi cuenta como no cubierto.*

```text
Valida si los tests del backend de FlowSync cubren los hallazgos del
adversarial-reviewer de la seccion "Hallazgos de partida" de
PROMPTS-HALR-s4.pdf (C1, C2, A1 a A5, M1 a M7).
No modifiques ningun fichero ni ejecutes los tests en este paso.

1. Para cada hallazgo, busca en backend/tests/functional/ un test que lo
   detecte: que FALLE si el defecto existe. Un test que solo pasa por la
   misma ruta no cuenta; tiene que comprobar el comportamiento que rompe
   el scenario.
2. Lee openspec/specs/auth/spec.md y openspec/specs/tasks/spec.md y cita,
   en cada hallazgo, el scenario por su titulo exacto.
3. A1, A2, A3, M4 y M5 son de frontend, donde no hay runner de tests:
   marcalos "sin cobertura posible hoy", nunca como cubiertos.
4. Devuelve una tabla: hallazgo | scenario | test que lo cubre (fichero y
   titulo) o "ninguno" | veredicto CUBIERTO / PARCIAL / NO CUBIERTO | por
   que. Un test que pasaria aunque el defecto siga ahi es NO CUBIERTO,
   aunque exista y este en verde.
5. Cierra con la lista de hallazgos NO CUBIERTOS y PARCIALES, ordenada por
   gravedad, y con los que no se pueden cubrir sin decidir antes el
   comportamiento esperado (por ejemplo M1 o A5). No arregles nada.
```

### Prompt 5 - Mejorar los tests para cubrir lo del adversarial

*Escribe los tests que faltan para los hallazgos NO CUBIERTOS o PARCIALES. Deben fallar mientras el defecto exista: no se ajustan para que pasen.*

```text
Mejora los tests del backend para que cubran los hallazgos NO CUBIERTOS o
PARCIALES que dejo la validacion anterior.

- Antes de tocar nada, comprueba que estas en una rama de trabajo (no main
  ni sN/*). Si no, crea feat/<slug>.
- Solo ficheros de backend/tests/functional/. No toques app/, validators,
  database/schema.ts ni .adonisjs/: aqui se escriben tests, no arreglos.
- Un test por scenario, con el titulo del scenario de openspec/specs/
  citado en un comentario, como hacen responsable_lista.spec.ts y los de
  auth. Aislamiento con testUtils.db().withGlobalTransaction().
- Cada test debe FALLAR mientras el defecto siga en el codigo. Son rojos a
  proposito: no los ajustes para que pasen, no uses skip ni todo.
- Tests a escribir, segun lo que el Prompt 4 diga que falta:
  C1: tarea done con fecha anterior a today -> isOverdue false en
      GET /tasks/:id y en la respuesta de PUT /due-date; y la misma
      tarea no done -> true; fecha igual a today -> false.
  C2: GET /tasks?status=archivado -> 422 con error sobre `status`, y
      status=done / pending / in_progress -> 200 y solo ese estado.
  A4: iniciales de "Ada  Lovelace" (dos espacios), " Ada", "   " y de
      un nombre de una letra; y fullName vacio -> nombre nulo en tasks.
  M2: GET /tasks/abc y /tasks/1e0 -> 404.
  M3: ?status=pending&status=done -> el ultimo sustituye al anterior.
  M6: dueDate "2026-02-31", "30/09/2026" y "2026-2-3" -> 422 sobre
      dueDate, y la tarea conserva la fecha que tenia.
  Ademas: crear (201, titulo vacio, solo espacios, 200 y 201 caracteres),
  cambiar estado (200, 404, 422, 401) y 401 sin token en cada ruta.
- Refuerza los tests debiles (M7): initials con el valor exacto, y
  notProperty sobre el cuerpo entero de la tarea, no solo sobre assignee.
- Si el scenario no basta para decidir el comportamiento esperado (M1, A5),
  NO inventes el test: listalo como decision pendiente.
- El cliente tipado de Japa busca la ruta por URL y no por metodo:
  /api/v1/tasks es a la vez index y store. Estrecha el tipo de `data` con
  `as unknown as ...` como en responsable_lista.spec.ts.
- Al terminar ejecuta solo `npm run lint` y `npm run typecheck` desde
  backend/ (los tests se ejecutan en el prompt siguiente) y usa /commit.
```

### Prompt 6 - Ejecutar los tests y decir si pasan o no

*Solo ejecucion: no cambia codigo. Separa los fallos esperados (el defecto existe) de los accidentales (el propio test esta mal).*

```text
Ejecuta los tests del backend de FlowSync y dime si pasan o no.
No modifiques ningun fichero en este paso.

1. Las suites functional usan el mismo SQLite que el servidor de desarrollo
   (backend/tmp/db.sqlite3): si hay un `npm run dev` abierto, avisame antes
   de lanzarlas.
2. Desde backend/, ejecuta `npm test`, `npm run lint` y `npm run typecheck`.
3. Para cada test que falle, dame: titulo, fichero, mensaje de error, el
   hallazgo del adversarial que detecta (C1, C2, ...) y tu hipotesis de la
   causa. Clasificalo en uno de dos grupos:
   a) ESPERADO: falla porque el defecto del hallazgo existe en el codigo.
   b) INESPERADO: falla por el propio test (preparacion, tipos, datos,
      orden de ejecucion) y no por el defecto.
4. Dame el recuento: N pasan, N fallan (esperados / inesperados), y una
   lista de los hallazgos que siguen sin ningun test en rojo ni en verde.
5. Cierra con un veredicto en una linea: PASA o NO PASA (tests, lint y
   typecheck por separado). No arregles nada.
```

### Prompt 7 - Corregir los defectos de los tests que fallan

*Solo actua sobre los fallos ESPERADOS del Prompt 6. Arregla el codigo, nunca el test, y repite hasta verde.*

```text
Corrige los defectos que han hecho fallar los tests del paso anterior.

- Si no hay fallos esperados, dilo y no cambies nada. Los fallos
  INESPERADOS son un problema del test: contestame cual es, no lo toques.
- Comprueba que estas en una rama de trabajo (no main ni sN/*). Si no,
  crea feat/<slug>.
- Un defecto cada vez, por gravedad: C1, C2, A4 y los que tengan un test en
  rojo. Busca la causa raiz, no el sintoma, y cita el scenario.
- Arregla el codigo, no el test: no borres ni relajes asserts, no uses skip.
  Solo si el test contradice la spec de openspec/specs/, explicamelo antes.
- Orientacion, a comprobar contra el codigo y no a copiar:
  C1: isOverdueOn debe exigir las tres condiciones de la spec (hay fecha,
      es anterior al dia de referencia y el estado no es done).
  C2: el validador de la lista debe rechazar con 422 sobre `status` todo
      valor fuera de TASK_STATUSES. Antes de cambiarlo, mira que motivo
      tuvo el commit 8c15707 y corrige tambien los comentarios que hoy
      afirman lo contrario de lo que hace el codigo.
  A4: calcular las iniciales sin depender de espacios dobles o vacios, y
      que un nombre vacio se trate como sin nombre.
- Frontend (A1, A2, A3, M4, M5): no hay runner de tests. Arreglalos igual,
  verifica con `npm run build` y `npm run lint` en frontend/, y describeme
  que comprobacion manual en el navegador deberia hacer yo.
- Respeta CLAUDE.md: respuestas con serialize() y transformers, imports
  por subpath, y no edites a mano database/schema.ts ni .adonisjs/.
- Si cambias rutas, controladores, validadores o transformers, actualiza en
  el mismo commit el documento OpenAPI (decoradores y
  backend/app/openapi/schemas.ts) y docs/capabilities/tasks/README.md.
- Tras cada arreglo, desde backend/: `npm test`, `npm run lint` y
  `npm run typecheck`. Repite hasta que los tres esten en verde. Si tras 3
  intentos sigue rojo, para y cuentame que probaste.
- Al terminar cada defecto, usa la skill /commit.
```

## Secuencia C - Tercera ronda adversarial

**Como usarlo.** Se pega despues de la secuencia B y con la misma regla: un prompt cada vez, leyendo el resultado antes del siguiente. Esta ronda nace de la revision adversarial que se hizo sobre las propias correcciones de la B (PR #4, tras los commits 5b87d54, 97dc2ce, 814cf3c, f8e08fa y 20cc8d3). No encontro hallazgos criticos: lo que queda esta sobre todo en el frontend, en un hueco de la spec de iniciales y en la coherencia del nombre. Los identificadores llevan el prefijo R3- para no confundirlos con los A1, M1... de la secuencia B, que eran otros hallazgos.

### Hallazgos de partida

*Resultado de la segunda revision del subagente adversarial-reviewer sobre el PR #4 (15-11-2026), hecha leyendo el codigo, sin ejecutar nada. Las columnas Donde, Scenario y Fallo son del revisor; Contraste es la comprobacion posterior leyendo el codigo. Dio por buenas las correcciones de backend: el matcher de ids, el ultimo status gana y isOverdueOn.*

| ID | Gravedad | Dónde | Scenario que se rompe | Fallo | Contraste |
|---|---|---|---|---|---|
| R3-A1 | Alto | frontend/src/pages/tasks-page.tsx:94-117, 243-251, 429-437 | Una lista sin filas no significa siempre lo mismo | Vista por defecto y fallo de carga: queda el aviso de error y debajo un spinner eterno "Comprobando si hay tareas hechas" sin reintento. needsDoneCount es falso con loadError y doneCount sigue en null. | Confirmado; ya estaba antes de la ronda B |
| R3-A2 | Alto | frontend/src/pages/tasks-page.tsx:96, 397-409 | Un filtro valido sin resultados es una lista vacia legitima; Una lista sin filas no significa siempre lo mismo | Con ?status=done y un fallo de carga se pinta "No hay ninguna tarea en Hecho" junto al aviso: un fallo se presenta como vacio legitimo. El catch hace setTasks([]). | Confirmado; ya estaba antes |
| R3-M1 | Medio | frontend/src/pages/task-page.tsx:51-55, 69 | Abrir una tarea que no existe | /tasks/05 y /tasks/1e0 pasan Number e isInteger y abren las tareas 5 y 1 bajo una URL que la API considera inexistente (f8e08fa). | Confirmado, discutible |
| R3-M2 | Medio | backend/app/models/user.ts:24-31; backend/tests/functional/auth/initials_edges.spec.ts:28 | Nombre de una sola palabra (requisito Iniciales de la cuenta: dos letras mayusculas) | Un nombre de una letra da una sola letra y un test lo fija como correcto. El comentario del test dice que la spec no dice nada, pero si dice dos letras. | Confirmado; decision pendiente |
| R3-M3 | Medio | `backend/app/models/user.ts:28,30` | Nombre de dos palabras; Nombre de una sola palabra | charAt(0) y slice(0,2) parten pares surrogate: con un emoji sale una cadena Unicode mal formada. Un espacio de ancho cero da iniciales invisibles. No hay tests de tabulador, unicode ni emoji. | Cierto por la logica, sin ejecutar |
| R3-M4 | Medio | backend/app/validators/user.ts:13; backend/app/transformers/user_transformer.ts:8; frontend/src/pages/profile-page.tsx:51 | Cuenta sin nombre; Perfil de una cuenta sin nombre; Responsable sin nombre | El alta acepta "   " sin trim y UserTransformer devuelve el nombre en bruto, mientras que el responsable de una tarea llega nulo: la misma cuenta es "Sin nombre" en la lista y vacia en el perfil. | Confirmado |
| R3-M5 | Medio | `backend/app/controllers/tasks_controller.ts:66-71` | Un solo estado por peticion; Estado inventado | status=pending&status= o status[]= dejan una cadena vacia como ultimo valor: VineJS la trata como ausente, da la vista por defecto y descarta el pending anterior sin avisar. Con mas de 20 status repetidos podria llegar un objeto. | Plausible, sin verificar |
| R3-M6 | Medio | backend/tests/functional/** (registrar con ada@example.com); initials_edges.spec.ts:37 | (calidad de los tests) | Los tests dependen de que ada@example.com no exista en la base de desarrollo compartida (hoy hay 0 filas). Si existe, el alta da 422 y fallan. Patron heredado de los tests de auth. | Riesgo real, hoy no ocurre |
| R3-M7 | Medio | backend/tests/functional/tasks/identificador.spec.ts; responsable_estricto.spec.ts:115 | Tarea que no existe; Tarea inexistente; La tarea no filtra datos de cuenta | No se prueban 0, ids gigantes ni PATCH/PUT con ceros o notacion cientifica. Un id mal formado sin token da 404 y no 401 (sin documentar). notInclude(texto, 'token') fallaria si un titulo contuviera esa palabra. Sin tests de frontend para A1 y A2. | Confirmado |

*Informativos del revisor, sin prompt propio: la documentacion OpenAPI sigue publica y sin auth; GET /tasks/:id valida today antes de buscar la tarea, asi que un id inexistente sin today da 422 y no 404; y pendingIds no se reinicia al cambiar de filtro, de modo que un cambio de estado en vuelo puede mostrar su error en otra vista. R3-A1, R3-A2 y R3-M1 son de frontend, donde no hay runner de tests: los prompts 8 a 11 los tratan aparte.*

### Prompt 8 - Validar la cobertura del adversarial (ronda 3)

*Solo lectura: para cada hallazgo R3-, dice si algun test lo detectaria. Un test que pasaria aunque el defecto siga ahi cuenta como no cubierto.*

```text
Valida si los tests del backend de FlowSync cubren los hallazgos de la
segunda revision del adversarial-reviewer, los de la seccion "Hallazgos de
partida" de la Secuencia C de PROMPTS-HALR-s4.pdf (R3-A1, R3-A2, R3-M1 a
R3-M7). No modifiques ningun fichero ni ejecutes los tests en este paso.

1. Para cada hallazgo, busca en backend/tests/functional/ un test que lo
   detecte: que FALLE si el defecto existe. Un test que solo pasa por la
   misma ruta no cuenta; tiene que comprobar el comportamiento que rompe
   el scenario.
2. Lee openspec/specs/auth/spec.md y openspec/specs/tasks/spec.md y cita,
   en cada hallazgo, el scenario por su titulo exacto.
3. R3-A1, R3-A2 y R3-M1 son de frontend, donde no hay runner de tests:
   marcalos "sin cobertura posible hoy", nunca como cubiertos.
4. R3-M6 y R3-M7 hablan de la calidad de los propios tests: para ellos
   el veredicto es si el defecto de los tests sigue ahi (si/no) y donde.
5. Devuelve una tabla: hallazgo | scenario | test que lo cubre (fichero y
   titulo) o "ninguno" | veredicto CUBIERTO / PARCIAL / NO CUBIERTO | por
   que. Un test que pasaria aunque el defecto siga ahi es NO CUBIERTO,
   aunque exista y este en verde.
6. Cierra con la lista de hallazgos NO CUBIERTOS y PARCIALES, ordenada por
   gravedad, y con los que no se pueden cubrir sin decidir antes el
   comportamiento esperado (R3-M2 y R3-M5 seguro; di si hay mas).
   No arregles nada.
```

### Prompt 9 - Mejorar los tests (ronda 3)

*Escribe los tests que faltan. Deben fallar mientras el defecto exista; lo que depende de una decision de producto se lista como pendiente y no se inventa.*

```text
Mejora los tests del backend para que cubran los hallazgos NO CUBIERTOS o
PARCIALES que dejo la validacion anterior.

- Antes de tocar nada, comprueba que estas en una rama de trabajo (no main
  ni sN/*). Si no, crea feat/<slug>.
- Solo ficheros de backend/tests/functional/. No toques app/, validators,
  frontend/, database/schema.ts ni .adonisjs/: aqui se escriben tests.
- Un test por scenario, con el titulo del scenario de openspec/specs/
  citado en un comentario. Aislamiento con
  testUtils.db().withGlobalTransaction().
- Cada test debe FALLAR mientras el defecto siga en el codigo. Son rojos a
  proposito: no los ajustes para que pasen, no uses skip ni todo.
- Tests a escribir:
  R3-M3: iniciales de "Ada<TAB>Lovelace" -> AL; de un nombre con emoji
      ("<emoji> Ana", "Ana <emoji>") -> iniciales que sean una cadena
      bien formada (String.prototype.isWellFormed) y no vacia.
  R3-M4: registrar con fullName "   " y consultar el perfil y el login:
      el nombre debe llegar nulo, igual que el responsable de una tarea
      (decision ya tomada en 814cf3c: nombre en blanco = sin nombre).
  R3-M5: ?status[]=pending&status[]=done -> gana el ultimo (done).
      Los casos con valor vacio al final (status=pending&status=) no se
      escriben: listalos como decision pendiente.
  R3-M7: ids "0" y uno gigante -> 404; PATCH /tasks/05/status y
      PUT /tasks/1e0/due-date -> 404; un id mal formado SIN token -> 404
      (y que el test lo deje dicho: la ruta no encaja antes de auth).
- Refuerza lo fragil (R3-M7): en responsable_estricto.spec.ts sustituye la
  busqueda de la palabra "token" por un recorrido de las claves del
  cuerpo que falle si aparece una clave token, password o email, sin
  depender de lo que diga un titulo.
- R3-M6: los tests no deben depender de que un email concreto este libre
  en la base de desarrollo. Genera emails unicos por test (por ejemplo
  con un sufijo aleatorio) en helpers.ts, conservando la parte que fija
  las iniciales cuando el test las comprueba.
- No escribas test para R3-M2 (nombre de una letra): la spec dice dos
  letras pero hay un test que fija una. Listalo como decision pendiente
  y NO cambies ese test hasta que yo decida.
- Frontend (R3-A1, R3-A2, R3-M1): no hay runner. No instales ninguno en
  este paso: lista los escenarios que un runner deberia cubrir.
- Al terminar ejecuta solo `npm run lint` y `npm run typecheck` desde
  backend/ (los tests se ejecutan en el prompt siguiente) y usa /commit.
```

### Prompt 10 - Ejecutar los tests (ronda 3)

*Solo ejecucion: no cambia codigo. Separa los fallos esperados (el defecto existe) de los accidentales (el propio test esta mal).*

```text
Ejecuta los tests de FlowSync y dime si pasan o no.
No modifiques ningun fichero en este paso.

1. Las suites functional usan el mismo SQLite que el servidor de desarrollo
   (backend/tmp/db.sqlite3): si hay un `npm run dev` abierto, avisame antes
   de lanzarlas. Si decides lanzarlas con el servidor abierto, guarda antes
   una copia de la base de datos y comparala despues.
2. Desde backend/, ejecuta `npm test`, `npm run lint` y `npm run typecheck`.
   Desde frontend/, ejecuta `npm run lint` y `npm run build`.
3. Para cada test que falle, dame: titulo, fichero, mensaje de error, el
   hallazgo R3- que detecta y tu hipotesis de la causa. Clasificalo:
   a) ESPERADO: falla porque el defecto del hallazgo existe en el codigo.
   b) INESPERADO: falla por el propio test (preparacion, tipos, datos,
      orden de ejecucion) y no por el defecto.
4. Dame el recuento: N pasan, N fallan (esperados / inesperados), y una
   lista de los hallazgos que siguen sin ningun test en rojo ni en verde
   (los de frontend entre ellos, que no se pueden ejecutar).
5. Cierra con un veredicto en una linea: PASA o NO PASA (tests, lint y
   typecheck del backend, y lint y build del frontend, por separado).
   No arregles nada.
```

### Prompt 11 - Corregir los defectos (ronda 3)

*Solo actua sobre los fallos esperados del Prompt 10 y sobre los defectos de frontend. Arregla el codigo, nunca el test; lo que necesita una decision, me lo preguntas.*

```text
Corrige los defectos que han hecho fallar los tests del paso anterior y los
de frontend de la tabla R3-.

- Si no hay fallos esperados ni defectos de frontend, dilo y no cambies
  nada. Los fallos INESPERADOS son un problema del test: contestame cual
  es, no lo toques.
- Comprueba que estas en una rama de trabajo (no main ni sN/*). Si no,
  crea feat/<slug>.
- Un defecto cada vez, por gravedad: R3-A1, R3-A2, R3-M4, R3-M3, R3-M1,
  R3-M5. Busca la causa raiz, no el sintoma, y cita el scenario.
- Arregla el codigo, no el test: no borres ni relajes asserts, no uses
  skip. Solo si el test contradice la spec, explicamelo antes.
- NO toques R3-M2 (nombre de una letra) ni el caso del valor vacio al final
  de R3-M5 sin preguntarme: son decisiones de producto, no defectos.
- Orientacion, a comprobar contra el codigo y no a copiar:
  R3-A1/R3-A2: no hacer setTasks([]) ante un error de carga; un estado
      propio de "carga fallida" y que la lista de finales compruebe
      loadError PRIMERO, con un boton de reintento. Un fallo no puede
      pintarse como "no hay tareas" ni dejar un spinner.
  R3-M1: validar el parametro de la ruta con /^[1-9][0-9]*$/ antes de
      convertirlo a numero, igual que hace el matcher del backend.
  R3-M3: construir las iniciales por caracteres reales (Array.from o
      Intl.Segmenter), no por unidades UTF-16.
  R3-M4: que UserTransformer use el mismo nombre normalizado que el
      responsable de la tarea, o normalizar al guardar el alta.
  R3-M5: el ultimo status gana tambien con status[]= repetido.
- Frontend: no hay runner de tests. Verifica con `npm run build` y
  `npm run lint` en frontend/, y describeme que comprobacion manual en el
  navegador deberia hacer yo para cada defecto.
- Respeta CLAUDE.md: respuestas con serialize() y transformers, imports
  por subpath, y no edites a mano database/schema.ts ni .adonisjs/.
- Si cambias rutas, controladores, validadores o transformers, actualiza en
  el mismo commit el documento OpenAPI (decoradores y
  backend/app/openapi/schemas.ts) y docs/capabilities/tasks/README.md.
- Tras cada arreglo, desde backend/: `npm test`, `npm run lint` y
  `npm run typecheck`. Repite hasta que los tres esten en verde. Si tras 3
  intentos sigue rojo, para y cuentame que probaste.
- Al terminar cada defecto, usa la skill /commit.
```
