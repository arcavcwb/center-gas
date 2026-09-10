#!/usr/bin/env bash
# ==============================================================================
# Verificación de las migraciones contra un Postgres real, en Docker.
# ==============================================================================
# Aplica las 30 migraciones sobre una base vacía y ejecuta las aserciones
# funcionales de hardening_auditoria.test.sql.
#
# Es la única forma de saber si el esquema que describe el repositorio es
# aplicable de verdad: detecta colisiones de versión, migraciones no idempotentes
# y funciones que no compilan, cosas que un lint de SQL no ve.
#
#   Uso:  ./supabase/tests/run.sh
#
# No toca ninguna base remota. Sólo necesita Docker.
# ==============================================================================
set -euo pipefail

CONTAINER=cg-verify-run
IMAGE=postgres:15-alpine
DB=centergas
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS="$HERE/../migrations"

cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "▶ Levantando Postgres efímero…"
cleanup
docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=verify -e POSTGRES_DB="$DB" "$IMAGE" >/dev/null

for _ in $(seq 1 60); do
  docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done

psql_run() { docker exec "$CONTAINER" psql -U postgres -d "$DB" "$@"; }

echo "▶ Emulando el entorno Supabase (roles, auth.uid(), net.http_post)…"
docker cp "$HERE/_supabase_shim.sql" "$CONTAINER:/tmp/shim.sql" >/dev/null
psql_run -v ON_ERROR_STOP=1 -q -f /tmp/shim.sql 2>&1 | grep -v 'wal_level\|HINT' || true

echo "▶ Aplicando migraciones…"
docker cp "$MIGRATIONS" "$CONTAINER:/tmp/mig" >/dev/null
# pg_net no está en la imagen oficial; el shim ya provee net.http_post
docker exec "$CONTAINER" sh -c "sed -i 's/^CREATE EXTENSION IF NOT EXISTS pg_net;/-- pg_net: stub del shim/' /tmp/mig/*.sql"

fails=0
for f in $(docker exec "$CONTAINER" sh -c 'ls /tmp/mig/*.sql | sort'); do
  base=$(basename "$f")
  if out=$(psql_run -v ON_ERROR_STOP=1 -q -f "$f" 2>&1); then
    echo "  ✅ $base"
  else
    echo "  ❌ $base"
    echo "$out" | grep -E 'ERROR|LINE [0-9]|DETAIL' | head -6 | sed 's/^/       /'
    fails=$((fails + 1))
  fi
done

if [ "$fails" -ne 0 ]; then
  echo
  echo "✖ $fails migraciones fallaron. No se ejecutan las aserciones."
  exit 1
fi

echo "▶ Ejecutando aserciones funcionales…"
docker cp "$HERE/hardening_auditoria.test.sql" "$CONTAINER:/tmp/tests.sql" >/dev/null
if out=$(psql_run -v ON_ERROR_STOP=1 -f /tmp/tests.sql 2>&1); then
  echo "$out" | grep -E '  PASS|^===' | sed 's/^NOTICE:  //'
  echo
  echo "✔ $(echo "$out" | grep -c '  PASS') aserciones en verde."
else
  echo "$out" | grep -E '  PASS|FAIL|ERROR|^===' | sed 's/^psql:[^ ]* //; s/^NOTICE:  //'
  echo
  echo "✖ Hay aserciones en rojo."
  exit 1
fi
