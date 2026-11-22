from django.db import models


class CrestShape(models.TextChoices):
    """Formato do escudo (gerador de brasão — Fase F, ADR-016).

    Os ids espelham o catálogo do front (`features/crest/lib/crest.ts`).
    """

    CLASSICO = "classico", "Clássico"
    ARREDONDADO = "arredondado", "Arredondado"
    LOSANGO = "losango", "Losango"
    HEXAGONO = "hexagono", "Hexágono"


class CrestColor(models.TextChoices):
    """Cor de fundo do brasão — mesmos ids do front."""

    VERDE = "verde", "Verde"
    AZUL = "azul", "Azul"
    VERMELHO = "vermelho", "Vermelho"
    ROXO = "roxo", "Roxo"
    DOURADO = "dourado", "Dourado"
    PRATA = "prata", "Prata"
    PRETO = "preto", "Preto"


class CrestSymbol(models.TextChoices):
    """Emblema central do brasão — mesmos ids do front."""

    ESPADA = "espada", "Espada"
    CORVO = "corvo", "Corvo"
    ARVORE = "arvore", "Árvore"
    CHAMA = "chama", "Chama"
    ESTRELA = "estrela", "Estrela"
    LUA = "lua", "Lua"
    CAVEIRA = "caveira", "Caveira"
    COROA = "coroa", "Coroa"


class Group(models.Model):
    name = models.CharField(
            max_length=100,
            unique=True,
            verbose_name="Nome",
            )
    points = models.IntegerField(
            default=0,
            verbose_name="Qtd. de pontos",
            )
    extra_points = models.IntegerField(
            default=0,
            verbose_name="Pontos extras",
            help_text="Lançados manualmente pelo professor.",
            )
    letter = models.CharField(
            max_length=1,
            null=True,
            blank=True,
            unique=True,
            verbose_name="Letra",
            help_text="Letra da equipe no mapa (opcional, uma por equipe).",
            )
    is_active = models.BooleanField(
            default=True,
            verbose_name="Ativo"
            )
    crest_shape = models.CharField(
            max_length=20,
            choices=CrestShape.choices,
            default=CrestShape.CLASSICO,
            verbose_name="Formato do brasão",
            )
    crest_color = models.CharField(
            max_length=20,
            choices=CrestColor.choices,
            default=CrestColor.VERDE,
            verbose_name="Cor do brasão",
            )
    crest_symbol = models.CharField(
            max_length=20,
            choices=CrestSymbol.choices,
            default=CrestSymbol.ESPADA,
            verbose_name="Emblema do brasão",
            )
    created_at = models.DateTimeField(
            auto_now_add=True,
            blank=True,
            null=True,
            )

    class Meta:
        ordering = ["name"]
        verbose_name = "Grupo"
        verbose_name_plural = "Grupos"

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.students.count()

    @property
    def total_points(self):
        return self.points + self.extra_points

    # Add points (earned in battles) to respective group
    def add_points(self, amount):
        self.points = models.F("points") + int(amount)
        self.save(update_fields=["points"])
        self.refresh_from_db(fields=["points"])

    # Add extra points (given by the teacher) to respective group
    def add_extra_points(self, amount):
        self.extra_points = models.F("extra_points") + int(amount)
        self.save(update_fields=["extra_points"])
        self.refresh_from_db(fields=["extra_points"])


class TeamAbilityTemplate(models.Model):
    """Catálogo de habilidade de equipe — o professor escolhe 3+1 por equipe.

    As habilidades são escolhidas **na criação da equipe**, conforme a
    tribo/temática do ano (`theme`), e usadas **só na Arena** (ADR-021).
    Efeitos beneficiam a equipe (polaridade invertida das habilidades do
    chefe): STRIKE (dano ao chefe), HEAL (recupera pontos de retaliação),
    SHIELD (absorve retaliação/penalidade) e BUFF (+% no próximo ataque).
    """

    class Kind(models.TextChoices):
        BASIC = "BASIC", "Básica"
        ULTIMATE = "ULTIMATE", "Ultimate"

    class Effect(models.TextChoices):
        STRIKE = "STRIKE", "Golpe (dano ao chefe)"
        HEAL = "HEAL", "Cura (recupera pontos)"
        SHIELD = "SHIELD", "Escudo (absorve dano da equipe)"
        BUFF = "BUFF", "Potencializa (próximo ataque)"

    theme = models.CharField(
            max_length=60,
            verbose_name="Tema / tribo",
            help_text="Ex.: Floresta — a temática do ano.",
            )
    name = models.CharField(
            max_length=80,
            verbose_name="Nome",
            )
    kind = models.CharField(
            max_length=9,
            choices=Kind.choices,
            default=Kind.BASIC,
            verbose_name="Tipo",
            )
    effect = models.CharField(
            max_length=10,
            choices=Effect.choices,
            default=Effect.STRIKE,
            verbose_name="Efeito",
            )
    value = models.PositiveIntegerField(
            default=10,
            verbose_name="Valor",
            help_text="Dano/pontos/porcentagem do efeito (antes do d20).",
            )
    max_charges = models.PositiveIntegerField(
            default=2,
            verbose_name="Cargas base",
            help_text="Por raid, ajustadas pela escala do bando (ADR-020).",
            )
    description = models.TextField(
            blank=True,
            default="",
            verbose_name="Descrição",
            )
    created_at = models.DateTimeField(
            auto_now_add=True,
            blank=True,
            null=True,
            )

    class Meta:
        ordering = ["theme", "kind", "name"]
        verbose_name = "Habilidade de equipe (modelo)"
        verbose_name_plural = "Habilidades de equipe (modelos)"

    def __str__(self):
        return f"{self.name} ({self.theme})"


class GroupAbility(models.Model):
    """Habilidade escolhida pelo professor para uma equipe (3+1, ADR-021)."""

    group = models.ForeignKey(
            Group,
            related_name="abilities",
            on_delete=models.CASCADE,
            verbose_name="Equipe",
            )
    template = models.ForeignKey(
            TeamAbilityTemplate,
            related_name="assignments",
            on_delete=models.PROTECT,
            verbose_name="Modelo",
            )
    charges_left = models.PositiveIntegerField(
            default=0,
            verbose_name="Cargas restantes",
            help_text="Repostas no início da raid e pelo professor (renovar).",
            )
    created_at = models.DateTimeField(
            auto_now_add=True,
            blank=True,
            null=True,
            )

    class Meta:
        constraints = [
                models.UniqueConstraint(
                    fields=["group", "template"],
                    name="unique_group_ability",
                    ),
                ]
        verbose_name = "Habilidade da equipe"
        verbose_name_plural = "Habilidades das equipes"

    def __str__(self):
        return f"{self.template} @ {self.group}"
