# sports-app backend

A Go REST API for the sports/exercise app: user accounts, workout
routines/programs, logged sessions, and GPS-tracked runs. Data is stored in
MongoDB (see `../database/`).

## Run with Docker (recommended)

The backend needs MongoDB running alongside it, so use the **top-level**
Docker Compose file, which starts both.

1. **Open a terminal at the project root** (not this folder).

   ```bash
   cd sports-app
   ```

2. **Build and start everything:**

   ```bash
   docker compose up --build
   ```

   This builds and starts both the `mongo` and `backend` services. Mongo's
   data lives in a named volume (`mongo-data`), so it survives restarts
   and rebuilds. The backend waits for Mongo's healthcheck before starting.

3. **(Optional) Set a real JWT secret** instead of the insecure dev
   default:

   ```bash
   export JWT_SECRET="something-long-and-random"
   docker compose up --build
   ```

4. **Try it:**

   ```bash
   curl localhost:8080/health
   ```

5. **Stop it** with `Ctrl+C`, or `docker compose down` (add `-v` to also
   wipe the Mongo volume/data).

See `../database/README.md` for details on the Mongo image/init script.

## Run locally with Go (without Docker)

You'll need a MongoDB instance reachable somewhere (e.g. `docker compose up
mongo` from the project root to run just the database, or a local/Atlas
instance).

1. **Open a terminal in this folder.**

   ```bash
   cd sports-app/backend
   ```

2. **Install dependencies.**

   ```bash
   go mod download
   ```

3. **Point at your MongoDB instance** and optionally set a real JWT
   secret:

   ```bash
   export MONGODB_URI="mongodb://localhost:27017"
   export MONGODB_DATABASE="sports_app"
   export JWT_SECRET="something-long-and-random"
   ```

4. **Run the server.**

   ```bash
   go run .
   ```

   It listens on `:8080` by default (override with `PORT`).

5. **Find your machine's LAN IP** if you'll be hitting this from the Expo
   app on a phone or simulator (not just `curl` on the same machine):

   ```bash
   # Linux
   ip addr show | grep "inet " | grep -v 127.0.0.1
   ```

   You'll plug this IP into `mobile/src/api/config.ts`.

6. **Try it with curl:**

   ```bash
   # Register
   curl -X POST localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"you@example.com","password":"hunter22"}'

   # Use the returned token for authenticated requests
   curl localhost:8080/api/routines -H "Authorization: Bearer <token>"
   ```

## API overview

All routes except register/login require `Authorization: Bearer <token>`.
IDs are 24-character MongoDB ObjectID hex strings (e.g.
`"6a5f962ba24789a975908bc8"`), not integers.

| Method | Path                | Description                              |
|--------|---------------------|-------------------------------------------|
| POST   | `/api/auth/register`| Create an account, returns a JWT           |
| POST   | `/api/auth/login`   | Log in, returns a JWT                      |
| GET    | `/api/routines`     | List your routines (with exercises)        |
| POST   | `/api/routines`     | Create a routine with a list of exercises  |
| GET    | `/api/routines/:id` | Get one routine                            |
| DELETE | `/api/routines/:id` | Delete a routine                           |
| GET    | `/api/sessions`     | List your logged workout sessions          |
| POST   | `/api/sessions`     | Log a completed session against a routine  |
| GET    | `/api/sessions/:id` | Get one session with its per-set logs      |
| GET    | `/api/runs`         | List your runs (summary, no GPS points)    |
| POST   | `/api/runs`         | Save a completed run with its GPS track    |
| GET    | `/api/runs/:id`     | Get one run including all GPS points       |

## How it works

- `internal/db` connects to MongoDB via the official Go driver
  (`go.mongodb.org/mongo-driver/v2`); `main.go` also ensures a unique index
  on `users.email` at startup (belt-and-suspenders alongside the same
  index created by `database/init/init.js` on first container start).
- `internal/auth` handles bcrypt password hashing and JWT issue/verify.
  The JWT subject is the user's ObjectID as a hex string;
  `auth.Middleware` parses it back into a `bson.ObjectID` and puts it on
  the request context.
- `internal/handlers` has one file per resource (auth, routines, sessions,
  runs), each a method on a shared `App{DB, Secret}` struct.
- Routines, sessions, and runs are each a single MongoDB document with
  their child data embedded directly — a routine's exercises, a session's
  per-set logs, and a run's GPS points all live inside their parent
  document as arrays, rather than separate joined tables. This meant no
  more manual joins or multi-statement transactions when this was
  SQLite — each resource is now a single `InsertOne`/`FindOne`.
- `GET /api/runs` (list) explicitly excludes the `points` array via a
  projection, since a run's full GPS track is only needed on the detail
  view.
- `Dockerfile` is a multi-stage build: compiles a static binary in a
  `golang:1.25-alpine` stage, then copies just that binary into a minimal
  `alpine` runtime image running as a non-root user, with a `HEALTHCHECK`
  against `/health`. It no longer needs a writable volume itself — all
  state lives in MongoDB.
