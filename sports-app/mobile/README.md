# sports-app mobile

The React Native (Expo) app for the sports/exercise project: login/register,
create workout routines/programs, log completed sessions set-by-set, track
runs live via GPS, and see a combined history.

## Step-by-step usage

1. **Start the backend first.** This app has nothing to talk to without it
   — see `../backend/README.md`. Leave it running in another terminal.

2. **Find your computer's LAN IP address** (needed because a phone running
   Expo Go can't reach "localhost" — that means the phone itself, not your
   dev machine):

   ```bash
   # Linux
   ip addr show | grep "inet " | grep -v 127.0.0.1
   ```

   Look for something like `192.168.1.42`.

3. **Point the app at your backend.** Edit
   [`src/api/config.ts`](src/api/config.ts) and set `API_BASE_URL` to
   `http://<your-ip>:8080/api`.

4. **Open a terminal in this folder.**

   ```bash
   cd sports-app/mobile
   ```

5. **Install dependencies** (only needed once, or after pulling
   dependency changes).

   ```bash
   npm install
   ```

6. **Start the Expo dev server.**

   ```bash
   npx expo start
   ```

7. **Open it:**
   - **On your phone**: install the "Expo Go" app (App Store / Play
     Store), then scan the QR code shown in the terminal. Your phone must
     be on the **same Wi-Fi network** as your dev machine.
   - **In a simulator/emulator**: press `i` (iOS simulator, macOS only) or
     `a` (Android emulator) in the terminal running `expo start`.

8. **Register an account**, create a routine (add a few exercises with
   sets/reps/weight), tap into it and **Start Session** to log actual
   sets, or switch to the **Run** tab to GPS-track a run (grant location
   permission when prompted). Check the **History** tab afterward.

## Project structure

- `src/api/` — typed fetch client (`client.ts`), JWT stored via
  `expo-secure-store`, and one module per resource (`auth`, `routines`,
  `sessions`, `runs`).
- `src/context/AuthContext.tsx` — holds the logged-in user and exposes
  `login`/`register`/`logout`; the token itself lives in SecureStore, not
  React state.
- `src/navigation/RootNavigator.tsx` — switches between the auth stack
  (Login/Register) and the main app (bottom tabs: Routines, Run, History,
  Account) based on whether a user is logged in.
- `src/screens/` — one file per screen.
- `src/utils/geo.ts` — haversine distance, duration/pace formatting used
  by the run tracker.

## Notes

- IDs are MongoDB ObjectID hex strings now (`id: string` throughout
  `src/types.ts`), not numbers — the backend switched from SQLite to
  MongoDB. Embedded child records (routine exercises, session set logs,
  run GPS points) no longer have their own `id`/`*_id` fields since
  they're stored inline in their parent document rather than separate
  rows.
- Run tracking uses `expo-location`'s `watchPositionAsync` (foreground
  only) and computes distance client-side via the haversine formula
  between consecutive GPS points; the full point list is uploaded to the
  backend when you stop.
- There's no offline queue — if the backend is unreachable when you
  finish a run or session, saving will fail with an alert and the data is
  lost. Fine for local/dev use; would need addressing before wider use.
- Verified with `npx tsc --noEmit` (no type errors) and
  `npx expo export --platform web` (bundles cleanly, 534 modules) as a
  smoke test — actual on-device behavior (GPS, permissions) needs a real
  phone or simulator to verify, which wasn't available in the environment
  this was built in.
