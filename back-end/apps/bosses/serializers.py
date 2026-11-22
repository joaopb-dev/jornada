from rest_framework import serializers

from apps.spells.models import Spell
from apps.users.permissions import is_teacher

from .models import Boss, BossAbility, BossSpell, Choice, Question


class BossAbilitySerializer(serializers.ModelSerializer):
    """Habilidade punitiva do chefe (leitura + escrita aninhada, ADR-017)."""

    class Meta:
        model = BossAbility
        fields = [
            "id",
            "name",
            "trigger",
            "effect",
            "value",
            "every",
            "threshold",
            "mode",
            "scope",
            "min_count",
            "description",
        ]


class BossSerializer(serializers.ModelSerializer):
    """CRUD de chefes.

    ``spells`` é declarado à mão porque o ModelSerializer do DRF deixa
    read-only todo M2M que tem modelo ``through`` (BossSpell). Aqui é
    escrita (PKs): o ``.set()`` cria as linhas do through com ``weight``
    padrão 1 — pesos são ajustados no endpoint ``api/boss-spells/``.

    ``abilities`` é escrita aninhada: na escrita, a lista **substitui** as
    habilidades do chefe (o front regrava a ficha inteira).
    """

    spells = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Spell.objects.all(),
        required=False,
    )
    spell_names = serializers.SerializerMethodField()
    abilities = BossAbilitySerializer(many=True, required=False)

    class Meta:
        model = Boss
        fields = [
            "id",
            "name",
            "specialty",
            "description",
            "image",
            "max_hp",
            "is_active",
            "spells",
            "spell_names",
            "abilities",
        ]

    def get_spell_names(self, obj):
        # Nome limpo (sem o prefixo do __str__ do Spell, que é "Feitiço: X").
        return [spell.name for spell in obj.spells.all()]

    def create(self, validated_data):
        abilities = validated_data.pop("abilities", [])
        boss = super().create(validated_data)
        BossAbility.objects.bulk_create(
            [BossAbility(boss=boss, **item) for item in abilities]
        )
        return boss

    def update(self, instance, validated_data):
        abilities = validated_data.pop("abilities", None)
        boss = super().update(instance, validated_data)
        if abilities is not None:
            boss.abilities.all().delete()
            BossAbility.objects.bulk_create(
                [BossAbility(boss=boss, **item) for item in abilities]
            )
        return boss


class BossSpellSerializer(serializers.ModelSerializer):
    """Vínculo chefe ↔ feitiço com o peso da IA do chefe."""

    boss_name = serializers.CharField(source="boss.name", read_only=True)
    spell_name = serializers.CharField(source="spell.name", read_only=True)

    class Meta:
        model = BossSpell
        fields = [
            "id",
            "boss",
            "boss_name",
            "spell",
            "spell_name",
            "weight",
        ]


class ChoiceSerializer(serializers.ModelSerializer):
    """Alternativa. O gabarito (``is_correct``) só sai para professor: a leitura
    é pública e o aluno não pode descobrir a resposta pela API."""

    class Meta:
        model = Choice
        fields = ["id", "question", "text", "is_correct"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if not (request and is_teacher(request.user)):
            data.pop("is_correct", None)
        return data


class NestedChoiceSerializer(ChoiceSerializer):
    """Alternativa dentro da ficha da pergunta: o ``question`` é o próprio
    objeto — o id vem do contexto, nunca do payload aninhado."""

    question = serializers.PrimaryKeyRelatedField(read_only=True)


class QuestionSerializer(serializers.ModelSerializer):
    """CRUD de perguntas da arguição/quiz, com alternativas aninhadas.

    Leitura e escrita: ``choices`` é aninhado gravável — na escrita a lista
    **substitui** as alternativas da pergunta (o front regrava a ficha
    inteira). As regras de forma (ao menos duas alternativas, uma correta)
    são validadas na view (lista DRF no topo — §4).
    """

    boss_name = serializers.CharField(source="boss.name", read_only=True, default=None)
    choices = NestedChoiceSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = [
            "id",
            "boss",
            "boss_name",
            "text",
            "language",
            "points",
            "choices",
        ]

    def create(self, validated_data):
        choices = validated_data.pop("choices", [])
        question = super().create(validated_data)
        Choice.objects.bulk_create(
            [
                Choice(
                    question=question,
                    **{k: v for k, v in item.items() if k != "question"},
                )
                for item in choices
            ]
        )
        return question

    def update(self, instance, validated_data):
        choices = validated_data.pop("choices", None)
        question = super().update(instance, validated_data)
        if choices is not None:
            question.choices.all().delete()
            Choice.objects.bulk_create(
                [
                    Choice(
                        question=question,
                        **{k: v for k, v in item.items() if k != "question"},
                    )
                    for item in choices
                ]
            )
        return question
