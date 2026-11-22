from rest_framework import serializers

from apps.groups.models import Group
from apps.users.models import Student


class AgendaMemberSerializer(serializers.ModelSerializer):
    """Aventureiro na agenda — a matrícula do model vira `registration`."""

    registration = serializers.CharField(source="matricula")

    class Meta:
        model = Student
        fields = ["id", "name", "registration"]


class AgendaGroupSerializer(serializers.ModelSerializer):
    """Equipe **ativa** embutida na agenda: nome, brasão (ADR-016) e membros."""

    members = AgendaMemberSerializer(source="students", many=True, read_only=True)

    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "crest_shape",
            "crest_color",
            "crest_symbol",
            "members",
        ]


class ParticipationSerializer(serializers.Serializer):
    """Presença escrita como `{group_id, language}` (sem id próprio)."""

    group_id = serializers.IntegerField()
    language = serializers.CharField(max_length=100)


class IncursionSerializer(serializers.Serializer):
    """Incursão nas duas direções: o GET devolve `id`; o PUT o ignora."""

    id = serializers.IntegerField(required=False)
    number = serializers.IntegerField(min_value=1)
    # Título em branco passa pelo campo e vira erro de regra **na lista**
    # (com o número da incursão) — ver `validate_incursions`.
    title = serializers.CharField(max_length=100, allow_blank=True)
    date = serializers.DateField(required=False, allow_null=True)
    participations = ParticipationSerializer(many=True)


class AgendaSerializer(serializers.Serializer):
    """`GET/PUT /api/agenda/`: grupos ativos (só leitura) + incursões."""

    groups = AgendaGroupSerializer(many=True, read_only=True)
    incursions = IncursionSerializer(many=True)


def agenda_rule_errors(incursions: list) -> list[str]:
    """Regras de negócio da agenda — a view devolve como **lista DRF** no topo.

    Ficam fora do serializer de propósito: erro levantado dentro dele o DRF
    embrulha em `non_field_errors`; na view, `ValidationError([...])` chega ao
    cliente como `["…", "…"]` (regra dura do projeto).
    """
    errors: list[str] = []
    numbers = [inc["number"] for inc in incursions]
    if len(numbers) != len(set(numbers)):
        errors.append("Número de incursão repetido.")
    active = set(
        Group.objects.filter(is_active=True).values_list("id", flat=True)
    )
    for inc in incursions:
        if not inc["title"].strip():
            errors.append(f"Título da incursão {inc['number']} é obrigatório.")
        seen: set[int] = set()
        for part in inc["participations"]:
            if part["group_id"] not in active:
                errors.append(f"Equipe {part['group_id']} inexistente ou inativa.")
            elif part["group_id"] in seen:
                errors.append("Equipe repetida na mesma incursão.")
            seen.add(part["group_id"])
    return errors
