"""Carrega os 6 heróis da landing com os feitiços (idempotente).

Espelho de ``front-end/mocks/landing-personagens.ts``: nome, classe,
função, descrição (``intro``), passiva, arte em ``/personagens/`` (já
servida pelo Next) e os 3 feitiços de cada herói — o custo vem do
parêntese do nome da fonte (2/3/5 PR) e o dado da primeira rolagem da
descrição. Os atributos nascem neutros 3/3/3: a landing não os define
(a ficha fica para o professor calibrar). Rodar de novo não duplica
feitiço nem apaga o que o professor equipou (upsert por nome + ``add``).

Uso:
    manage.py seed_herois
"""

from django.core.management.base import BaseCommand

from apps.heroes.models import Hero
from apps.spells.models import Spell

HEROIS = [
    {
        "name": "Jasper",
        "hero_class": "Druida",
        "role": "Suporte",
        "image": "/personagens/jasper.jpg",
        "description": (
            "suporte que usa a natureza e a adaptação para proteger a "
            "Aliança e controlar o combate."
        ),
        "passive": (
            "ao atingir nota máxima em Histórico, a equipe recebe +1 "
            "ponto de Mana."
        ),
        "spells": [
            {
                "name": "Torrente Sábia",
                "cost": 2,
                "dice": "1d10",
                "spell_type": "DMGE",
                "description": (
                    "causa 1d10 de dano no chefe por ponto obtido em "
                    "Histórico ou Características do Paradigma, "
                    "considerando o maior dos dois."
                ),
            },
            {
                "name": "Raízes Protetoras",
                "cost": 3,
                "dice": "2d10",
                "spell_type": "SHLD",
                "description": (
                    "rola 2d10 e guarda o resultado como barreira. "
                    "Penalidades do chefe são absorvidas por esse valor "
                    "antes de afetarem o Dano Base da Aliança."
                ),
            },
            {
                "name": "Equilíbrio Selvagem",
                "cost": 5,
                "dice": "—",
                "spell_type": "NONE",
                "description": (
                    "a Aliança escolhe entre ignorar completamente a "
                    "penalidade de Tempo do boss ou recuperar os pontos "
                    "de ação de uma equipe aliada que já agiu para o "
                    "nível máximo."
                ),
            },
        ],
    },
    {
        "name": "Emy",
        "hero_class": "Barda",
        "role": "Suporte",
        "image": "/personagens/emy.jpg",
        "description": (
            "suporte tático que inspira aliados e reduz o impacto de "
            "falhas de apresentação e perguntas."
        ),
        "passive": "",
        "spells": [
            {
                "name": "Palavras de Incentivo",
                "cost": 2,
                "dice": "1d10",
                "spell_type": "DMGE",
                "description": (
                    "rola 1d10 para preencher pontos perdidos se a "
                    "equipe tiver sido penalizada em Criatividade da "
                    "Apresentação ou Tempo, somando o valor ao dano da "
                    "Aliança."
                ),
            },
            {
                "name": "Canção de Foco",
                "cost": 3,
                "dice": "2d10",
                "spell_type": "NONE",
                "description": (
                    "rola 2d10; cada ponto ajuda a pagar a penalidade "
                    "do debuff do boss por respostas incorretas na "
                    "Fase 2."
                ),
            },
            {
                "name": "Inspiração Épica",
                "cost": 5,
                "dice": "2d10",
                "spell_type": "DMGE",
                "description": (
                    "causa 2d10 de dano no boss por equipe da Aliança "
                    "que atingiu o valor máximo em Criatividade. Recebe "
                    "3d6 adicionais se todas as equipes da Aliança "
                    "atingiram esse valor máximo."
                ),
            },
        ],
    },
    {
        "name": "Allya",
        "hero_class": "Bárbara",
        "role": "Ataque",
        "image": "/personagens/allya.jpg",
        "description": "ataque de força bruta, voltado a causar o máximo de destruição.",
        "passive": "",
        "spells": [
            {
                "name": "Fúria Básica",
                "cost": 2,
                "dice": "1d12+5",
                "spell_type": "DMGE",
                "description": "causa 1d12 + 5 de dano extra no boss.",
            },
            {
                "name": "Golpe Imprudente",
                "cost": 3,
                "dice": "3d12",
                "spell_type": "DMGE",
                "description": (
                    "causa 3d12 de dano extra. Se o boss atacar essa "
                    "equipe com penalidades, elas subtraem, além da "
                    "penalidade, mais 5 do dano da Aliança."
                ),
            },
            {
                "name": "Frenesi de Batalha",
                "cost": 5,
                "dice": "5d12",
                "spell_type": "DMGE",
                "description": "causa 5d12 de dano direto no boss.",
            },
        ],
    },
    {
        "name": "Kassi",
        "hero_class": "Clériga",
        "role": "Suporte",
        "image": "/personagens/kassi.jpg",
        "description": (
            "suporte que bloqueia mecânicas punitivas do boss e protege "
            "a pontuação base."
        ),
        "passive": "",
        "spells": [
            {
                "name": "Purificação",
                "cost": 2,
                "dice": "1d10",
                "spell_type": "HEAL",
                "description": (
                    "rola 1d10 para recuperar pontos perdidos em um "
                    "critério no qual a equipe tirou apenas "
                    "Satisfatório, somando-os ao dano."
                ),
            },
            {
                "name": "Escudo Sagrado",
                "cost": 3,
                "dice": "2d10",
                "spell_type": "SHLD",
                "description": (
                    "rola 2d10 para amortecer diretamente um debuff do "
                    "boss. Exemplo da fonte: uma penalidade de 20 e uma "
                    "rolagem de 15 resultam em perda de 5 pontos de "
                    "dano."
                ),
            },
            {
                "name": "Intervenção Divina",
                "cost": 5,
                "dice": "3d10",
                "spell_type": "SHLD",
                "description": (
                    "anula integralmente um debuff do boss e rola 3d10; "
                    "o resultado é distribuído para cobrir penalidades "
                    "da rubrica de qualquer equipe da Aliança e aumentar "
                    "seu dano."
                ),
            },
        ],
    },
    {
        "name": "Cillian",
        "hero_class": "Guerreiro",
        "role": "Ataque",
        "image": "/personagens/cillian.jpg",
        "description": (
            "ataque constante e tático, que aproveita as aberturas do "
            "chefe."
        ),
        "passive": "",
        "spells": [
            {
                "name": "Ataque Preciso",
                "cost": 2,
                "dice": "1d10",
                "spell_type": "DMGE",
                "description": (
                    "causa 1d10 de dano extra no boss, com 1d4 "
                    "adicional por equipe que atingiu o valor máximo "
                    "na apresentação do Uso da Linguagem."
                ),
            },
            {
                "name": "Golpe Demolidor",
                "cost": 3,
                "dice": "2d10",
                "spell_type": "DMGE",
                "description": "causa 2d10 de dano extra.",
            },
            {
                "name": "Mestre de Armas",
                "cost": 5,
                "dice": "4d10",
                "spell_type": "DMGE",
                "description": (
                    "causa 4d10 diretamente na vida do chefão, "
                    "ignorando qualquer escudo ou penalidade."
                ),
            },
        ],
    },
    {
        "name": "Kovu",
        "hero_class": "Ladino",
        "role": "Ataque",
        "image": "/personagens/kovu-enviado.png",
        "description": (
            "ataque que explora falhas e pontos fracos, condicionado ao "
            "desempenho em critérios específicos."
        ),
        "passive": "",
        "spells": [
            {
                "name": "Ataque Furtivo",
                "cost": 2,
                "dice": "2d10",
                "spell_type": "DMGE",
                "description": (
                    "se a equipe tirou Muito Satisfatório em "
                    "Criatividade, causa 2d10 de dano crítico."
                ),
            },
            {
                "name": "Reação Rápida",
                "cost": 3,
                "dice": "3d10",
                "spell_type": "DMGE",
                "description": (
                    "se o boss aplicar qualquer penalidade à equipe, "
                    "por tempo ou perguntas erradas, causa 3d10 de "
                    "dano em contra-ataque."
                ),
            },
            {
                "name": "Golpe de Risco",
                "cost": 5,
                "dice": "3d10",
                "spell_type": "DMGE",
                "description": (
                    "rola 3d10. Se a soma for maior que 15, o dano "
                    "total da apresentação da equipe recebe "
                    "multiplicador de 1,5x; se for 15 ou menos, soma "
                    "apenas o valor rolado."
                ),
            },
        ],
    },
]

# A ficha da landing não traz atributos: neutros até o professor calibrar.
ATTRIBUTOS_NEUTROS = {"forca": 3, "sabedoria": 3, "carisma": 3}


class Command(BaseCommand):
    help = "Carrega os 6 heróis da landing com os feitiços executáveis."

    def _get_hero(self, spec: dict) -> Hero:
        hero = Hero.objects.filter(name=spec["name"]).first()
        if hero is None:
            hero = Hero(name=spec["name"])
        hero.hero_class = spec["hero_class"]
        hero.role = spec["role"]
        hero.image = spec["image"]
        hero.description = spec["description"]
        hero.passive = spec["passive"]
        hero.attributes = dict(ATTRIBUTOS_NEUTROS)
        hero.is_active = True
        hero.save()
        return hero

    def _sync_spells(self, hero: Hero, specs: list) -> int:
        criados = 0
        ids = []
        for spec in specs:
            spell, was_created = Spell.objects.update_or_create(
                name=spec["name"],
                defaults={
                    "description": spec["description"],
                    "cost": spec["cost"],
                    "dice": spec["dice"],
                    "spell_type": spec["spell_type"],
                },
            )
            criados += int(was_created)
            ids.append(spell.id)
        # `add` (não `set`): restaura o kit canônico sem apagar o que o
        # professor equipou por conta própria.
        hero.spells.add(*ids)
        return criados

    def handle(self, *args, **options):
        heroes = 0
        criados = 0
        for spec in HEROIS:
            hero = self._get_hero(spec)
            heroes += 1
            criados += self._sync_spells(hero, spec["spells"])
        self.stdout.write(
            self.style.SUCCESS(
                f"seed_herois: {heroes} heróis e {criados} feitiços "
                f"(total no banco: {Spell.objects.count()} feitiços)."
            )
        )
