import re

from .models import Hotel
from controleDeAcesso.models import Endereco


def validar_cnpj(cnpj):
    cnpj = re.sub(r'[^\d]', '', cnpj)

    if len(cnpj) != 14:
        raise ValueError('CNPJ deve ter 14 dígitos.')

    if cnpj == cnpj[0] * 14:
        raise ValueError('CNPJ inválido.')

    def calcular_digito(digits, pesos):
        soma = sum(int(d) * p for d, p in zip(digits, pesos))
        resto = soma % 11
        return '0' if resto < 2 else str(11 - resto)

    pesos_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    dig1 = calcular_digito(cnpj[:12], pesos_1)
    dig2 = calcular_digito(cnpj[:12] + dig1, pesos_2)

    if cnpj[-2:] != dig1 + dig2:
        raise ValueError('CNPJ inválido.')

    return True


def formatar_cnpj(cnpj):
    digits = re.sub(r'[^\d]', '', cnpj)
    return f'{digits[:2]}.{digits[2:5]}.{digits[5:8]}/{digits[8:12]}-{digits[12:]}'


def criar_hotel(data, gestor):
    if Hotel.objects.filter(gestor=gestor).exists():
        raise ValueError('Gestor já possui um hotel cadastrado.')

    endereco_data = data.pop('endereco')
    endereco = Endereco.objects.create(**endereco_data)

    cnpj = data.pop('cnpj')
    cnpj_limpo = re.sub(r'[^\d]', '', cnpj)
    validar_cnpj(cnpj_limpo)

    hotel = Hotel.objects.create(
        endereco=endereco,
        gestor=gestor,
        cnpj=formatar_cnpj(cnpj_limpo),
        **data,
    )
    return hotel
