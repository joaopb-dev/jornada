from django.db import models


class Incursion(models.Model):
    """Incursão da agenda — a data da apresentação da turma (ADR-023).

    A incursão tem **data única** (o dia da missão, para toda a turma) e
    recebe as participações das equipes, cada uma com a linguagem que
    será apresentada.
    """

    number = models.PositiveSmallIntegerField(
            unique=True,
            verbose_name="Número",
            )
    title = models.CharField(
            max_length=100,
            verbose_name="Título",
            )
    date = models.DateField(
            null=True,
            blank=True,
            verbose_name="Data",
            help_text="Data da apresentação (vazio = a definir).",
            )
    created_at = models.DateTimeField(
            auto_now_add=True,
            blank=True,
            null=True,
            )

    class Meta:
        ordering = ["number"]
        verbose_name = "Incursão"
        verbose_name_plural = "Incursões"

    def __str__(self):
        return f"Incursão {self.number} — {self.title}"


class Participation(models.Model):
    """Presença de uma equipe na incursão (a linguagem que ela apresenta)."""

    incursion = models.ForeignKey(
            Incursion,
            related_name="participations",
            on_delete=models.CASCADE,
            verbose_name="Incursão",
            )
    group = models.ForeignKey(
            "groups.Group",
            related_name="participations",
            on_delete=models.CASCADE,
            verbose_name="Equipe",
            )
    language = models.CharField(
            max_length=100,
            verbose_name="Linguagem",
            )

    class Meta:
        ordering = ["incursion__number", "group__name"]
        constraints = [
                models.UniqueConstraint(
                    fields=["incursion", "group"],
                    name="unique_participation",
                    ),
                ]
        verbose_name = "Participação"
        verbose_name_plural = "Participações"

    def __str__(self):
        return f"{self.group.name} · incursão {self.incursion.number} ({self.language})"
