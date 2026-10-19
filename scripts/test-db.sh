#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
db_test_name="huoltopilotti-db-${RANDOM}"
docker run --name "$db_test_name" --network none -e POSTGRES_HOST_AUTH_METHOD=trust -d postgres:16-alpine >/dev/null
trap 'docker rm -f "$db_test_name" >/dev/null' EXIT
for attempt in $(seq 1 30); do
  if docker exec "$db_test_name" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec -i "$db_test_name" psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/bootstrap.sql
docker exec -i "$db_test_name" psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/202610190001_core.sql
docker exec -i "$db_test_name" psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/tenant_isolation.sql
