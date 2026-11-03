# Definition of Done por tipo de ticket

Cada ticket hereda los criterios de aceptación de su historia. Esta checklist no añade criterios: define cómo se entrega el trabajo.

## Común a todos los tickets

- [ ] Se trabaja en una rama `feat/…`, nunca en `main` ni en `s1/start`.
- [ ] Se commitea con `/commit` (commit convencional) y se abre un PR con `gh pr create`.
- [ ] El PR pasa por `adversarial-reviewer` antes de darlo por cerrado.
- [ ] Los criterios heredados que cubre el ticket se pueden comprobar en su capa.
- [ ] Si un criterio marcado como **[PROPUESTO]** se rechaza, se quita del ticket antes de empezarlo, no después.
- [ ] No hay cambios fuera de la capa que nombra el ticket.

## Migración/DB

- [ ] La migración es nueva: las existentes no se editan.
- [ ] `node ace migration:run` aplica la migración y regenera `database/schema.ts`. Ese archivo no se edita a mano y se commitea formateado, con el lint del backend limpio.
- [ ] El `down` de la migración revierte el cambio sin errores (`migration:rollback`).
- [ ] Los datos que ya existían siguen siendo válidos después de migrar.

## Modelo/Dominio

- [ ] El modelo no declara columnas: extiende la clase generada y solo añade lógica.
- [ ] La regla tiene tests unitarios (Japa, suite `unit`) con una fecha controlada, que no dependen del día en que se ejecutan.
- [ ] `npm run lint` y `npm run typecheck` pasan.

## Endpoint/API

- [ ] La entrada se valida con un validator de VineJS en `app/validators/`.
- [ ] Una entrada inválida devuelve un error por campo con el mismo formato que los errores existentes y un mensaje en español.
- [ ] La respuesta pasa por un transformer y `serialize()`, nunca como modelo en crudo.
- [ ] La ruta está protegida con `middleware.auth()`.
- [ ] Los controllers se referencian desde `#generated/controllers` y los imports usan los alias de subruta.
- [ ] El código regenerado en `.adonisjs/` se commitea.
- [ ] Hay al menos un test funcional del camino feliz y otro de error, en el propio ticket o en su ticket de Test.
- [ ] `npm run lint` y `npm run typecheck` pasan.

## Test

- [ ] Cada criterio heredado tiene al menos un test con su título.
- [ ] La base de datos queda aislada con los hooks de `testUtils.db()`. La suite functional usa el mismo archivo SQLite que el servidor de desarrollo.
- [ ] Las fechas son relativas a un "hoy" controlado. No hay fechas fijas que caduquen.
- [ ] `npm test` pasa en limpio dos veces seguidas.

## Frontend

- [ ] Las llamadas nuevas a la API viven en `src/lib/api.ts`, no en los componentes.
- [ ] Los errores se muestran a partir de `ApiError`, en español.
- [ ] Los componentes de `src/components/ui/` se añaden con `npx shadcn@latest add` y no se editan a mano.
- [ ] Nada se distingue solo por color (RNF-9), las acciones se pueden hacer con teclado y la interfaz está en español (RNF-7).
- [ ] `npm run build` y `npm run lint` pasan, y los archivos quedan formateados con Prettier.
- [ ] Cada criterio heredado se verifica a mano en el navegador: el frontend no tiene test runner.
