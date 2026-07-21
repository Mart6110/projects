# sports-app

A sports/exercise app: workout routines/programs and GPS run tracking,
with a Go backend, MongoDB, and a React Native (Expo) mobile app.

- **`backend/`** — Go REST API (auth, routines, sessions, runs). See
  [backend/README.md](backend/README.md).
- **`database/`** — MongoDB, packaged as its own Docker build context. See
  [database/README.md](database/README.md).
- **`mobile/`** — Expo/React Native app (TypeScript). See
  [mobile/README.md](mobile/README.md).

## Quick start

```bash
# Terminal 1 — starts MongoDB + the Go API (see backend/README.md for a no-Docker option)
docker compose up --build

# Terminal 2 — first edit mobile/src/api/config.ts with your LAN IP
cd mobile && npm install && npx expo start
```

Then scan the QR code with Expo Go on your phone (same Wi-Fi network as
your computer), or press `i`/`a` for a simulator/emulator.
