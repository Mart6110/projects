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

4. **Run migrations** (sets up the local `db.sqlite3`, including the
   `SearchHistory` table that records each lookup).

   ```bash
   ./.venv/bin/python manage.py migrate
   ```

5. **Start the dev server.**

   ```bash
   ./.venv/bin/python manage.py runserver
   ```

6. **Open it in your browser** at [http://127.0.0.1:8000](http://127.0.0.1:8000).

7. **Search for a city** (e.g. "Copenhagen", "Tokyo", "Austin") and see:
   - current temperature, conditions, wind speed, humidity, and pressure
   - a 5-day forecast (high/low temperature and conditions per day)
   - a "Recent searches" table of the last 10 lookups, saved to the
     database

   An unrecognized city name shows an inline error instead of a crash.

8. **(Optional) Browse search history in Django admin.**

   ```bash
   ./.venv/bin/python manage.py createsuperuser
   ./.venv/bin/python manage.py runserver
   ```

   Then visit [http://127.0.0.1:8000/admin](http://127.0.0.1:8000/admin)
   and log in to see every `SearchHistory` record.

9. **Stop the server** with `Ctrl+C` when you're done.

## How it works

- `weather/services.py` calls Open-Meteo's geocoding API to turn a city
  name into coordinates, then its forecast API for current + daily
  weather, translating WMO weather codes into readable descriptions.
- `weather/models.py` defines `SearchHistory` — one row per successful
  search (city, temperature, humidity, pressure, conditions, timestamp).
- `weather/views.py` wires the service layer up to a single page
  (`weather/urls.py`, `weather/templates/weather/index.html`), saves a
  `SearchHistory` row on each successful lookup, and passes the 10 most
  recent rows to the template.
- Network or "city not found" errors are caught and shown as a message on
  the page rather than a 500 error.
