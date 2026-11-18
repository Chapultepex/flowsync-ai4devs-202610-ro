import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  OPENAPI_DOCUMENT_PATH,
  renderOpenApiDocument,
  versionedDocumentPath,
} from '#openapi/render_document'

const MAX_DIFF_LINES = 40

/**
 * `npm run openapi:generate`: escribe el documento versionado.
 */
export async function generateDocument() {
  const target = versionedDocumentPath()
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, await renderOpenApiDocument())
  console.log(`Documento escrito en ${OPENAPI_DOCUMENT_PATH}`)
  return 0
}

/**
 * `npm run openapi:check`: solo compara. Regenera en un directorio temporal y
 * nunca escribe sobre el fichero versionado. Devuelve el código de salida.
 */
export async function checkDocument() {
  let committed: string
  try {
    committed = await readFile(versionedDocumentPath(), 'utf-8')
  } catch {
    console.error(`No existe ${OPENAPI_DOCUMENT_PATH}. Genéralo con \`npm run openapi:generate\`.`)
    return 1
  }

  const dir = await mkdtemp(join(tmpdir(), 'openapi-check-'))
  try {
    const regenerated = join(dir, 'openapi.json')
    await writeFile(regenerated, await renderOpenApiDocument())
    const fresh = await readFile(regenerated, 'utf-8')

    if (fresh === committed) {
      console.log(`${OPENAPI_DOCUMENT_PATH} está al día`)
      return 0
    }

    console.error(`${OPENAPI_DOCUMENT_PATH} no coincide con el documento que genera el código.`)
    console.error(describeDifference(committed, fresh))
    console.error(
      'Si el cambio es intencionado, ejecuta `npm run openapi:generate` y commitea el resultado.'
    )
    return 1
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/**
 * Quita el prefijo y el sufijo comunes y muestra solo el tramo que cambia
 * (`-` lo versionado, `+` lo regenerado).
 */
function describeDifference(committed: string, fresh: string) {
  const a = committed.split('\n')
  const b = fresh.split('\n')
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }
  const lines = [
    ...a.slice(start, endA).map((line) => `- ${line}`),
    ...b.slice(start, endB).map((line) => `+ ${line}`),
  ]
  const shown = lines.slice(0, MAX_DIFF_LINES)
  if (lines.length > shown.length) shown.push(`… y ${lines.length - shown.length} líneas más`)
  return `Primera diferencia en la línea ${start + 1} (- versionado, + regenerado):\n${shown.join('\n')}`
}
