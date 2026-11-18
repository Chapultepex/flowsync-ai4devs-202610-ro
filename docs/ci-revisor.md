# Revisor de código en CI

El workflow `.github/workflows/claude-review.yml` lanza Claude Code sobre cada
pull request (al abrirlo, al empujar commits nuevos y al reabrirlo) y publica
los hallazgos como comentarios en el propio PR. Solo lee: tiene `Read`, `Grep`
y `Glob` más los comandos `gh pr diff|view|comment` y la herramienta de
comentarios en línea, y no puede escribir en el repositorio.

## Pasos manuales pendientes

Nada de esto lo puede hacer el workflow por sí mismo:

1. **Guardar la credencial como secreto del repositorio** (Settings → Secrets
   and variables → Actions → New repository secret). Ver «Credencial».
2. **Instalar la GitHub App de Claude** en el repositorio
   (<https://github.com/apps/claude>). La acción la usa para comentar.
3. **Confirmar los permisos de Actions**: el repositorio no debe restringir el
   `GITHUB_TOKEN` por debajo de lo que declara el workflow
   (`contents: read`, `pull-requests: write`, `id-token: write`).
4. **Comprobar que funciona**: abrir un PR de prueba y mirar que aparece el
   comentario del revisor. Si el trabajo termina en rojo sin comentarios, lo
   primero que hay que mirar es la credencial (siguiente sección).
5. **Revisar tres puntos que no pude comprobar al escribirlo** (ver
   «Sin verificar»).
6. **Si el repositorio ya tiene una regla de rama que exige comprobaciones**,
   decidir si «Claude review» debe ser obligatoria. Hoy es informativa.

## Credencial: dos caminos

No son intercambiables: cada uno usa **una entrada distinta de la acción** y
**un nombre de secreto distinto**. Cruzarlos (por ejemplo, poner el token de
suscripción en `anthropic_api_key`) falla en la primera llamada y el error no
explica el motivo.

### 1. Suscripción (el que usa el workflow)

- En local, con Claude Code instalado y la sesión iniciada con tu suscripción:
  `claude setup-token`. Genera un token de larga duración.
- Secreto del repositorio: **`CLAUDE_CODE_OAUTH_TOKEN`**.
- Entrada de la acción: **`claude_code_oauth_token`**.

```yaml
claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
```

El consumo se descuenta de los límites de tu suscripción, no se factura aparte.

### 2. Clave de API de la consola

- Se crea en la consola de Anthropic (<https://console.anthropic.com>).
- Secreto del repositorio: **`ANTHROPIC_API_KEY`**.
- Entrada de la acción: **`anthropic_api_key`**.

```yaml
anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

Se factura por uso. Para cambiar de camino, sustituye la línea de credencial
del workflow; no dejes las dos puestas.

## En qué se va el dinero

Cada revisión es una sesión de Claude Code con hasta 40 turnos
(`--max-turns 40`) y 10 minutos de reloj (`timeout-minutes: 10`). El coste
depende del tamaño del cambio, de cuántos archivos abre el revisor y del modelo.

- **Modelo: `--model sonnet --effort medium`.** Sonnet es el nivel intermedio:
  suficiente para detectar errores en un diff y bastante más barato que el
  nivel superior. `medium` limita cuánto razona por turno. Se eligió porque el
  revisor corre en *cada* push de *cada* PR.
- **Cómo cambiarlo:** editar `claude_args` en el workflow. Para más profundidad,
  un modelo mayor o `--effort high`; para gastar menos, `--effort low` o un
  modelo más pequeño. Los topes (`--max-turns`, `timeout-minutes`) son el límite
  duro de gasto por ejecución.
- **Precio:** no se copian cifras aquí porque cambian. Consulta la página
  oficial: <https://docs.claude.com/en/docs/about-claude/pricing>. Con
  suscripción, los límites de tu plan.

## Cambios propuestos desde un fork

El workflow se dispara con `pull_request`. En un repositorio público, GitHub
**no entrega los secretos** a los workflows de PR que vienen de un fork, y el
`GITHUB_TOKEN` es de solo lectura. Resultado: el revisor no puede autenticarse
ni comentar, y el trabajo falla en esos PR. Es el comportamiento seguro.

- No lo «arregles» cambiando a `pull_request_target`: ese evento sí recibe los
  secretos del repositorio base, y si además se hace checkout del código del
  fork, código no confiable corre con acceso a ellos.
- La acción además solo actúa por usuarios con permiso de escritura y trae
  `allow_fork_prs` y `restrict_untrusted_prs` (ambos activos por defecto).
- Opciones: revisar esos PR a mano, o que un colaborador con escritura empuje
  la rama del fork al repositorio y abra el PR desde ahí.

## Sin verificar

Escrito a partir de la documentación de la acción
(<https://github.com/anthropics/claude-code-action>), sin ejecutarlo en
GitHub. Tres cosas que la documentación que leí no confirma:

- `--effort`: es un flag que se pidió expresamente; la documentación de la
  acción que leí no lo menciona. Si el CLI instalado lo rechaza, el trabajo
  falla en el arranque.
- Los nombres de herramienta `mcp__github_inline_comment__create_inline_comment`
  y `Bash(gh pr comment|diff|view:*)` en `--allowedTools`: salen de mi memoria
  del ejemplo de revisión de la acción, no de las páginas que leí. Si el
  revisor no publica comentarios, empezar por aquí.
- El enlace de precios y el paso 2 (GitHub App).
