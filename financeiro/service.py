import logging
from decimal import Decimal

from django.utils.timezone import now

from .models import Conta, Despesa, StatusConta

logger = logging.getLogger(__name__)


def criar_conta(reserva):
    if hasattr(reserva, 'conta'):
        return reserva.conta
    nome = f'{reserva.hospede.first_name} {reserva.hospede.last_name}'.strip()
    if not nome:
        nome = reserva.hospede.username
    conta = Conta.objects.create(
        reserva=reserva,
        nomeTitular=nome,
        cpfTitular=reserva.hospede.cpf,
        totalAcumulado=Decimal('0.00'),
        status=StatusConta.ABERTA,
    )
    return conta


def adicionar_despesa(conta, descricao, valor, categoria, produto=None):
    if conta.status != StatusConta.ABERTA:
        raise ValueError('Somente contas ABERTAS podem receber despesas.')
    despesa = Despesa.objects.create(
        conta=conta,
        descricao=descricao,
        valor=valor,
        categoria=categoria,
        produto=produto,
    )
    conta.totalAcumulado += valor
    conta.save(update_fields=['totalAcumulado', 'dataAtualizacao'])
    return despesa


def fechar_conta(reserva):
    conta = getattr(reserva, 'conta', None)
    if not conta or conta.status != StatusConta.ABERTA:
        return conta
    conta.status = StatusConta.FECHADA
    conta.dataFechamento = now()
    conta.save(update_fields=['status', 'dataFechamento', 'dataAtualizacao'])
    return conta


def obter_extrato(conta):
    return conta.despesas.select_related('produto').order_by('dataHora')
