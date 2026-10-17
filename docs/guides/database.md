# Database Guide

## Storage

`src/mastra/storage.ts` uses `PostgresStoreVNext` from `@mastra/pg`. Application state lives in the `mastra` schema; traces, metrics, logs, and other observability data use the `observability` schema.

Both `DATABASE_URL` and `OBSERVABILITY_DATABASE_URL` are required. The local Compose stack points both to the `postgres` service. Using a dedicated observability database is recommended for production.

The PostgreSQL 18 image includes pgvector and pg_partman. Initialization SQL enables them and creates both schemas on an empty volume. Mastra creates and migrates its own tables on startup.

## Host-Side Development

The database does not publish a host port by default. For `npm run dev` or host-side database tools, create a private local override outside version control:

```yaml
# compose.local.yaml
services:
  postgres:
    ports:
      - '127.0.0.1:${POSTGRES_PORT:-5432}:5432'
```

Add `compose.local.yaml` to `.git/info/exclude`, then start just the database:

```bash
docker compose --build -d
```

Set both storage URLs in `.env` to `postgresql://<user>:<encoded-password>@127.0.0.1:5432/<database>`. Then run `npm run dev`.

## External or Existing Databases

The server must have pgvector installed. Install pg_partman as well for automatic observability partition maintenance. The bundled container installs both packages; an external server administrator must supply them separately.

Set `DATABASE_URL` to the application database and login. If that login cannot provision the database/extensions, set `DATABASE_ADMIN_URL` to an administrator on the same server. Provision the application login separately, then run:

```bash
npm run db:setup
```

The script checks existing objects before creating the database, vector extension, optional partman extension, and both schemas. When the admin login differs, it grants the application login schema creation and partman rights. Failures are reported rather than ignored; an unavailable partman extension is explicitly logged as skipped.

This command provisions only the database named by `DATABASE_URL`. If observability uses a separate database, run it again with `DATABASE_URL` pointing at that database, and the appropriate admin login, before starting Mastra. Never pass admin credentials to the application runtime.

To produce SQL for a DBA without connecting:

```bash
npm run db:setup -- --sql setup.sql
```

Review the generated SQL before execution: skip `CREATE DATABASE` for existing databases, and omit optional partman steps if unavailable. File output avoids mixing SQL with script-runner log messages.

For Docker-managed existing volumes, use the host-side override above to run setup explicitly. Initialization SQL is not rerun when a volume already exists. Changing `POSTGRES_*` values does not update existing database names or logins.

## Observability Partitions

The bundled database preloads `pg_partman_bgw` and configures hourly maintenance for the configured database and role. On external servers, arrange equivalent background-worker configuration or scheduled maintenance with the administrator. For a separate observability database, configure maintenance for that database.

Without partman or another supported partition manager, the adapter's native partition creation has a finite future window. Do not rely on restarting the application as long-term maintenance. Verify partman registration and ongoing maintenance in your deployment.

No retention policy is configured by this template. Plan retention, monitoring, and backups for growing observability data. TimescaleDB is not installed.

## Privileges and Data

The Docker image initializes `POSTGRES_USER` as a superuser for local setup. Use a separate, least-privilege application login for production. Mastra's automatic table initialization needs schema creation permissions; a pre-provisioned deployment needs a separately validated privilege and migration strategy.

The volume is `postgres_data`, mounted at `/var/lib/postgresql` for PostgreSQL 18. `docker compose down` retains it; `down --volumes` deletes its data. Preserve project and volume identities when adopting an existing deployment.

This template does not migrate old SQLite/DuckDB storage. Back up old data and plan an explicit application-data migration if needed.
