import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AlertCircleIcon, InfoIcon, Loader2Icon } from 'lucide-react'
import * as api from '@/lib/api'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/auth/use-auth'
import { useAuthForm } from '@/auth/use-auth-form'
import { TaskItem } from '@/components/task-item'
import { TaskFilter } from '@/components/task-filter'
import { FieldError } from '@/components/field-error'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DEFAULT_LIST_STATUSES,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from '@/lib/types'

const FIELDS = ['title'] as const

export function TasksPage() {
  const { user, token, expireSession } = useAuth()
  // `useAuthForm` no tiene nada de específico del acceso: reparte los errores
  // del backend entre el aviso general y cada campo, que es lo mismo que hace
  // falta aquí. Se reutiliza en vez de duplicar esa lógica.
  const { isSubmitting, formError, fieldErrors, submit, failWith } =
    useAuthForm(FIELDS)

  // El filtro vive en la URL y no en un estado interno: así se comparte por
  // enlace, el botón «atrás» del navegador lo deshace, y llegar con un estado
  // que no existe es un caso alcanzable de verdad y no una hipótesis. No se
  // guarda en ninguna otra parte — al entrar limpio a /tasks no hay filtro.
  const [searchParams, setSearchParams] = useSearchParams()
  // `?status=` vacío es lo mismo que no pedir filtro: sin `||` llegaría como
  // cadena vacía, que no es ningún estado y dejaría el control sin opción marcada.
  const statusParam = searchParams.get('status') || null

  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  // Cada vez que cambia se vuelve a pedir la lista: es lo que hace «Reintentar».
  const [reloadKey, setReloadKey] = useState(0)
  // El filtro pedido no existe. Va aparte de `loadError` a propósito: son dos
  // finales distintos y compartirlos es justo lo que hay que evitar.
  const [invalidFilter, setInvalidFilter] = useState<string | null>(null)
  // Cuántas tareas hechas hay, para distinguir «el espacio está vacío» de
  // «no queda nada abierto». Solo se resuelve cuando hace falta.
  const [doneCount, setDoneCount] = useState<number | null>(null)
  // La cuenta de hechas ha fallado. Va aparte de `doneCount` a propósito: no
  // saber cuántas hay no es lo mismo que saber que no hay ninguna.
  const [doneCheckFailed, setDoneCheckFailed] = useState(false)
  const [title, setTitle] = useState('')
  const [statusError, setStatusError] = useState<string | null>(null)
  // Lo que una acción mía se ha llevado fuera de la vista actual. No es un
  // error: es la diferencia entre que algo desaparezca y que algo se pierda.
  const [notice, setNotice] = useState<string | null>(null)
  // Tareas con un cambio de estado en vuelo, para no encadenar dos clics
  // sobre la misma fila antes de saber si el primero cuajó.
  const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(new Set())

  /**
   * El mismo predicado que aplica el servidor. Tenerlo también aquí es lo que
   * permite que un cambio de estado saque la fila de la vista en el acto, sin
   * volver a pedir la lista.
   */
  const matchesFilter = useCallback(
    (status: TaskStatus) =>
      statusParam
        ? status === statusParam
        : DEFAULT_LIST_STATUSES.includes(status),
    [statusParam],
  )

  useEffect(() => {
    if (!token) return

    let cancelled = false

    setTasks(null)
    setLoadError(null)
    setInvalidFilter(null)
    setDoneCount(null)
    setDoneCheckFailed(false)
    setNotice(null)
    setStatusError(null)

    api
      .listTasks(token, statusParam ?? undefined)
      .then((loaded) => {
        if (cancelled) return
        setTasks(loaded)
      })
      .catch((error: unknown) => {
        if (cancelled) return

        // Una sesión que el servidor ya no reconoce no se arregla con un aviso:
        // se cierra y el login explica por qué.
        if (error instanceof ApiError && error.status === 401) {
          expireSession(error.message)
          return
        }

        // El 422 sobre `status` es el filtro inventado, y tiene su propio
        // final: nunca se convierte en una lista vacía.
        if (error instanceof ApiError && error.fieldErrors.status) {
          setTasks([])
          setInvalidFilter(error.fieldErrors.status)
          return
        }

        // Un fallo de carga NO deja una lista vacía: `tasks` se queda sin cargar.
        // Vaciarla haría que el error se leyera como «aquí no hay nada», que es
        // justo lo que no se sabe.
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'No hemos podido cargar las tareas.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [token, statusParam, expireSession, reloadKey])

  const handleFilter = (status: TaskStatus | null) => {
    // Quitar el filtro es borrar el parámetro, no poner uno que diga «todas»:
    // la vista por defecto es la ausencia de filtro, no un filtro más.
    setSearchParams(status ? { status } : {})
  }

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault()
    if (!token) return

    // Un despiste evidente no merece un viaje al servidor. La validación de
    // verdad sigue siendo la del backend, que además recorta los espacios.
    if (!title.trim()) {
      failWith('title', 'Escribe un título para la tarea.')
      return
    }

    setNotice(null)

    return submit(async () => {
      let created: Task
      try {
        created = await api.createTask({ title }, token)
      } catch (error: unknown) {
        if (error instanceof ApiError && error.status === 401) {
          expireSession(error.message)
        }
        throw error
      }
      // La API devuelve la lista con las más recientes primero, así que la
      // recién creada entra por arriba. Sin recargar ni volver a pedirla.
      setTasks((current) => [created, ...(current ?? [])])
      setTitle('')

      // Toda tarea nace pendiente, así que con el filtro puesto en otro estado
      // el formulario parecería no hacer nada. Se dice dónde ha ido a parar.
      if (!matchesFilter(created.status)) {
        setNotice(
          `«${created.title}» se ha creado como pendiente, así que no aparece en esta vista.`,
        )
      }
    })
  }

  const handleChangeStatus = useCallback(
    async (task: Task, status: TaskStatus) => {
      if (!token || task.status === status || pendingIds.has(task.id)) return

      const previousStatus = task.status

      // El estado se pinta antes de que conteste el servidor: esperar a la red
      // no es «de inmediato». Si la petición falla, la fila vuelve al estado
      // real más abajo — dejarla mintiendo sería peor que no ser instantáneo.
      setTasks(
        (current) =>
          current?.map((item) =>
            item.id === task.id ? { ...item, status } : item,
          ) ?? current,
      )
      setPendingIds((current) => new Set(current).add(task.id))
      setStatusError(null)
      // Cambiar un estado puede cambiar cuántas tareas hay hechas: la cuenta que
      // se tuviera ya no vale y se vuelve a pedir si hace falta.
      setDoneCount(null)
      setDoneCheckFailed(false)
      setNotice(
        // Si el cambio la saca de la vista actual, desaparecer no puede
        // leerse como perderla: se dice adónde ha ido y cómo volver a verla.
        matchesFilter(status)
          ? null
          : `«${task.title}» ha pasado a «${TASK_STATUS_LABELS[status]}» y ya no aparece en esta vista.`,
      )

      try {
        const updated = await api.updateTaskStatus(task.id, status, token)
        setTasks(
          (current) =>
            current?.map((item) => (item.id === updated.id ? updated : item)) ??
            current,
        )
      } catch (error: unknown) {
        setTasks(
          (current) =>
            current?.map((item) =>
              item.id === task.id ? { ...item, status: previousStatus } : item,
            ) ?? current,
        )
        setNotice(null)
        if (error instanceof ApiError && error.status === 401) {
          expireSession(error.message)
          return
        }
        setStatusError(
          `No se ha podido cambiar el estado. ${
            error instanceof ApiError ? error.message : 'Inténtalo de nuevo.'
          }`,
        )
      } finally {
        setPendingIds((current) => {
          const next = new Set(current)
          next.delete(task.id)
          return next
        })
      }
    },
    [matchesFilter, pendingIds, token, expireSession],
  )

  // Lo que se pinta no es lo que trajo la API sino lo que sigue cumpliendo el
  // filtro: de aquí sale que marcar algo como hecho lo saque de la vista.
  const visibleTasks = tasks?.filter((task) => matchesFilter(task.status))

  // Una vista por defecto sin filas puede significar dos cosas muy distintas:
  // que no hay nada, o que ya está todo hecho. Decir la primera cuando la
  // verdad es la segunda le cuenta al equipo que no ha hecho nada. Una segunda
  // consulta lo resuelve, y se hace cada vez que la vista se queda vacía, no
  // solo al cargar: marcar como hecha la última tarea abierta también llega aquí.
  // Espera a que no haya cambios de estado en vuelo, o contaría las hechas antes
  // de que el servidor sepa de la última.
  const needsDoneCount =
    !statusParam &&
    !invalidFilter &&
    !loadError &&
    visibleTasks !== undefined &&
    visibleTasks.length === 0 &&
    pendingIds.size === 0 &&
    doneCount === null &&
    !doneCheckFailed

  useEffect(() => {
    if (!token || !needsDoneCount) return

    let cancelled = false

    api
      .listTasks(token, 'done')
      .then((done) => {
        if (!cancelled) setDoneCount(done.length)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) {
          expireSession(error.message)
          return
        }
        setDoneCheckFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [token, needsDoneCount, expireSession])

  // El estado pedido, si de verdad es uno de los tres. Se busca en vez de
  // afirmarlo con un `as`: lo que viene de la URL no merece ese voto de
  // confianza, y aquí es donde se nota si no lo era.
  const activeStatus = TASK_STATUSES.find((status) => status === statusParam)

  return (
    <div className="bg-muted/40 min-h-svh">
      <header className="bg-background border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 p-4">
          <h1 className="text-lg font-semibold tracking-tight">FlowSync</h1>
          {/* La única puerta al perfil, y con ella al cierre de sesión, ahora
              que la pantalla de entrada ya no es el perfil. */}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/profile">
              <span
                className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-medium"
                aria-hidden="true"
              >
                {user?.initials}
              </span>
              Mi perfil
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Tareas del equipo
          </h2>
          <p className="text-muted-foreground text-sm">
            Todo lo que tiene el equipo entre manos, con su responsable y su
            estado.
          </p>
        </div>

        <form onSubmit={handleCreate} className="mb-4 grid gap-2" noValidate>
          <Label htmlFor="title" className="sr-only">
            Título de la tarea
          </Label>
          <div className="flex gap-2">
            <Input
              id="title"
              name="title"
              placeholder="¿Qué hay que hacer?"
              autoComplete="off"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? 'title-error' : undefined}
              // Sin `maxLength`: cortar lo que se escribe es recortar en
              // silencio. Pasarse de largo se avisa, no se impide teclear.
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando…' : 'Crear tarea'}
            </Button>
          </div>
          <FieldError id="title-error" message={fieldErrors.title} />
        </form>

        <div className="mb-6">
          <TaskFilter value={statusParam} onChange={handleFilter} />
        </div>

        {(formError || statusError) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircleIcon />
            <AlertDescription>{formError ?? statusError}</AlertDescription>
          </Alert>
        )}

        {notice && (
          <Alert className="mb-6">
            <InfoIcon />
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}

        {loadError ? (
          // Primer final de todos: la lista no se ha podido cargar. Se comprueba
          // antes que cualquier vacío, porque un fallo no puede pintarse como
          // «no hay tareas» ni dejar un spinner esperando algo que no va a llegar.
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription className="flex flex-col items-start gap-3">
              <span>{loadError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        ) : visibleTasks === undefined ? (
          <div
            className="text-muted-foreground flex justify-center p-10"
            role="status"
            aria-live="polite"
          >
            <Loader2Icon className="size-6 animate-spin" />
            <span className="sr-only">Cargando tareas…</span>
          </div>
        ) : invalidFilter ? (
          // Primer final: lo que se ha pedido no existe. No se enseña una
          // lista vacía, que se leería como «el equipo no tiene nada de eso».
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription className="flex flex-col items-start gap-3">
              <span>
                {invalidFilter} Por eso no ves ninguna tarea: no es que el
                equipo no tenga trabajo en ese estado.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilter(null)}
              >
                Volver a la vista por defecto
              </Button>
            </AlertDescription>
          </Alert>
        ) : visibleTasks.length > 0 ? (
          <ul className="bg-background divide-y rounded-lg border">
            {visibleTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onChangeStatus={handleChangeStatus}
                isBusy={pendingIds.has(task.id)}
              />
            ))}
          </ul>
        ) : statusParam ? (
          // Segundo final: el filtro es válido y ahora mismo no hay nada en
          // ese estado. Es una respuesta legítima, no un fallo.
          <div className="bg-background rounded-lg border p-10 text-center">
            <p className="font-medium">
              No hay ninguna tarea en «
              {activeStatus ? TASK_STATUS_LABELS[activeStatus] : statusParam}»
            </p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
              El equipo no tiene nada en ese estado ahora mismo. Prueba con otro
              filtro o vuelve a la vista por defecto.
            </p>
          </div>
        ) : doneCheckFailed ? (
          // No se ha podido saber si hay tareas hechas. Decir «todavía no hay
          // nada» sería afirmar algo que no se sabe.
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription className="flex flex-col items-start gap-3">
              <span>
                No hemos podido comprobar si hay tareas terminadas, así que no
                sabemos si esta vista está vacía de verdad.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDoneCheckFailed(false)}
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        ) : doneCount === null ? (
          <div
            className="text-muted-foreground flex justify-center p-10"
            role="status"
            aria-live="polite"
          >
            <Loader2Icon className="size-6 animate-spin" />
            <span className="sr-only">Comprobando si hay tareas hechas…</span>
          </div>
        ) : doneCount > 0 ? (
          // Tercer final: no queda nada abierto, pero el equipo sí ha hecho
          // cosas. Decir aquí «todavía no hay nada» sería contarle al equipo
          // que no ha hecho nada.
          <div className="bg-background rounded-lg border p-10 text-center">
            <p className="font-medium">No queda nada pendiente ni en curso</p>
            <p className="text-muted-foreground mx-auto mt-1 mb-4 max-w-sm text-sm">
              {doneCount === 1
                ? 'Hay 1 tarea terminada, que esta vista deja fuera a propósito.'
                : `Hay ${doneCount} tareas terminadas, que esta vista deja fuera a propósito.`}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilter('done')}
            >
              Ver las hechas
            </Button>
          </div>
        ) : (
          // Cuarto final: aquí de verdad no hay nada todavía.
          <div className="bg-background rounded-lg border p-10 text-center">
            <p className="font-medium">Aquí todavía no hay nada</p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
              Esta es la lista del equipo: todo lo que apunte cualquiera aparece
              aquí, con quién lo lleva y en qué estado está. Escribe un título
              arriba para crear la primera tarea.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
