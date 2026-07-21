from django.shortcuts import render

from .services import WeatherLookupError, get_weather_for_city


def index(request):
    city = request.GET.get("city", "").strip()
    context = {"city": city}

    if city:
        try:
            result = get_weather_for_city(city)
            context.update(result)
        except WeatherLookupError as exc:
            context["error"] = str(exc)

    return render(request, "weather/index.html", context)
