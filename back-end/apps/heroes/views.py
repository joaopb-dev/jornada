from rest_framework import viewsets

from apps.params import int_param

from .models import Hero
from .serializers import HeroSerializer


class HeroViewSet(viewsets.ModelViewSet):
    """CRUD de heróis (representante de uma equipe na batalha)."""

    queryset = Hero.objects.select_related("group", "journey").prefetch_related("spells")
    serializer_class = HeroSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        for field in ("group", "journey"):
            value = int_param(params, field)
            if value is not None:
                qs = qs.filter(**{f"{field}_id": value})
        return qs
