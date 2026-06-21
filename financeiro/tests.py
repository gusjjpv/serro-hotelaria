from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from controleDeAcesso.models import Usuario
from hospedagemInfraestrutura.models import (
    Hotel, CategoriaQuarto, Quarto, Reserva, StatusQuarto, StatusReserva,
)
from .models import Conta, Despesa, Produto, StatusConta, CategoriaDespesa
from .service import criar_conta, adicionar_despesa, fechar_conta, obter_extrato


class BaseFinanceiroTest(APITestCase):
    def setUp(self):
        from controleDeAcesso.tests import UsuarioFactory
        from hospedagemInfraestrutura.tests import HotelFactory, CategoriaQuartoFactory, QuartoFactory

        self.gestor = UsuarioFactory.create(role='GE', username='gestor_fin', cpf='11111111111', telefone='85911111111')
        self.atendente = UsuarioFactory.create(role='AT', username='atendente_fin', cpf='33333333333', telefone='85933333333')
        self.hospede = UsuarioFactory.create(role='HO', username='hospede_fin', cpf='44444444444', telefone='85944444444')

        self.hotel = HotelFactory.create(gestor=self.gestor)
        self.categoria = CategoriaQuartoFactory.create(hotel=self.hotel, nome='Standard', capacidade=2)
        self.quarto = QuartoFactory.create(hotel=self.hotel, categoria=self.categoria, numero='201')

        self.hospede.hotel = self.hotel
        self.hospede.save()
        self.atendente.hotel = self.hotel
        self.atendente.save()

        self.gestor_token = str(RefreshToken.for_user(self.gestor).access_token)
        self.atendente_token = str(RefreshToken.for_user(self.atendente).access_token)
        self.hospede_token = str(RefreshToken.for_user(self.hospede).access_token)

        self.reserva = Reserva.objects.create(
            hotel=self.hotel,
            categoria=self.categoria,
            quarto=self.quarto,
            hospede=self.hospede,
            dataEntrada=date.today() + timedelta(days=1),
            dataSaida=date.today() + timedelta(days=3),
            numHospedes=2,
            valorTotal=Decimal('200.00'),
            status=StatusReserva.CHECK_IN,
        )
        self.quarto.status = StatusQuarto.OCUPADO
        self.quarto.save()

        self.produto = Produto.objects.create(
            nome='Água Mineral',
            descricao='Garrafa 500ml',
            categoria=CategoriaDespesa.FRIGOBAR,
            precoAtual=Decimal('5.00'),
        )

    def auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


# ─────────────────────────────────────────
# Service Tests
# ─────────────────────────────────────────

class ContaServiceTest(BaseFinanceiroTest):
    def test_criar_conta(self):
        conta = criar_conta(self.reserva)
        self.assertIsNotNone(conta)
        self.assertEqual(conta.status, StatusConta.ABERTA)
        expected_nome = f'{self.hospede.first_name} {self.hospede.last_name}'.strip() or self.hospede.username
        self.assertEqual(conta.nomeTitular, expected_nome)
        self.assertEqual(Decimal('0.00'), conta.totalAcumulado)

    def test_criar_conta_idempotente(self):
        conta1 = criar_conta(self.reserva)
        conta2 = criar_conta(self.reserva)
        self.assertEqual(conta1.pk, conta2.pk)
        self.assertEqual(Conta.objects.filter(reserva=self.reserva).count(), 1)

    def test_adicionar_despesa(self):
        conta = criar_conta(self.reserva)
        despesa = adicionar_despesa(conta, 'Água', Decimal('5.00'), CategoriaDespesa.FRIGOBAR)
        self.assertIsNotNone(despesa)
        self.assertEqual(despesa.valor, Decimal('5.00'))
        conta.refresh_from_db()
        self.assertEqual(conta.totalAcumulado, Decimal('5.00'))

    def test_adicionar_despesa_com_produto(self):
        conta = criar_conta(self.reserva)
        despesa = adicionar_despesa(
            conta, 'Água', Decimal('5.00'), CategoriaDespesa.FRIGOBAR, self.produto,
        )
        self.assertEqual(despesa.produto, self.produto)

    def test_adicionar_multiplas_despesas(self):
        conta = criar_conta(self.reserva)
        adicionar_despesa(conta, 'Água', Decimal('5.00'), CategoriaDespesa.FRIGOBAR)
        adicionar_despesa(conta, 'Towel', Decimal('10.00'), CategoriaDespesa.SERVICO_QUARTO)
        conta.refresh_from_db()
        self.assertEqual(conta.totalAcumulado, Decimal('15.00'))

    def test_adicionar_despesa_conta_fechada_raises(self):
        conta = criar_conta(self.reserva)
        conta.status = StatusConta.FECHADA
        conta.save()
        with self.assertRaises(ValueError):
            adicionar_despesa(conta, 'Teste', Decimal('5.00'), CategoriaDespesa.OUTROS)

    def test_fechar_conta(self):
        conta = criar_conta(self.reserva)
        result = fechar_conta(self.reserva)
        self.assertEqual(result.status, StatusConta.FECHADA)
        self.assertIsNotNone(result.dataFechamento)

    def test_fechar_conta_sem_conta(self):
        reserva2 = Reserva.objects.create(
            hotel=self.hotel, categoria=self.categoria, quarto=None,
            hospede=self.hospede, dataEntrada=date.today() + timedelta(days=5),
            dataSaida=date.today() + timedelta(days=7), numHospedes=1,
            valorTotal=Decimal('100.00'), status=StatusReserva.CONFIRMADA,
        )
        result = fechar_conta(reserva2)
        self.assertIsNone(result)

    def test_obter_extrato(self):
        conta = criar_conta(self.reserva)
        adicionar_despesa(conta, 'Água', Decimal('5.00'), CategoriaDespesa.FRIGOBAR)
        adicionar_despesa(conta, 'Sabonete', Decimal('3.00'), CategoriaDespesa.OUTROS)
        extrato = obter_extrato(conta)
        self.assertEqual(extrato.count(), 2)


# ─────────────────────────────────────────
# API Tests — Despesa
# ─────────────────────────────────────────

class DespesaAPITest(BaseFinanceiroTest):
    def setUp(self):
        super().setUp()
        self.conta = criar_conta(self.reserva)
        self.url = '/api/despesas/'

    def test_create_despesa_valid(self):
        self.auth(self.atendente_token)
        data = {
            'conta': self.conta.pk,
            'descricao': 'Água Mineral',
            'valor': '5.00',
            'categoria': CategoriaDespesa.FRIGOBAR,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['descricao'], 'Água Mineral')

    def test_create_despesa_com_produto(self):
        self.auth(self.atendente_token)
        data = {
            'conta': self.conta.pk,
            'descricao': 'Água',
            'valor': '5.00',
            'categoria': CategoriaDespesa.FRIGOBAR,
            'produto': self.produto.pk,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(int(response.data['produto']), self.produto.pk)

    def test_create_despesa_conta_fechada_denied(self):
        self.conta.status = StatusConta.FECHADA
        self.conta.save()
        self.auth(self.atendente_token)
        data = {
            'conta': self.conta.pk,
            'descricao': 'Teste',
            'valor': '5.00',
            'categoria': CategoriaDespesa.OUTROS,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_despesa_reserva_nao_checkin_denied(self):
        self.reserva.status = StatusReserva.CONFIRMADA
        self.reserva.save()
        self.auth(self.atendente_token)
        data = {
            'conta': self.conta.pk,
            'descricao': 'Teste',
            'valor': '5.00',
            'categoria': CategoriaDespesa.OUTROS,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_despesa_unauthenticated(self):
        data = {
            'conta': self.conta.pk,
            'descricao': 'Teste',
            'valor': '5.00',
            'categoria': CategoriaDespesa.OUTROS,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_despesa_atualiza_total_conta(self):
        self.auth(self.atendente_token)
        data = {
            'conta': self.conta.pk,
            'descricao': 'Água',
            'valor': '5.00',
            'categoria': CategoriaDespesa.FRIGOBAR,
        }
        self.client.post(self.url, data, format='json')
        self.conta.refresh_from_db()
        self.assertEqual(self.conta.totalAcumulado, Decimal('5.00'))


# ─────────────────────────────────────────
# API Tests — Extrato
# ─────────────────────────────────────────

class ContaExtratoAPITest(BaseFinanceiroTest):
    def setUp(self):
        super().setUp()
        self.conta = criar_conta(self.reserva)
        self.url = f'/api/contas/{self.conta.pk}/extrato/'

    def test_extrato_own_conta(self):
        self.auth(self.hospede_token)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('conta', response.data)
        self.assertIn('despesas', response.data)

    def test_extrato_gestor(self):
        self.auth(self.gestor_token)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_extrato_atendente(self):
        self.auth(self.atendente_token)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_extrato_outro_hospede_denied(self):
        from controleDeAcesso.tests import UsuarioFactory
        other = UsuarioFactory.create(role='HO', username='other_fin', cpf='55555555555', telefone='85955555555')
        other_token = str(RefreshToken.for_user(other).access_token)
        self.auth(other_token)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_extrato_com_despesas(self):
        adicionar_despesa(self.conta, 'Água', Decimal('5.00'), CategoriaDespesa.FRIGOBAR)
        adicionar_despesa(self.conta, 'Towel', Decimal('10.00'), CategoriaDespesa.SERVICO_QUARTO)
        self.auth(self.hospede_token)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['despesas']), 2)


# ─────────────────────────────────────────
# API Tests — Produto
# ─────────────────────────────────────────

class ProdutoAPITest(BaseFinanceiroTest):
    def setUp(self):
        super().setUp()
        self.url = '/api/produtos/'

    def test_list_produtos(self):
        self.auth(self.atendente_token)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_produto(self):
        self.auth(self.gestor_token)
        data = {
            'nome': 'Refrigerante',
            'descricao': 'Lata 350ml',
            'categoria': CategoriaDespesa.FRIGOBAR,
            'precoAtual': '8.00',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nome'], 'Refrigerante')

    def test_update_produto(self):
        self.auth(self.gestor_token)
        url = f'/api/produtos/{self.produto.pk}/'
        data = {'precoAtual': '6.00'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.produto.refresh_from_db()
        self.assertEqual(self.produto.precoAtual, Decimal('6.00'))

    def test_delete_produto_desativa(self):
        self.auth(self.gestor_token)
        url = f'/api/produtos/{self.produto.pk}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.produto.refresh_from_db()
        self.assertFalse(self.produto.ativo)

    def test_create_produto_unauthenticated(self):
        data = {
            'nome': 'Teste',
            'categoria': CategoriaDespesa.OUTROS,
            'precoAtual': '10.00',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────
# Integration Tests — Conta auto-criação/check-out
# ─────────────────────────────────────────

class ContaIntegrationTest(BaseFinanceiroTest):
    def test_conta_criada_no_checkin(self):
        from hospedagemInfraestrutura.tests import QuartoFactory
        q2 = QuartoFactory.create(hotel=self.hotel, categoria=self.categoria, numero='202')
        reserva2 = Reserva.objects.create(
            hotel=self.hotel, categoria=self.categoria, quarto=q2,
            hospede=self.hospede, dataEntrada=date.today() + timedelta(days=5),
            dataSaida=date.today() + timedelta(days=7), numHospedes=1,
            valorTotal=Decimal('100.00'), status=StatusReserva.CONFIRMADA,
        )
        self.auth(self.atendente_token)
        url = f'/api/reservas/{reserva2.pk}/checkin-presencial/'
        response = self.client.patch(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reserva2.refresh_from_db()
        self.assertTrue(hasattr(reserva2, 'conta'))
        self.assertEqual(reserva2.conta.status, StatusConta.ABERTA)

    def test_conta_fechada_no_checkout(self):
        criar_conta(self.reserva)
        self.auth(self.atendente_token)
        url = f'/api/reservas/{self.reserva.pk}/checkout/'
        response = self.client.patch(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reserva.refresh_from_db()
        self.assertEqual(self.reserva.conta.status, StatusConta.FECHADA)
