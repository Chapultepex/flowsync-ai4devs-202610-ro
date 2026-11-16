# Arquitectura de FlowSync

Este diagrama muestra los contenedores de FlowSync tal y como están hoy en el código: un frontend React que corre en el navegador, una API AdonisJS que atiende `/api/v1` y una base de datos SQLite en un fichero local. Las flechas indican quién llama a quién y con qué protocolo; cada caja resume lo que hay dentro de ella (rutas, controladores, modelos, transformers, tablas y pantallas).

```mermaid
C4Container
  title Contenedores de FlowSync

  Person(persona, "Persona del equipo", "Gestiona las tareas del equipo desde el navegador")

  System_Boundary(flowsync, "FlowSync") {
    Container(spa, "Frontend", "React 19, Vite 8, react-router, Tailwind v4", "Escucha en localhost:5173. Pantallas: login, registro, lista de tareas, tarea y perfil. lib/api.ts es el unico punto de contacto con la API. Guarda el token en localStorage con la clave flowsync.token")

    Container(api, "API", "AdonisJS 7, Lucid 22, VineJS 4", "Escucha en localhost:3333. Rutas /api/v1: auth signup y login, account profile y logout, tasks index store show status y due-date. Controladores NewAccount, AccessTokens, Profile, Tasks, TaskStatuses y TaskDueDates. Validadores VineJS. Modelos User y Task. Transformers User, Task, TaskDetail y TaskAssignee, y el serializador envuelve cada respuesta en data. Guard por defecto api con access tokens opacos")

    ContainerDb(db, "Base de datos", "SQLite, better-sqlite3", "Fichero backend/tmp/db.sqlite3 creado por las migraciones. Tablas users, auth_access_tokens y tasks")
  }

  Rel(persona, spa, "Usa", "navegador")
  Rel(spa, api, "Llama a /api/v1", "HTTP, JSON, cabecera Authorization Bearer")
  Rel(api, db, "Lee y escribe", "SQL via Lucid")
```

Fuentes leídas: `backend/start/routes.ts`, `backend/start/kernel.ts`, `backend/config/{auth,database,cors}.ts`, `backend/app/{controllers,models,transformers,validators}/`, `backend/providers/api_provider.ts`, `backend/database/migrations/`, `frontend/src/{main.tsx,routes,pages,auth,lib/api.ts}` y los `package.json` de ambos proyectos. No se dibuja nada que no salga de esos ficheros.
