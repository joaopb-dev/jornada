from django.contrib import admin

from .models import Incursion, Participation


class ParticipationInline(admin.TabularInline):
    model = Participation
    extra = 0


@admin.register(Incursion)
class IncursionAdmin(admin.ModelAdmin):
    list_display = ("number", "title", "date")
    ordering = ("number",)
    inlines = (ParticipationInline,)
