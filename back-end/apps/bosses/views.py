from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from .models import Boss, BossSpell, Choice, Question
from .serializers import (
    BossSerializer,
    BossSpellSerializer,
    ChoiceSerializer,
    QuestionSerializer,
)


class BossViewSet(viewsets.ModelViewSet):
    """CRUD de chefes (HP, especialidade, habilidades punitivas e feitiços)."""

    queryset = Boss.objects.prefetch_related("spells", "abilities")
    serializer_class = BossSerializer


class BossSpellViewSet(viewsets.ModelViewSet):
    """CRUD dos vínculos chefe ↔ feitiço (peso da IA do chefe)."""

    queryset = BossSpell.objects.select_related("boss", "spell")
    serializer_class = BossSpellSerializer


class QuestionViewSet(viewsets.ModelViewSet):
    """CRUD de perguntas (com alternativas aninhadas na leitura e escrita)."""

    queryset = Question.objects.select_related("boss").prefetch_related(
        "choices"
    )
    serializer_class = QuestionSerializer

    @staticmethod
    def _rule_errors(request):
        """Regras de forma das alternativas — §4: **lista DRF no topo**.

        Só roda quando o payload traz ``choices`` (a ficha completa que o
        front grava); escritas esparsas sem a chave ficam por conta do motor,
        que só sorteia pergunta jogável (``battle._valid_questions``).
        """
        if "choices" not in request.data:
            return
        raw = request.data.get("choices")
        choices = raw if isinstance(raw, list) else []
        preenchidas = [
            item for item in choices
            if isinstance(item, dict) and str(item.get("text") or "").strip()
        ]
        erros = []
        if len(preenchidas) < 2:
            erros.append("Alternativas: ao menos duas.")
        elif not any(item.get("is_correct") for item in preenchidas):
            erros.append("Marque uma alternativa correta.")
        if erros:
            raise ValidationError(erros)

    def create(self, request, *args, **kwargs):
        self._rule_errors(request)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self._rule_errors(request)
        return super().update(request, *args, **kwargs)


class ChoiceViewSet(viewsets.ModelViewSet):
    """CRUD de alternativas de uma pergunta."""

    queryset = Choice.objects.select_related("question")
    serializer_class = ChoiceSerializer
