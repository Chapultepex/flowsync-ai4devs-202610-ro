# Capability `tasks`

La lista de trabajo compartida del equipo: una sola lista con todas las tareas del espacio, donde apuntar algo cuesta escribir un título y donde el responsable y el estado de cada tarea se leen sin abrir nada. Responde a «¿en qué anda cada uno?» sin preguntar a nadie.

**Fuente de verdad del comportamiento:** [`openspec/specs/tasks/spec.md`](../../../openspec/specs/tasks/spec.md). Este README no repite sus reglas: dice dónde está cada cosa en el código y cómo probarla, y remite a la spec para el qué. Si algo de aquí contradice la spec, manda la spec (y uno de los dos hay que corregirlo).

## Qué hace

- Crea una tarea a partir de un título; nace pendiente y a nombre de quien la crea.
- Lista las tareas del espacio, la misma lista para todo el mundo, acotable por estado.
- Cambia el estado de cualquier tarea entre tres estados fijos: `pending`, `in_progress`, `done`.
- Consulta una tarea suelta, con su fecha de vencimiento y si está vencida.
- Fija, cambia o quita la fecha de vencimiento de una tarea.
- Todo exige sesión (token de acceso de `auth`).

Quedan fuera, a propósito o por no existir todavía: editar el título, reasignar el responsable, borrar tareas, tareas privadas o «mis tareas», y refresco automático de la lista. Los motivos y los límites están en las propuestas de los changes archivados en [`openspec/changes/archive/`](../../../openspec/changes/archive/).

## Endpoints

Todos bajo `/api/v1/tasks`, con `Authorization: Bearer <token>`. La respuesta va envuelta en `{ "data": ... }` y los errores en `{ "errors": [...] }`. Rutas en [`backend/start/routes.ts`](../../../backend/start/routes.ts).

| Método | Ruta | Controlador | Qué hace | Requisitos de la spec |
|---|---|---|---|---|
| GET | `/api/v1/tasks` | `TasksController.index` | Lista; `?status=` opcional | «Una sola lista compartida del espacio», «Acotar la lista por estado», «La lista no lleva el vencimiento» |
| POST | `/api/v1/tasks` | `TasksController.store` | Crea con `{ "title" }` | «Creación de una tarea con solo el título», «Ninguna tarea sin título», «Aviso ante un título demasiado largo» |
| GET | `/api/v1/tasks/:id` | `TasksController.show` | Una tarea; `?today=AAAA-MM-DD` obligatorio | «Consulta de una tarea suelta», «El día de referencia lo pone quien mira» |
| PATCH | `/api/v1/tasks/:id/status` | `TaskStatusesController.update` | Cambia el estado, `{ "status" }` | «Cambio de estado de cualquier tarea», «Tres estados fijos» |
| PUT | `/api/v1/tasks/:id/due-date` | `TaskDueDatesController.update` | Fija o quita la fecha, `{ "dueDate", "today" }` | «Fijar, cambiar y retirar la fecha de vencimiento» |

Los códigos de respuesta, los parámetros y la forma de los objetos están descritos en el documento OpenAPI que sirve el backend: `http://localhost:3333/api` (interfaz) y `http://localhost:3333/api.json` (documento). Es una descripción derivada de los decoradores de los controladores y de [`backend/app/openapi/schemas.ts`](../../../backend/app/openapi/schemas.ts), no una fuente de verdad: ante una duda, la spec.

## Reglas de negocio

Las reglas están en la [spec](../../../openspec/specs/tasks/spec.md); aquí solo se indica en qué parte del código vive cada una.

| Tema | Requisitos de la spec | Dónde se aplica |
|---|---|---|
| Título, longitud y espacios | «Ninguna tarea sin título», «Aviso ante un título demasiado largo» | `createTaskValidator` en [`backend/app/validators/task.ts`](../../../backend/app/validators/task.ts) |
| Responsable y estado al crear | «Creación de una tarea con solo el título» | `TasksController.store`: no se leen de la petición |
| Los tres estados | «Tres estados fijos» | `TASK_STATUSES` en [`backend/app/models/task.ts`](../../../backend/app/models/task.ts) |
| Qué trae la lista sin filtro | «Una sola lista compartida del espacio» | `DEFAULT_LIST_STATUSES` en el modelo y `TasksController.index` |
| Qué datos del responsable salen | «Lo que cada tarea muestra de su responsable» | [`task_assignee_transformer.ts`](../../../backend/app/transformers/task_assignee_transformer.ts) |
| Cuándo una tarea está vencida | «Cuándo una tarea está vencida» | `Task.isOverdueOn` en el modelo: única definición |
| Día de referencia | «El día de referencia lo pone quien mira» | `taskReferenceDayValidator` y `setTaskDueDateValidator`: `today` obligatorio, sin valor por defecto |
| La lista no lleva el vencimiento | «La lista no lleva el vencimiento» | Dos transformers: [`task_transformer.ts`](../../../backend/app/transformers/task_transformer.ts) (lista) y [`task_detail_transformer.ts`](../../../backend/app/transformers/task_detail_transformer.ts) (detalle) |
| Identificador de la tarea | «Tarea que no existe», «Tarea inexistente» | `.where('id', ...)` sobre el grupo `tasks` en `routes.ts`: solo enteros positivos sin ceros delante; cualquier otra forma (`abc`, `5e0`, `05`) no encaja con la ruta y responde `404` |
| Exigir sesión | «Las tareas exigen sesión» | `middleware.auth()` sobre el grupo `tasks` en `routes.ts` |

La tabla `tasks` (migraciones `create_tasks_table` y `add_due_date_to_tasks_table`) guarda `title` (hasta 200 caracteres), `status` (texto, por defecto `pending`), el responsable como clave a `users` con borrado en cascada, las marcas de tiempo y `due_date` como fecha sin hora, nulable.

### Dónde la implementación y la spec no coinciden hoy

- **Cuerpo de `PUT /due-date`.** Los scenarios de fijar y quitar la fecha envían solo `{ "dueDate": ... }`, pero `setTaskDueDateValidator` exige también `today`.

## Interfaz

Pantallas en `frontend/src/pages/`: la lista en `/tasks` ([`tasks-page.tsx`](../../../frontend/src/pages/tasks-page.tsx), con [`task-filter.tsx`](../../../frontend/src/components/task-filter.tsx) y [`task-item.tsx`](../../../frontend/src/components/task-item.tsx)) y la tarea suelta en `/tasks/:id` ([`task-page.tsx`](../../../frontend/src/pages/task-page.tsx)), ambas rutas protegidas. Todas las llamadas a la API pasan por [`frontend/src/lib/api.ts`](../../../frontend/src/lib/api.ts). El comportamiento de las pantallas está en la misma spec, en los requisitos de interfaz.

## Cómo se prueba en local

Desde la raíz del repo:

```bash
make setup     # dependencias, .env, APP_KEY y migraciones
make start     # backend en :3333 y frontend en :5173 (uso interactivo)
```

- **A mano:** abre `http://localhost:5173`, regístrate y trabaja en `/tasks`. Para la API, `http://localhost:3333/api` es la interfaz del documento OpenAPI, donde se puede ver cada operación; las rutas con sesión necesitan el token que devuelve `POST /api/v1/auth/login` o `signup`.
- **Con curl:** `signup` o `login` te dan el token, y después, por ejemplo:

  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3333/api/v1/tasks?status=done"
  curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3333/api/v1/tasks/1?today=2026-11-15"
  ```

- **Tests automáticos** (desde `backend/`):

  ```bash
  cd backend
  npm test                                     # toda la suite
  node ace test functional --files=responsable # filtrar por fichero
  ```

  Cubren el responsable de la tarea, la creación, la lista y su filtro por estado, el cambio de estado, el vencimiento, los identificadores de la ruta y la sesión obligatoria ([`backend/tests/functional/tasks/`](../../../backend/tests/functional/tasks/)), además de `auth`. `tests/unit/` no existe. No hay tests del cambio de título ni de nada que la spec deje fuera, y los scenarios de interfaz no tienen ninguno: el frontend no tiene runner.
- **Ojo con la base de datos:** las suites functional usan el mismo fichero SQLite que el servidor de desarrollo (`backend/tmp/db.sqlite3`). Los tests de `tasks` aíslan lo que escriben con una transacción global; los que añadas deben hacerlo igual, o filtrarán estado a tu entorno.
- **Frontend:** no hay runner de tests. La comprobación es a mano en el navegador y con `npm run build` (typecheck) y `npm run lint` dentro de `frontend/`.
