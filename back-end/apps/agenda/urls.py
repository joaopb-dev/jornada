from django.urls import path

from .views import AgendaView

urlpatterns = [
    path("api/agenda/", AgendaView.as_view(), name="agenda"),
]
