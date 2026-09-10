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

# La imagen oficial de Postgres arranca DOS veces: primero un servidor temporal
# para inicializar el cluster —que escucha SOLO en el socket unix— y despues el
# de verdad, ya por TCP. `pg_isready` sin -h usa el socket unix, asi que responde
# "listo" durante la primera fase: el script seguia, aplicaba el shim contra el
# servidor temporal, y el reinicio se lo llevaba por delante. En local no se
# notaba porque la imagen ya estaba cacheada y el timing lo tapaba; al meter esto
# en CI, donde hay que descargarla, fallaron 18 migraciones en cascada con
# "role anon does not exist".
#
# Preguntar por TCP elimina la ambiguedad: el puerto no escucha hasta que el
# servidor definitivo esta arriba.
ready=0
for _ in $(seq 1 90); do
  if docker exec "$CONTAINER" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then
    ready=1; break
  fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo "✖ Postgres no acepto conexiones TCP en 90s."
  docker logs "$CONTAINER" 2>&1 | tail -20
  exit 1
fi

psql_run() { docker exec "$CONTAINER" psql -h 127.0.0.1 -U postgres -d "$DB" "$@"; }

# Cinturon y tirantes: si el shim no deja los roles puestos, todo lo que viene
# despues falla en cascada con errores que no se parecen a la causa. Mejor
# detenerse aqui y decirlo.
assert_shim() {
  if ! psql_run -At -c "SELECT 1 FROM pg_roles WHERE rolname='anon'" 2>/dev/null | grep -q 1; then
    echo "✖ El shim no se aplico: el rol 'anon' no existe."
    exit 1
  fi
}

echo "▶ Emulando el entorno Supabase (roles, auth.uid(), net.http_post)…"
docker cp "$HERE/_supabase_shim.sql" "$CONTAINER:/tmp/shim.sql" >/dev/null
psql_run -v ON_ERROR_STOP=1 -q -f /tmp/shim.sql 2>&1 | grep -v 'wal_level\|HINT' || true
assert_shim

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
