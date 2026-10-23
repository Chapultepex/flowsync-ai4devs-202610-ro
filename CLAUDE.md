# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Contexto del repositorio

FlowSync es el repo de un ejercicio del curso (LIDR AI4Devs, cohorte 202610-ro); el README y `prompts.md` están en español. Es un monorepo con dos apps y sin `package.json` en la raíz. Ejecuta cada comando desde dentro de `backend/` o `frontend/`.

- `backend/`: API en AdonisJS 7 (TypeScript, Lucid ORM sobre SQLite, validación con VineJS, auth por tokens). El README indica que el backend **ya existe y no se debe modificar** en este ejercicio. Léelo para conocer el contrato de la API.
- `frontend/`: React 19 + Vite 8 + TypeScript. UI de login/registro/perfil con shadcn/ui contra la API del backend (ver "Estructura del frontend" más abajo).
- `README.md` se genera a partir de la lección del curso ("no se edita a mano"). No lo edites.
- `prompts.md` es una plantilla donde el estudiante registra, al pie de la letra, cada prompt que ejecutó.

Requiere **Node.js 24+**. Con Node 20, `node ace` falla con `Unknown file extension ".ts"`.

## Comandos

Backend (`cd backend`):
```bash
npm install
cp .env.example .env && node ace generate:key   # solo la primera vez
node ace migration:run                            # crea tmp/db.sqlite3
npm run dev          # node ace serve --hmr  → http://localhost:3333
npm test             # node ace test (Japa); suites: unit, functional
node ace test unit   # una suite
node ace test --files tests/functional/foo.spec.ts   # un archivo
node ace test --tests "test title"                    # un test por título
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run format       # prettier (@adonisjs/prettier-config)
```
Todavía no hay archivos de test. Las suites buscan `tests/unit/**/*.spec.ts` y `tests/functional/**/*.spec.ts`. La suite functional levanta el servidor HTTP, y `.env.test` usa `SESSION_DRIVER=memory`.

Frontend (`cd frontend`):
```bash
npm install
npm run dev      # vite → http://localhost:5173
npm run build    # tsc -b && vite build (esto es el typecheck)
npm run lint     # oxlint
npm run format   # prettier --write src
```
Un hook PostToolUse en `.claude/settings.json` ejecuta Prettier automáticamente sobre cada archivo editado dentro de `frontend/src/`. El frontend aún no tiene un test runner configurado.

Estructura del frontend: Tailwind v4 + shadcn/ui (`components.json`, alias `@/` → `src/`), rutas con `react-router` en `src/App.tsx` (`/login`, `/signup`, `/profile` protegida). Las llamadas a la API pasan por `src/lib/api.ts` (base `VITE_API_URL`, por defecto `http://localhost:3333/api/v1`; desenvuelve `data` y lanza `ApiError` con los errores por campo), y la sesión (token en `localStorage`) vive en `src/lib/auth.tsx`. Los componentes de `src/components/ui/` los genera `npx shadcn@latest add`: no se editan a mano.

## Arquitectura del backend

Flujo de una petición: `start/routes.ts` → controller → validator de VineJS → modelo Lucid → transformer → `ctx.serialize()`.

- **Los imports usan alias de subruta** definidos en `imports` de `package.json` (`#controllers/*`, `#models/*`, `#validators/*`, `#transformers/*`, `#generated/*`, etc.), no rutas relativas.
- **El código generado en `.adonisjs/`** (`server/controllers.ts`, `client/registry/*`) lo producen los hooks `indexEntities` y `generateRegistry` (Tuyau) de `adonisrc.ts`, y se commitea. Las rutas referencian los controllers como `controllers.NewAccount` desde `#generated/controllers`, así que los controllers nuevos aparecen ahí después de que el servidor de desarrollo o un build lo regenere. Nunca edites estos archivos a mano.
- **Envoltorio de respuesta**: `providers/api_provider.ts` añade `ctx.serialize()`, que envuelve cada payload en `{ data: ... }`. Úsalo en los controllers en lugar de devolver objetos en crudo.
- **Transformers** (`app/transformers/`) definen la lista blanca de campos que se envían al cliente. `UserTransformer` expone `id, fullName, email, createdAt, updatedAt, initials`, y nunca la contraseña.
- **Esquema**: `database/schema.ts` se genera a partir de las migraciones (`schemaGeneration` en `config/database.ts`), y los modelos lo extienden (`User extends compose(UserSchema, withAuthFinder(hash))`). Para cambiar el esquema, añade una migración nueva. No edites las migraciones existentes.
- **Auth**: el guard por defecto es `api` (access tokens opacos guardados en `auth_access_tokens`, con el valor prefijado `oat_`). Las rutas protegidas usan `middleware.auth()`. Los clientes envían `Authorization: Bearer <token>`.
- `force_json_response_middleware` hace que todas las respuestas sean JSON, incluidos los errores. En desarrollo, CORS permite cualquier origen.

### Contrato de la API (todo bajo `/api/v1`)

| Método | Ruta | Auth | Body | Respuesta |
|---|---|---|---|---|
| POST | `auth/signup` | – | `fullName` (nullable), `email`, `password`, `passwordConfirmation` | `{ data: { user, token } }` |
| POST | `auth/login` | – | `email`, `password` | `{ data: { user, token } }` |
| GET | `account/profile` | Bearer | – | `{ data: user }` |
| POST | `account/logout` | Bearer | – | `{ message }` (sin envolver) |

Reglas de validación (`app/validators/user.ts`): el email es obligatorio, válido, de 254 caracteres como máximo y único en el registro. La contraseña tiene entre 8 y 32 caracteres. `passwordConfirmation` es **obligatorio en el registro** y debe coincidir con `password`. `fullName` admite `null`, pero la clave tiene que venir en el body (si falta, 422 `required`). Los errores de validación devuelven 422 con un array `errors` (campo y mensaje). Las credenciales de login incorrectas y la falta de token devuelven errores JSON 4xx.

## Reglas de proceso
- Antes de tocar código: crear una rama nueva (`git checkout -b feat/<slug>`). Nunca commitear directo en `main` / `s1/start`.
- Al cerrar la tarea: usar la skill `/commit`, luego `gh pr create` con una descripción completa de los cambios en el cuerpo del PR.
- Después de abrir el PR: usar el subagente `adversarial-reviewer` sobre él, antes de darlo por terminado.
- No repitas ese resumen en el chat: la sesión se va a perder, el PR no. Responde solo con la URL del PR.