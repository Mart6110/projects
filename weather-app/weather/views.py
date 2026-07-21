from django.shortcuts import render

from .models import SearchHistory
from .services import WeatherLookupError, get_weather_for_city


def index(request):
    city = request.GET.get("city", "").strip()
    context = {"city": city}

    if city:
        try:
            result = get_weather_for_city(city)
            context.update(result)
            SearchHistory.objects.create(
                city_name=result["location"]["name"],
                temperature=result["current"]["temperature"],
                humidity=result["current"]["humidity"],
                pressure=result["current"]["pressure"],
                description=result["current"]["description"],
            )
        except WeatherLookupError as exc:
            context["error"] = str(exc)

    context["recent_searches"] = SearchHistory.objects.all()[:10]

    return render(request, "weather/index.html", context)
