from datetime import date

from django.test import TestCase

from apps.groups.models import Group
from apps.test_helpers import anon_client, staff_client, user_client
from apps.users.models import Student

from .models import Incursion, Participation


class AgendaApiTests(TestCase):
    """`GET/PUT /api/agenda` — leitura pública, escrita só professor (ADR-023)."""

    def setUp(self):
        self.ativa = Group.objects.create(name="Lâmina de Prata")
        self.inativa = Group.objects.create(
            name="Equipe Arquivada", is_active=False
        )
        Student.objects.create(
            name="Ana Souza", matricula="558001", group=self.ativa
        )
        self.inc = Incursion.objects.create(
            number=1,
            title="O Despertar dos Paradigmas",
            date=date(2026, 9, 14),
        )
        Participation.objects.create(
            incursion=self.inc, group=self.ativa, language="C"
        )

    def test_leitura_publica_com_brasao_e_membros(self):
        resp = anon_client().get("/api/agenda/")
        self.assertEqual(resp.status_code, 200)

        # Só equipes ativas, com brasão (ADR-016) e membros embutidos.
        self.assertEqual(len(resp.data["groups"]), 1)
        group = resp.data["groups"][0]
        self.assertEqual(group["name"], "Lâmina de Prata")
        self.assertEqual(group["crest_shape"], "classico")
        self.assertEqual(group["crest_color"], "verde")
        self.assertEqual(group["crest_symbol"], "espada")
        self.assertEqual(group["members"][0]["registration"], "558001")

        inc = resp.data["incursions"][0]
        self.assertEqual(inc["number"], 1)
        self.assertEqual(inc["date"], "2026-09-14")
        self.assertEqual(
            inc["participations"],
            [{"group_id": self.ativa.id, "language": "C"}],
        )

    def test_visitante_nao_escreve(self):
        resp = anon_client().put(
            "/api/agenda/", {"incursions": []}, format="json"
        )
        self.assertIn(resp.status_code, (401, 403))

    def test_aluno_logado_nao_escreve(self):
        resp = user_client().put(
            "/api/agenda/", {"incursions": []}, format="json"
        )
        self.assertEqual(resp.status_code, 403)

    def test_professor_grava_e_lida_de_volta(self):
        payload = {
            "incursions": [
                {
                    "number": 1,
                    "title": "O Despertar dos Paradigmas",
                    "date": "2026-09-14",
                    "participations": [
                        {"group_id": self.ativa.id, "language": "Python"}
                    ],
                },
                {
                    "number": 2,
                    "title": "A Travessia Funcional",
                    "date": None,
                    "participations": [],
                },
            ]
        }
        resp = staff_client().put("/api/agenda/", payload, format="json")
        self.assertEqual(resp.status_code, 200, resp.data)

        self.assertEqual(Incursion.objects.count(), 2)
        self.assertEqual(
            Participation.objects.get(incursion__number=1).language, "Python"
        )

        read = anon_client().get("/api/agenda/")
        self.assertEqual(len(read.data["incursions"]), 2)
        self.assertEqual(read.data["incursions"][1]["date"], None)
        self.assertEqual(
            read.data["incursions"][0]["participations"][0]["language"],
            "Python",
        )

    def test_erros_de_regra_vem_como_lista_drf(self):
        payload = {
            "incursions": [
                {
                    "number": 1,
                    "title": "Repetida",
                    "participations": [
                        {"group_id": self.ativa.id, "language": "C"},
                        {"group_id": self.inativa.id, "language": "C"},
                    ],
                },
                {"number": 1, "title": "Também um", "participations": []},
            ]
        }
        resp = staff_client().put("/api/agenda/", payload, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIsInstance(resp.data, list)
        joined = " ".join(resp.data)
        self.assertIn("Número de incursão repetido.", joined)
        self.assertIn("inexistente ou inativa", joined)
        # Nada gravou (a escrita é atômica).
        self.assertEqual(Incursion.objects.count(), 1)

    def test_titulo_em_branco_vira_erro_na_lista(self):
        payload = {
            "incursions": [
                {"number": 1, "title": "   ", "participations": []}
            ]
        }
        resp = staff_client().put("/api/agenda/", payload, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIsInstance(resp.data, list)
        self.assertIn("Título da incursão 1 é obrigatório.", resp.data)

    def test_put_substitui_a_agenda_inteira(self):
        Incursion.objects.create(number=2, title="Somem na troca")
        payload = {
            "incursions": [
                {
                    "number": 1,
                    "title": "Fica",
                    "participations": [
                        {"group_id": self.ativa.id, "language": "C"}
                    ],
                }
            ]
        }
        resp = staff_client().put("/api/agenda/", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(Incursion.objects.count(), 1)
        self.assertEqual(Incursion.objects.get().title, "Fica")
        # A participação da incursão removida foi junto (cascade).
        self.assertEqual(Participation.objects.count(), 1)

    def test_data_invalida_rejeitada(self):
        payload = {
            "incursions": [
                {"number": 1, "title": "X", "date": "não-é-data",
                 "participations": []}
            ]
        }
        resp = staff_client().put("/api/agenda/", payload, format="json")
        self.assertEqual(resp.status_code, 400)
