import app from '@adonisjs/core/services/app'

/**
 * Ruta del documento versionado, relativa a la raíz del repositorio. Vive fuera
 * de `backend/` porque el contrato es del proyecto, no del paquete del backend.
 */
export const OPENAPI_DOCUMENT_PATH = 'docs/api/openapi.json'

/**
 * Resuelve la ruta absoluta del documento versionado. `app.appRoot` es
 * `backend/`, y el repositorio cuelga un nivel por encima.
 */
export function versionedDocumentPath() {
  return new URL(`../${OPENAPI_DOCUMENT_PATH}`, app.appRoot).pathname
}

/**
 * Construye el documento con el mismo servicio que usa `GET /api.json` y lo
 * serializa de forma estable: indentado, con salto de línea final, de modo que
 * dos construcciones del mismo código dan bytes idénticos y el diff en git es
 * legible.
 */
export async function renderOpenApiDocument() {
  // El servidor HTTP confirma las rutas (`router.commit()`) al arrancar; en un
  // proceso de consola nadie lo hace y `router.toJSON()` sale vacío, con lo que
  // el documento no tendría ni un `path`. Se llama una vez por proceso.
  const router = await app.container.make('router')
  router.commit()

  const openapi = await app.container.make('openapi')
  const document = await openapi.buildDocument()
  return JSON.stringify(document, null, 2) + '\n'
}
