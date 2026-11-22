from django.db import transaction
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.groups.models import Group

from .models import Incursion, Participation
from .serializers import AgendaSerializer, agenda_rule_errors


class AgendaView(APIView):
    """`GET/PUT /api/agenda/` — calendário público de incursões (ADR-023).

    Leitura aberta / escrita só professor vêm do DEFAULT_PERMISSION_CLASSES
    (``ReadOnlyOrStaff``). O GET embute as equipes **ativas** com membros e
    brasão; o PUT substitui a agenda inteira em uma única transação (ou
    aceita, ou não grava nada) — erros de regra saem como lista DRF.
    """

    def get(self, request):
        return Response(self._payload())

    def put(self, request):
        serializer = AgendaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        errors = agenda_rule_errors(serializer.validated_data["incursions"])
        if errors:
            raise ValidationError(errors)
        with transaction.atomic():
            # Substituição total: o payload do professor é a nova verdade.
            Incursion.objects.all().delete()
            for inc in serializer.validated_data["incursions"]:
                obj = Incursion.objects.create(
                    number=inc["number"],
                    title=inc["title"].strip(),
                    date=inc.get("date"),
                )
                Participation.objects.bulk_create(
                    Participation(
                        incursion=obj,
                        group_id=part["group_id"],
                        language=part["language"].strip(),
                    )
                    for part in inc["participations"]
                )
        return Response(self._payload())

    @staticmethod
    def _payload():
        return AgendaSerializer(
            {
                "groups": Group.objects.filter(is_active=True).prefetch_related(
                    "students"
                ),
                "incursions": Incursion.objects.prefetch_related("participations"),
            }
        ).data
