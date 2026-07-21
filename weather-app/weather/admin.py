from django.contrib import admin

from .models import SearchHistory


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ("city_name", "temperature", "humidity", "pressure", "description", "searched_at")
    list_filter = ("city_name",)
    ordering = ("-searched_at",)
