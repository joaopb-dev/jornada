"""Leitura de query params com validação.

Filtros ``?group=abc`` chegam como string; passados direto ao ORM, o Django
levanta ``ValueError`` (HTTP 500 e, com ``DEBUG=True``, um traceback na
resposta — vazamento de caminhos e configurações). Com ``int_param`` o caso
vira 400 com mensagem clara e nunca estoura servidor.
"""

from rest_framework.exceptions import ValidationError


def int_param(params, name):
    """Retorna ``params[name]`` como ``int``, ``None`` se ausente.

    Valor não numérico (incluindo string vazia) levanta ``ValidationError``
    (HTTP 400) apontando o parâmetro problemático.
    """
    raw = params.get(name)
    if raw is None:
        return None
    try:
        return int(raw)
    except (TypeError, ValueError):
        raise ValidationError({name: "Informe um id numérico."})
