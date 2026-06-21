import logging
import re
from datetime import timedelta
from decimal import Decimal

from django.core.mail import send_mail
from django.conf import settings

from .models import Hotel, Quarto, StatusQuarto, Reserva, StatusReserva
from controleDeAcesso.models import Endereco

logger = logging.getLogger(__name__)


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


def calcular_valor_total(categoria, data_entrada, data_saida):
    from tarifasManutencao.models import Tarifa

    valor_total = Decimal('0.00')
    current = data_entrada
    while current < data_saida:
        tarifa = Tarifa.objects.filter(
            categoria=categoria,
            dataInicio__lte=current,
            dataFim__gte=current,
        ).order_by('-dataInicio').first()

        valor_total += tarifa.valorDiaria if tarifa else categoria.precoBase
        current += timedelta(days=1)
    return valor_total


def verificar_disponibilidade(categoria, data_entrada, data_saida):
    total_rooms = categoria.quartos.filter(status=StatusQuarto.DISPONIVEL).count()
    overlapping = Reserva.objects.filter(
        categoria=categoria,
        status__in=[StatusReserva.PENDENTE, StatusReserva.CONFIRMADA],
        dataEntrada__lt=data_saida,
        dataSaida__gt=data_entrada,
    ).count()
    return max(0, total_rooms - overlapping)


def buscar_quarto_disponivel(categoria, data_entrada, data_saida):
    quartos = categoria.quartos.filter(status=StatusQuarto.DISPONIVEL)
    ocupados = Reserva.objects.filter(
        categoria=categoria,
        status__in=[StatusReserva.PENDENTE, StatusReserva.CONFIRMADA],
        dataEntrada__lt=data_saida,
        dataSaida__gt=data_entrada,
    ).values_list('quarto_id', flat=True)
    return quartos.exclude(pk__in=ocupados).first()


def enviar_email_confirmacao_reserva(reserva):
    try:
        send_mail(
            subject=f'Reserva {reserva.codigo} confirmada - Serro Hotelaria',
            message=(
                f'Olá {reserva.hospede.first_name},\n\n'
                f'Sua reserva foi realizada com sucesso!\n\n'
                f'Código: {reserva.codigo}\n'
                f'Hotel: {reserva.hotel.nome}\n'
                f'Categoria: {reserva.categoria.nome}\n'
                f'Quarto: {reserva.quarto.numero}\n'
                f'Check-in: {reserva.dataEntrada.strftime("%d/%m/%Y")}\n'
                f'Check-out: {reserva.dataSaida.strftime("%d/%m/%Y")}\n'
                f'Hóspedes: {reserva.numHospedes}\n'
                f'Valor Total: R$ {reserva.valorTotal:.2f}\n\n'
                f'Aguardamos você!'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[reserva.hospede.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.warning(f'Falha ao enviar email de confirmação para {reserva.hospede.email}: {e}')


def enviar_email_cancelamento_reserva(reserva):
    try:
        send_mail(
            subject=f'Reserva {reserva.codigo} cancelada - Serro Hotelaria',
            message=(
                f'Olá {reserva.hospede.first_name},\n\n'
                f'Sua reserva foi cancelada com sucesso.\n\n'
                f'Código: {reserva.codigo}\n'
                f'Hotel: {reserva.hotel.nome}\n'
                f'Categoria: {reserva.categoria.nome}\n\n'
                f'Se precisar de algo, estamos à disposição.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[reserva.hospede.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.warning(f'Falha ao enviar email de cancelamento para {reserva.hospede.email}: {e}')


def enviar_email_checkin_reserva(reserva):
    try:
        send_mail(
            subject=f'Check-in realizado - Reserva {reserva.codigo} - Serro Hotelaria',
            message=(
                f'Olá {reserva.hospede.first_name},\n\n'
                f'Seu check-in foi realizado com sucesso!\n\n'
                f'Código: {reserva.codigo}\n'
                f'Hotel: {reserva.hotel.nome}\n'
                f'Categoria: {reserva.categoria.nome}\n'
                f'Quarto: {reserva.quarto.numero}\n'
                f'Check-in: {reserva.dataEntrada.strftime("%d/%m/%Y")}\n'
                f'Check-out: {reserva.dataSaida.strftime("%d/%m/%Y")}\n\n'
                f'Boa estadia!'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[reserva.hospede.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.warning(f'Falha ao enviar email de check-in para {reserva.hospede.email}: {e}')


def enviar_email_checkout_reserva(reserva):
    try:
        send_mail(
            subject=f'Check-out realizado - Reserva {reserva.codigo} - Serro Hotelaria',
            message=(
                f'Olá {reserva.hospede.first_name},\n\n'
                f'Seu check-out foi realizado com sucesso!\n\n'
                f'Código: {reserva.codigo}\n'
                f'Hotel: {reserva.hotel.nome}\n'
                f'Categoria: {reserva.categoria.nome}\n'
                f'Quarto: {reserva.quarto.numero}\n'
                f'Check-in: {reserva.dataEntrada.strftime("%d/%m/%Y")}\n'
                f'Check-out: {reserva.dataSaida.strftime("%d/%m/%Y")}\n'
                f'Valor Total: R$ {reserva.valorTotal:.2f}\n\n'
                f'Obrigado pela preferência! Volte sempre.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[reserva.hospede.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.warning(f'Falha ao enviar email de check-out para {reserva.hospede.email}: {e}')
