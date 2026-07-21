# sports-app database

MongoDB for the sports-app backend, packaged as its own build context
(mirroring `backend/` and `mobile/`) so it can be built and run like any
other service in the top-level `docker-compose.yml`.

## What's here

- `Dockerfile` — just `FROM mongo:7` plus the init script below. No custom
  configuration beyond that; the stock Mongo image does the work.
- `init/init.js` — runs automatically, once, the first time the container
  starts with an empty data directory (this is standard behavior for any
  `*.js`/`*.sh` file placed in `/docker-entrypoint-initdb.d/` in the
  official Mongo image). It creates a unique index on `users.email` so
  duplicate registrations are rejected at the database level, not just in
  application code.

## Usage

You normally don't run this directly — `docker compose up` from the
project root (`sports-app/`) builds and starts it alongside the backend.
If you want to run just the database on its own (e.g. to point a local
`go run .` at it):

```bash
cd sports-app
docker compose up --build mongo
```

This exposes MongoDB on `localhost:27017` with data persisted in the
`mongo-data` named volume, defined in the top-level `docker-compose.yml`.

## Inspecting the data

With the container running:

```bash
docker compose exec mongo mongosh sports_app
```

```js
db.users.find()
db.routines.find()
db.routine_sessions.find()
db.runs.find()
```

## Resetting

```bash
docker compose down -v   # -v also removes the mongo-data volume
```
