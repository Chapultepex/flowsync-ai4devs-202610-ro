# FlowSync: setup y arranque del monorepo (backend AdonisJS + frontend Vite).
# Funciona en macOS, Linux y Windows vía WSL. Solo usa sh POSIX, sin bashismos.

SHELL := /bin/sh
.DEFAULT_GOAL := help

NODE_MAJOR_MIN := 24

# Sale con 0 si algo escucha en localhost:<puerto>. `ace serve` y Vite no
# fallan con el puerto ocupado: se mudan a otro, y el frontend acabaría
# hablando con un backend que no es el suyo.
PORT_IN_USE := const s = require('net').connect(+process.argv[1], 'localhost'); s.on('connect', () => process.exit(0)); s.on('error', () => process.exit(1))

.PHONY: help setup start check-node

help:
	@echo "make setup  Instala dependencias, prepara backend/.env, genera APP_KEY y corre migraciones"
	@echo "make start  Levanta backend (http://localhost:3333) y frontend (http://localhost:5173)"

# En WSL, un node/npm de Windows (en /mnt/c/...) instala binarios nativos
# que no sirven en Linux; se exige el de la distro.
check-node:
	@command -v node >/dev/null 2>&1 || { echo "Error: no se encontró node. Instala Node.js $(NODE_MAJOR_MIN)+."; exit 1; }
	@case "$$(command -v node)" in /mnt/*) echo "Error: estás usando el node de Windows ($$(command -v node)). Instala Node.js dentro de WSL."; exit 1;; esac
	@major=$$(node -p 'process.versions.node.split(".")[0]'); \
	if [ "$$major" -lt $(NODE_MAJOR_MIN) ]; then \
		echo "Error: se requiere Node.js $(NODE_MAJOR_MIN)+ (tienes $$(node -v))."; exit 1; \
	fi

setup: check-node
	cd backend && npm install
	cd frontend && npm install
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env && echo "Creado backend/.env a partir de .env.example"; \
	fi
	@if grep -Eq '^APP_KEY=.+' backend/.env; then \
		echo "APP_KEY ya existe, no se regenera"; \
	else \
		cd backend && node ace generate:key; \
	fi
	cd backend && node ace migration:run

# Se para con Ctrl+C. Si uno de los dos servidores muere, se apaga el otro.
# - Los procesos en segundo plano de sh reciben /dev/null como stdin, y Vite
#   se cierra al ver EOF; por eso se les pasa el stdin original por el fd 3.
# - Se para con SIGINT porque `ace serve --hmr` ignora SIGTERM.
# - Se mata por PID y no con `kill 0`, que sin control de jobs (scripts, CI)
#   también mataría al proceso que lanzó make.
start: check-node
	@[ -f backend/.env ] || { echo "Error: falta backend/.env. Ejecuta 'make setup' primero."; exit 1; }
	@backend_port=$$(sed -n 's/^PORT=//p' backend/.env); \
	for port in $${backend_port:-3333} 5173; do \
		if node -e "$(PORT_IN_USE)" $$port; then \
			echo "Error: el puerto $$port ya está en uso. Para el proceso que lo ocupa y vuelve a intentarlo."; exit 1; \
		fi; \
	done
	@exec 3<&0; \
	(cd backend && exec npm run dev <&3) & backend=$$!; \
	(cd frontend && exec npm run dev <&3) & frontend=$$!; \
	stop() { kill -INT $$backend $$frontend 2>/dev/null; }; \
	trap stop INT TERM HUP; \
	while kill -0 $$backend 2>/dev/null && kill -0 $$frontend 2>/dev/null; do sleep 1; done; \
	stop; wait
