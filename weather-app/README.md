# weather-app

A small Django web app: search for a city and see its current conditions
plus a 5-day forecast. Uses the free [Open-Meteo](https://open-meteo.com/)
API — no signup or API key required.

## Step-by-step usage

1. **Open a terminal in this project folder.**

   ```bash
   cd weather-app
   ```

2. **Create a virtual environment** (only needed the first time).

   ```bash
   python3 -m venv .venv
   ```

3. **Install the dependencies.**

   ```bash
   ./.venv/bin/pip install -r requirements.txt
   ```

4. **Run migrations** (sets up Django's own local `db.sqlite3`; this app
   doesn't store weather data itself, but Django's admin/auth tables need
   it).

   ```bash
   ./.venv/bin/python manage.py migrate
   ```

5. **Start the dev server.**

   ```bash
   ./.venv/bin/python manage.py runserver
   ```

6. **Open it in your browser** at [http://127.0.0.1:8000](http://127.0.0.1:8000).

7. **Search for a city** (e.g. "Copenhagen", "Tokyo", "Austin") and see:
   - current temperature, conditions, and wind speed
   - a 5-day forecast (high/low temperature and conditions per day)

   An unrecognized city name shows an inline error instead of a crash.

8. **Stop the server** with `Ctrl+C` when you're done.

## How it works

- `weather/services.py` calls Open-Meteo's geocoding API to turn a city
  name into coordinates, then its forecast API for current + daily
  weather, translating WMO weather codes into readable descriptions.
- `weather/views.py` wires that up to a single page (`weather/urls.py`,
  `weather/templates/weather/index.html`) — no models/database needed
  since nothing is persisted.
- Network or "city not found" errors are caught and shown as a message on
  the page rather than a 500 error.
