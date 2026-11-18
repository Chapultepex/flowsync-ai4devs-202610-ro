# Instrucciones para el revisor de PRs

Solo para revisiones. Léelo entero antes de abrir nada del cambio.

## Qué es grave

Un hallazgo es **grave** solo si cumple al menos una:

- Incumple un scenario de `openspec/specs/<capability>/spec.md`. Nombra el scenario.
- Expone datos de cuenta (email, tokens, hashes) o salta la autenticación.
- Pierde o corrompe datos: migración destructiva, escritura sobre la tarea equivocada.
- Rompe el contrato publicado: ruta, código de estado o forma de respuesta que cambia
  sin que `docs/capabilities/<nombre>/README.md` lo recoja.
- Incumple una regla de `CLAUDE.md` → «Reglas de proceso».

Todo lo demás es **sugerencia**. Un hallazgo grave sin scenario, regla o dato concreto
que citar baja a sugerencia.

## Tope de sugerencias

Como máximo **5** sugerencias, las de más valor. El resto, en una sola línea al final:
«y N sugerencias menores más (tipos: …)». No las detalles.

## Dónde no reportar

- Formato y estilo: lo vigilan prettier, eslint y oxlint.
- Tipos: lo vigila `tsc` (`npm run typecheck`, `npm run build`).
- Deriva del documento OpenAPI: lo vigila el workflow `openapi-check`. Tampoco
  comentes el contenido de `docs/api/openapi.json`; está generado.
- Ficheros generados: `backend/.adonisjs/`, `backend/database/schema.ts`,
  `frontend/src/components/ui/`, `package-lock.json`.
- Nombres, comentarios y preferencias de diseño sin efecto observable.
- Falta de tests sueltos. Solo es grave si el cambio toca un scenario de la spec.

## Evidencia

Para afirmar cómo se comporta algo, cita `archivo:línea` donde lo has **leído**. No lo
deduzcas del nombre de una función, de un comentario ni de un JSDoc: un comentario
puede decir lo contrario de lo que hace el código. Si no has abierto el código, di
«no verificado» en lugar de afirmarlo.

Cada hallazgo: gravedad, `archivo:línea`, qué ocurre y con qué entrada. Lee la salida
de los comandos directamente; no la redirijas a ficheros.
