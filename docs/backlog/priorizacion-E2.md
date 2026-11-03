# Priorización de E2 «Gestión de tareas»: matriz de impacto y complejidad

Esta es la matriz acordada para E2. Incluye el sync en tiempo real, que pertenece a E3 «Actividad del equipo».

```
Impacto ▲
        |  QUICK WINS               |  PLANIFICAR
  ALTO  |  • FS-118 Fechas venc.    |  Sync tiempo real
        |    FS-142 Filtrar         |
        |---------------------------|-----------------------
        |  RELLENO                  |  EVITAR / APLAZAR
  BAJO  |  (hoy, vacío)             |  Comentarios
        +---------------------------+-----------------► Complejidad
           Baja complejidad           Alta complejidad
```

**Quick wins:** FS-118 (fechas de vencimiento) y FS-142 (filtrar por estado).

## Orden del backlog

**Requisito previo: [BASE-TAREAS].** Las tareas, sus estados y la lista. No es una historia de esta matriz, pero FS-118 y FS-142 no pueden empezar sin ella (ver sus tickets).

| Orden | Historia | Cuadrante | Alcance |
|---|---|---|---|
| 1 | FS-118 Fechas de vencimiento y tareas vencidas | Quick win | MVP, E2. Tickets en [`E2-gestion-tareas/FS-118-tickets.md`](E2-gestion-tareas/FS-118-tickets.md) |
| 2 | FS-142 Filtrar las tareas por estado | Quick win | MVP, E2. Tickets en [`E2-gestion-tareas/FS-142-tickets.md`](E2-gestion-tareas/FS-142-tickets.md) |
| 3 | Sync en tiempo real | Planificar | Fuera del MVP, E3 |
| 4 | Comentarios | Evitar / aplazar | Fuera del MVP |

## Notas

- **PA-13 sigue abierto en el PRD.** El PRD plantea que la fecha y el filtro aportan poco a las dos decisiones que el producto quiere mejorar. La matriz los clasifica como de alto impacto. Esta matriz es la decisión tomada; PA-13 debería cerrarse con ella.
- **La complejidad baja de FS-118 y FS-142 es relativa.** Lo es frente al sync en tiempo real y los comentarios. En sus tickets, FS-118 tiene un ticket con riesgo alto (FS-118.2, por PA-12), y ninguna de las dos historias puede empezar antes de [BASE-TAREAS].
