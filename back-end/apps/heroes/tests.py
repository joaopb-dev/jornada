from django.test import TestCase

from apps.groups.models import Group
from apps.journeys.models import Journey
from apps.spells.models import Spell
from apps.test_helpers import anon_client, staff_client, user_client

from .models import Hero


class HeroApiTests(TestCase):
    """CRUD de heróis: 1 por equipe em cada jornada + feitiços equipados."""

    def setUp(self):
        self.jornada = Journey.objects.create(name="Jornada 1")
        self.outra_jornada = Journey.objects.create(name="Jornada 2")
        self.grupo = Group.objects.create(name="Guerreiros")
        self.outro_grupo = Group.objects.create(name="Magos")
        self.bola = Spell.objects.create(name="Bola de Fogo", base_value=7)
        self.cura = Spell.objects.create(name="Cura", spell_type=Spell.SpellType.HEAL)

    def test_listagem_publica_com_nomes(self):
        heroi = Hero.objects.create(name="Kovu", group=self.grupo, journey=self.jornada)
        heroi.spells.set([self.bola])  # M2M não entra no create()
        resp = anon_client().get("/api/heroes/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data[0]["group_name"], "Guerreiros")
        self.assertEqual(resp.data[0]["spell_names"], ["Bola de Fogo"])

    def test_visitante_nao_escreve(self):
        resp = anon_client().post("/api/heroes/", {"name": "X"}, format="json")
        self.assertIn(resp.status_code, (401, 403))

    def test_aluno_logado_nao_escreve(self):
        resp = user_client().post("/api/heroes/", {"name": "X"}, format="json")
        self.assertEqual(resp.status_code, 403)

    def test_ciclo_completo_do_professor(self):
        client = staff_client()
        criado = client.post(
            "/api/heroes/",
            {
                "name": "Emy",
                "group": self.outro_grupo.id,
                "journey": self.jornada.id,
                "spells": [self.bola.id, self.cura.id],
                "power_bonus": 2,
            },
            format="json",
        )
        self.assertEqual(criado.status_code, 201)
        self.assertEqual(criado.data["group_name"], "Magos")
        self.assertEqual(criado.data["spell_names"], ["Bola de Fogo", "Cura"])

        url = f"/api/heroes/{criado.data['id']}/"
        alterado = client.patch(url, {"spells": [self.cura.id]}, format="json")
        self.assertEqual(alterado.status_code, 200)
        self.assertEqual(alterado.data["spell_names"], ["Cura"])

        self.assertEqual(client.delete(url).status_code, 204)
        self.assertFalse(Hero.objects.exists())

    def test_dois_herois_na_mesma_equipe_e_jornada_rejeitado(self):
        Hero.objects.create(name="Primeiro", group=self.grupo, journey=self.jornada)
        resp = staff_client().post(
            "/api/heroes/",
            {"name": "Segundo", "group": self.grupo.id, "journey": self.jornada.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_mesma_equipe_pode_ter_heroi_em_outra_jornada(self):
        Hero.objects.create(name="Primeiro", group=self.grupo, journey=self.jornada)
        resp = staff_client().post(
            "/api/heroes/",
            {"name": "Segundo", "group": self.grupo.id, "journey": self.outra_jornada.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)

    def test_filtro_por_jornada(self):
        Hero.objects.create(name="A", group=self.grupo, journey=self.jornada)
        Hero.objects.create(name="B", group=self.grupo, journey=self.outra_jornada)
        resp = anon_client().get(f"/api/heroes/?journey={self.outra_jornada.id}")
        self.assertEqual([h["name"] for h in resp.data], ["B"])


class HeroFichaCatalogoTests(TestCase):
    """Ficha do catálogo de heróis (ADR-024): modelos avulsos (sem
    grupo/jornada), atributos 0..5 e a função."""

    def test_modelos_avulsos_coexistem(self):
        client = staff_client()
        # modelos avulsos: group/journey explícitos como null (sem eles o
        # UniqueTogetherValidator exigiria os campos)
        a = client.post(
            "/api/heroes/",
            {
                "name": "Arqueira",
                "hero_class": "Patrulha",
                "role": "Ataque",
                "group": None,
                "journey": None,
            },
            format="json",
        )
        self.assertEqual(a.status_code, 201, a.data)
        b = client.post(
            "/api/heroes/",
            {"name": "Sacerdotisa", "group": None, "journey": None},
            format="json",
        )
        self.assertEqual(b.status_code, 201, b.data)

        # leitura pública: sem grupo/jornada → null nos nomes
        resp = anon_client().get("/api/heroes/")
        self.assertEqual(resp.status_code, 200)
        nomes = {h["name"]: h for h in resp.data}
        self.assertIsNone(nomes["Arqueira"]["group_name"])
        self.assertIsNone(nomes["Arqueira"]["journey_name"])
        self.assertEqual(nomes["Arqueira"]["hero_class"], "Patrulha")
        self.assertEqual(nomes["Arqueira"]["role"], "Ataque")

    def test_atributos_normalizados_e_validados(self):
        client = staff_client()
        criado = client.post(
            "/api/heroes/",
            {
                "name": "Bárbara",
                "group": None,
                "journey": None,
                "attributes": {"forca": 5, "sabedoria": 2, "carisma": 0, "extra": 9},
            },
            format="json",
        )
        self.assertEqual(criado.status_code, 201, criado.data)
        # normaliza para a ficha canônica (só as 3 chaves)
        self.assertEqual(
            criado.data["attributes"], {"forca": 5, "sabedoria": 2, "carisma": 0}
        )

        # fora de 0..5 → 400 no campo attributes
        invalido = client.post(
            "/api/heroes/",
            {
                "name": "Quebrada",
                "group": None,
                "journey": None,
                "attributes": {"forca": 9, "sabedoria": 0, "carisma": 0},
            },
            format="json",
        )
        self.assertEqual(invalido.status_code, 400)
        self.assertIn("attributes", invalido.data)

    def test_passiva_descricao_e_funcao_no_ciclo(self):
        client = staff_client()
        criado = client.post(
            "/api/heroes/",
            {
                "name": "Guerreira",
                "group": None,
                "journey": None,
                "description": "Vem do deserto.",
                "passive": "Sangue Frio [revisar]",
                "role": "Suporte",
            },
            format="json",
        )
        self.assertEqual(criado.status_code, 201, criado.data)
        self.assertEqual(criado.data["description"], "Vem do deserto.")
        self.assertEqual(criado.data["passive"], "Sangue Frio [revisar]")
        self.assertEqual(criado.data["role"], "Suporte")

        # função fora do catálogo → 400
        resp = client.patch(
            f"/api/heroes/{criado.data['id']}/", {"role": "Tank"}, format="json"
        )
        self.assertEqual(resp.status_code, 400)

    def test_vincular_e_desvincular_de_uma_corrida(self):
        """O fluxo da tela de Missões: ligar o herói ao par grupo+jornada e
        devolvê-lo ao catálogo (null,null)."""
        jornada = Journey.objects.create(name="Jornada X")
        grupo = Group.objects.create(name="Equipe X")
        client = staff_client()
        heroi = client.post(
            "/api/heroes/",
            {"name": "Representante", "group": None, "journey": None},
            format="json",
        )
        vinculado = client.patch(
            f"/api/heroes/{heroi.data['id']}/",
            {"group": grupo.id, "journey": jornada.id},
            format="json",
        )
        self.assertEqual(vinculado.status_code, 200, vinculado.data)
        self.assertEqual(vinculado.data["group_name"], "Equipe X")

        # outro herói no mesmo par → rejeitado (1 por equipe por jornada)
        outro = client.post(
            "/api/heroes/", {"name": "Outro", "group": None, "journey": None},
            format="json",
        )
        conflito = client.patch(
            f"/api/heroes/{outro.data['id']}/",
            {"group": grupo.id, "journey": jornada.id},
            format="json",
        )
        self.assertEqual(conflito.status_code, 400)

        # devolver ao catálogo
        solto = client.patch(
            f"/api/heroes/{heroi.data['id']}/",
            {"group": None, "journey": None},
            format="json",
        )
        self.assertEqual(solto.status_code, 200)
        self.assertIsNone(solto.data["group"])