from rest_framework import serializers, validators

from .models import Hero


class HeroSerializer(serializers.ModelSerializer):
    """CRUD de heróis (ficha do catálogo; com group+journey, o representante
    da equipe na batalha — par group+journey único).

    ``spells`` é escrita (PKs); ``spell_names`` é só leitura para conveniência
    do front.
    """

    ATTRIBUTES = ("forca", "sabedoria", "carisma")

    group_name = serializers.SerializerMethodField()
    journey_name = serializers.SerializerMethodField()
    spell_names = serializers.SerializerMethodField()

    class Meta:
        model = Hero
        fields = [
            "id",
            "name",
            "group",
            "group_name",
            "journey",
            "journey_name",
            "hero_class",
            "role",
            "description",
            "passive",
            "attributes",
            "is_active",
            "spells",
            "spell_names",
            "max_hp",
            "hp",
            "shield",
            "power_bonus",
            "created_at",
        ]
        read_only_fields = ["created_at"]
        validators = [
            validators.UniqueTogetherValidator(
                queryset=Hero.objects.all(),
                fields=["group", "journey"],
                message="Este grupo já tem um herói nesta jornada.",
            )
        ]

    def get_journey_name(self, obj):
        return obj.journey.name if obj.journey else None

    def get_group_name(self, obj):
        return obj.group.name if obj.group else None

    def get_spell_names(self, obj):
        # Nome limpo (sem o prefixo do __str__ do Spell, que é "Feitiço: X").
        return [spell.name for spell in obj.spells.all()]

    def validate_attributes(self, value):
        """Ficha canônica: exatamente {forca, sabedoria, carisma} em 0..5."""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Atributos precisam de um objeto.")
        erros = []
        normalizado = {}
        for chave in self.ATTRIBUTES:
            bruto = value.get(chave, 0)
            if isinstance(bruto, bool) or not isinstance(bruto, int) or not 0 <= bruto <= 5:
                erros.append(f"{chave}: inteiro entre 0 e 5.")
                continue
            normalizado[chave] = bruto
        if erros:
            raise serializers.ValidationError(erros)
        return normalizado
