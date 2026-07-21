"""Thin client for the Open-Meteo geocoding + forecast APIs (no API key needed)."""

import requests

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

# https://open-meteo.com/en/docs#weathervariables (WMO weather interpretation codes)
WMO_DESCRIPTIONS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


class WeatherLookupError(Exception):
    """Raised when a city can't be found or an API call fails."""


def describe_weather_code(code):
    return WMO_DESCRIPTIONS.get(code, f"Unknown ({code})")


def geocode_city(city_name):
    """Return {name, country, latitude, longitude} for the best-matching city, or raise."""
    try:
        response = requests.get(
            GEOCODING_URL,
            params={"name": city_name, "count": 1, "language": "en", "format": "json"},
            timeout=10,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise WeatherLookupError(f"Could not reach the geocoding service: {exc}") from exc

    results = response.json().get("results")
    if not results:
        raise WeatherLookupError(f'No city found matching "{city_name}".')

    match = results[0]
    return {
        "name": match["name"],
        "country": match.get("country", ""),
        "latitude": match["latitude"],
        "longitude": match["longitude"],
    }


def get_forecast(latitude, longitude):
    """Return {current: {...}, daily: [{date, temp_max, temp_min, description, code}, ...]}."""
    try:
        response = requests.get(
            FORECAST_URL,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "current_weather": "true",
                "daily": "weathercode,temperature_2m_max,temperature_2m_min",
                "timezone": "auto",
                "forecast_days": 5,
            },
            timeout=10,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise WeatherLookupError(f"Could not reach the forecast service: {exc}") from exc

    data = response.json()

    current_raw = data["current_weather"]
    current = {
        "temperature": current_raw["temperature"],
        "windspeed": current_raw["windspeed"],
        "code": current_raw["weathercode"],
        "description": describe_weather_code(current_raw["weathercode"]),
    }

    daily_raw = data["daily"]
    daily = [
        {
            "date": date,
            "temp_max": temp_max,
            "temp_min": temp_min,
            "code": code,
            "description": describe_weather_code(code),
        }
        for date, temp_max, temp_min, code in zip(
            daily_raw["time"],
            daily_raw["temperature_2m_max"],
            daily_raw["temperature_2m_min"],
            daily_raw["weathercode"],
        )
    ]

    return {"current": current, "daily": daily}


def get_weather_for_city(city_name):
    """Look up a city and return its location plus current + 5-day forecast."""
    location = geocode_city(city_name)
    forecast = get_forecast(location["latitude"], location["longitude"])
    return {"location": location, **forecast}
