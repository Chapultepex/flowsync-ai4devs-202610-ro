/*
|--------------------------------------------------------------------------
| Generación y comprobación del documento OpenAPI
|--------------------------------------------------------------------------
|
| Uso (vía los scripts de `package.json`):
|
|   npm run openapi:generate   escribe docs/api/openapi.json
|   npm run openapi:check      regenera en un directorio temporal, compara con
|                              docs/api/openapi.json y falla si no coinciden
|
| No es un comando de ace a propósito: los comandos de `commands/` los valida
| `@adonisjs/ace` con `jsonschema@1.5.0`, que con Node 24 lanza «Invalid URL»
| para cualquier comando del proyecto. Este fichero arranca la aplicación igual
| que `bin/test.ts`, así que no depende de ese cargador.
|
*/

import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'

const APP_ROOT = new URL('../', import.meta.url)

const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

const action = process.argv[2]
if (action !== 'generate' && action !== 'check') {
  console.error('Uso: openapi.ts <generate|check>')
  process.exit(2)
}

const ignitor = new Ignitor(APP_ROOT, { importer: IMPORTER }).tap((app) => {
  app.booting(async () => {
    await import('#start/env')
  })
})

const app = ignitor.createApp('console')

try {
  await app.init()
  await app.boot()
  // `start` carga los preloads, es decir, `start/routes.ts`: sin rutas
  // registradas el documento saldría vacío.
  await app.start(async () => {
    const { generateDocument, checkDocument } = await import('#openapi/document_files')
    process.exitCode = action === 'generate' ? await generateDocument() : await checkDocument()
  })
} catch (error) {
  process.exitCode = 1
  prettyPrintError(error)
} finally {
  await app.terminate()
}
