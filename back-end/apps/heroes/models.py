from django.db import models
from apps.spells.models import Combatant


# In-game representative of a group through a journey (1 hero per group
# per journey). The HP of a fight lives in StageProgress, each stage starts
# with the hero at max_hp.
class Hero(Combatant):
    class Role(models.TextChoices):
        ATAQUE = "Ataque", "Ataque"
        SUPORTE = "Suporte", "Suporte"

    name = models.CharField(
            max_length=100,
            verbose_name="Nome"
            )
    # Opcional: com grupo+jornada o herói é o representante da equipe na
    # batalha (1 por grupo por jornada); sem eles é um modelo/ficha avulso
    # do catálogo (front "Heróis" — ADR-024).
    group = models.ForeignKey(
            "groups.Group",
            related_name="heroes",
            null=True,
            blank=True,
            on_delete=models.CASCADE,
            verbose_name="Grupo",
            )
    journey = models.ForeignKey(
            "journeys.Journey",
            related_name="heroes",
            null=True,
            blank=True,
            on_delete=models.CASCADE,
            verbose_name="Jornada",
            )
    hero_class = models.CharField(
            max_length=100,
            blank=True,
            verbose_name="Classe",
            )
    role = models.CharField(
            max_length=20,
            choices=Role.choices,
            default=Role.ATAQUE,
            verbose_name="Função",
            )
    description = models.TextField(
            blank=True,
            verbose_name="Descrição",
            )
    passive = models.TextField(
            blank=True,
            verbose_name="Passiva",
            )
    attributes = models.JSONField(
            default=dict,
            blank=True,
            verbose_name="Atributos",
            help_text='{"forca","sabedoria","carisma"} — inteiros 0 a 5.',
            )
    is_active = models.BooleanField(
            default=True,
            verbose_name="Ativo"
            )
    spells = models.ManyToManyField(
            "spells.Spell",
            related_name="heroes",
            blank=True,
            verbose_name="Feitiços",
            )
    power_bonus = models.PositiveIntegerField(
            default=0,
            verbose_name="Bônus de poder",
            help_text="Somado ao valor base de cada feitiço lançado.",
            )
    created_at = models.DateTimeField(
            auto_now_add=True,
            blank=True,
            null=True,
            )

    class Meta:
        ordering = ["name"]
        constraints = [
                models.UniqueConstraint(fields=["group", "journey"], name="unique_hero_group_journey")
                ]
        verbose_name = "Herói"
        verbose_name_plural = "Heróis"

    def __str__(self):
        return self.name

    # Uses Spell interface to cast spell
    def cast(self, spell, target):
        if not self.spells.filter(pk=spell.pk).exists():
            raise ValueError(f"{self.name} não foi capaz de usar {spell.name}.")
        return spell.cast(target, power_bonus=self.power_bonus)
