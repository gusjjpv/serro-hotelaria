from django.test import TestCase
from django.contrib.admin.sites import AdminSite
from django.db import IntegrityError
from django.utils import timezone

from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from controleDeAcesso.models import Endereco, Usuario
from .models import Hotel, CategoriaQuarto, Quarto, StatusQuarto
from .admin import HotelAdmin, CategoriaQuartoAdmin, QuartoAdmin
from .serializers import HotelSerializer, CategoriaQuartoSerializer, QuartoSerializer


class EnderecoFactory:
    @staticmethod
    def create(**kwargs):
        defaults = {
            'rua': 'Rua Teste',
            'numero': '123',
            'complemento': '',
            'bairro': 'Centro',
            'cidade': 'Fortaleza',
            'estado': 'CE',
            'cep': '60000000',
        }
        defaults.update(kwargs)
        return Endereco.objects.create(**defaults)


class HotelFactory:
    @staticmethod
    def create(gestor=None, endereco=None, **kwargs):
        if gestor is None:
            gestor = UsuarioFactory.create(role='GE')
        if endereco is None:
            endereco = EnderecoFactory.create()
        defaults = {
            'nome': 'Hotel Teste',
            'cnpj': '12345678000190',
            'endereco': endereco,
            'telefoneContato': '(85) 3000-0000',
            'emailContato': 'contato@hotelteste.com',
            'gestor': gestor,
        }
        defaults.update(kwargs)
        return Hotel.objects.create(**defaults)


class UsuarioFactory:
    _counter = 0

    @staticmethod
    def create(**kwargs):
        UsuarioFactory._counter += 1
        defaults = {
            'username': f'user{UsuarioFactory._counter}',
            'telefone': f'859{UsuarioFactory._counter:07d}',
            'dataNascimento': '1990-01-01',
            'genero': 'M',
            'endereco': EnderecoFactory.create(),
            'cpf': f'{UsuarioFactory._counter:011d}',
            'role': 'HO',
            'email': f'user{UsuarioFactory._counter}@test.com',
            'password': 'testpass123',
        }
        defaults.update(kwargs)
        return Usuario.objects.create_user(**defaults)


class CategoriaQuartoFactory:
    @staticmethod
    def create(hotel=None, **kwargs):
        if hotel is None:
            hotel = HotelFactory.create()
        defaults = {
            'hotel': hotel,
            'nome': 'Standard',
            'descricao': 'Quarto padrão',
            'capacidade': 2,
        }
        defaults.update(kwargs)
        return CategoriaQuarto.objects.create(**defaults)


class QuartoFactory:
    @staticmethod
    def create(hotel=None, categoria=None, **kwargs):
        if hotel is None:
            hotel = HotelFactory.create()
        if categoria is None:
            categoria = CategoriaQuartoFactory.create(hotel=hotel)
        defaults = {
            'hotel': hotel,
            'numero': '101',
            'andar': 1,
            'categoria': categoria,
            'status': StatusQuarto.DISPONIVEL,
        }
        defaults.update(kwargs)
        return Quarto.objects.create(**defaults)


# ─────────────────────────────────────────
# Model Tests
# ─────────────────────────────────────────

class HotelModelTest(TestCase):
    def setUp(self):
        self.hotel = HotelFactory.create()

    def test_str(self):
        self.assertEqual(str(self.hotel), f'{self.hotel.nome} - {self.hotel.cnpj}')

    def test_cnpj_unique(self):
        with self.assertRaises(IntegrityError):
            HotelFactory.create(cnpj=self.hotel.cnpj)

    def test_gestor_one_to_one(self):
        gestor = self.hotel.gestor
        with self.assertRaises(IntegrityError):
            HotelFactory.create(gestor=gestor, cnpj='99999999000199')

    def test_data_criacao_auto(self):
        self.assertIsNotNone(self.hotel.dataCriacao)

    def test_data_atualizacao_auto(self):
        self.assertIsNotNone(self.hotel.dataAtualizacao)


class CategoriaQuartoModelTest(TestCase):
    def setUp(self):
        self.hotel = HotelFactory.create()
        self.categoria = CategoriaQuartoFactory.create(hotel=self.hotel)

    def test_str(self):
        self.assertIn(self.categoria.nome, str(self.categoria))
        self.assertIn('2 pessoa', str(self.categoria))

    def test_str_singular(self):
        cat = CategoriaQuartoFactory.create(hotel=self.hotel, nome='Single', capacidade=1)
        self.assertIn('1 pessoa', str(cat))

    def test_unique_together_hotel_nome(self):
        with self.assertRaises(IntegrityError):
            CategoriaQuartoFactory.create(hotel=self.hotel, nome=self.categoria.nome)

    def test_capacidade_positive(self):
        self.assertGreater(self.categoria.capacidade, 0)


class QuartoModelTest(TestCase):
    def setUp(self):
        self.hotel = HotelFactory.create()
        self.categoria = CategoriaQuartoFactory.create(hotel=self.hotel)
        self.quarto = QuartoFactory.create(hotel=self.hotel, categoria=self.categoria)

    def test_str(self):
        result = str(self.quarto)
        self.assertIn(self.quarto.numero, result)
        self.assertIn('Disponível', result)

    def test_status_default_disponivel(self):
        self.assertEqual(self.quarto.status, StatusQuarto.DISPONIVEL)

    def test_unique_together_hotel_numero(self):
        with self.assertRaises(IntegrityError):
            QuartoFactory.create(
                hotel=self.hotel,
                categoria=self.categoria,
                numero=self.quarto.numero,
            )

    def test_status_choices(self):
        for status_val in StatusQuarto.values:
            self.quarto.status = status_val
            self.quarto.save()
            self.quarto.refresh_from_db()
            self.assertEqual(self.quarto.status, status_val)


class StatusQuartoEnumTest(TestCase):
    def test_values(self):
        self.assertEqual(StatusQuarto.DISPONIVEL, 'DISP')
        self.assertEqual(StatusQuarto.OCUPADO, 'OCUP')
        self.assertEqual(StatusQuarto.LIMPEZA, 'LIMP')
        self.assertEqual(StatusQuarto.MANUTENCAO, 'MANU')

    def test_labels(self):
        self.assertEqual(StatusQuarto('DISP').label, 'Disponível')
        self.assertEqual(StatusQuarto('OCUP').label, 'Ocupado')
        self.assertEqual(StatusQuarto('LIMP').label, 'Em Limpeza')
        self.assertEqual(StatusQuarto('MANU').label, 'Em Manutenção')


# ─────────────────────────────────────────
# Admin Tests
# ─────────────────────────────────────────

class AdminRegistrationTest(TestCase):
    def setUp(self):
        self.site = AdminSite()

    def test_hotel_admin_registered(self):
        admin = HotelAdmin(Hotel, self.site)
        self.assertIn('nome', admin.list_display)
        self.assertIn('cnpj', admin.list_display)

    def test_categoria_admin_registered(self):
        admin = CategoriaQuartoAdmin(CategoriaQuarto, self.site)
        self.assertIn('nome', admin.list_display)
        self.assertIn('hotel', admin.list_display)
        self.assertIn('capacidade', admin.list_display)

    def test_quarto_admin_registered(self):
        admin = QuartoAdmin(Quarto, self.site)
        self.assertIn('numero', admin.list_display)
        self.assertIn('hotel', admin.list_display)
        self.assertIn('status', admin.list_display)
        self.assertIn('status', admin.list_editable)


# ─────────────────────────────────────────
# Serializer Tests
# ─────────────────────────────────────────

class CategoriaQuartoSerializerTest(TestCase):
    def setUp(self):
        self.hotel = HotelFactory.create()
        self.categoria = CategoriaQuartoFactory.create(hotel=self.hotel)

    def test_serialization(self):
        serializer = CategoriaQuartoSerializer(self.categoria)
        data = serializer.data
        self.assertEqual(data['nome'], self.categoria.nome)
        self.assertEqual(data['capacidade'], self.categoria.capacidade)
        self.assertIn('id', data)
        self.assertIn('dataCriacao', data)

    def test_deserialization(self):
        data = {
            'hotel': self.hotel.pk,
            'nome': 'Luxo',
            'descricao': 'Quarto de luxo',
            'capacidade': 3,
        }
        serializer = CategoriaQuartoSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class QuartoSerializerTest(TestCase):
    def setUp(self):
        self.hotel = HotelFactory.create()
        self.categoria = CategoriaQuartoFactory.create(hotel=self.hotel)
        self.quarto = QuartoFactory.create(hotel=self.hotel, categoria=self.categoria)

    def test_serialization(self):
        serializer = QuartoSerializer(self.quarto)
        data = serializer.data
        self.assertEqual(data['numero'], self.quarto.numero)
        self.assertEqual(data['status'], StatusQuarto.DISPONIVEL)
        self.assertIn('status_display', data)

    def test_status_display(self):
        serializer = QuartoSerializer(self.quarto)
        self.assertEqual(serializer.data['status_display'], 'Disponível')

    def test_deserialization(self):
        data = {
            'hotel': self.hotel.pk,
            'numero': '201',
            'andar': 2,
            'categoria': self.categoria.pk,
            'status': StatusQuarto.DISPONIVEL,
        }
        serializer = QuartoSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


# ─────────────────────────────────────────
# View Tests (API)
# ─────────────────────────────────────────

class BaseAPITest(APITestCase):
    def setUp(self):
        self.gestor = UsuarioFactory.create(role='GE', username='gestor1', cpf='11111111111', telefone='85911111111')
        self.supervisor = UsuarioFactory.create(role='SV', username='supervisor1', cpf='22222222222', telefone='85922222222')
        self.atendente = UsuarioFactory.create(role='AT', username='atendente1', cpf='33333333333', telefone='85933333333')
        self.hospede = UsuarioFactory.create(role='HO', username='hospede1', cpf='44444444444', telefone='85944444444')

        self.hotel = HotelFactory.create(gestor=self.gestor)
        self.categoria = CategoriaQuartoFactory.create(hotel=self.hotel, nome='Standard', capacidade=2)
        self.quarto = QuartoFactory.create(hotel=self.hotel, categoria=self.categoria, numero='101')

        self.gestor_token = str(RefreshToken.for_user(self.gestor).access_token)

        self.supervisor.hotel = self.hotel
        self.supervisor.save()
        self.supervisor_token = str(RefreshToken.for_user(self.supervisor).access_token)
        self.atendente_token = str(RefreshToken.for_user(self.atendente).access_token)
        self.hospede_token = str(RefreshToken.for_user(self.hospede).access_token)

    def auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


class CategoriaQuartoAPITest(BaseAPITest):
    def test_list_categorias_gestor(self):
        self.auth(self.gestor_token)
        response = self.client.get('/api/categorias/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_categorias_supervisor(self):
        self.auth(self.supervisor_token)
        response = self.client.get('/api/categorias/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_categorias_atendente_forbidden(self):
        self.auth(self.atendente_token)
        response = self.client.get('/api/categorias/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_categorias_hospede_forbidden(self):
        self.auth(self.hospede_token)
        response = self.client.get('/api/categorias/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_categorias_unauthenticated(self):
        response = self.client.get('/api/categorias/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_categoria_gestor(self):
        self.auth(self.gestor_token)
        data = {'nome': 'Luxo', 'descricao': 'Quarto luxo', 'capacidade': 4}
        response = self.client.post('/api/categorias/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nome'], 'Luxo')

    def test_create_categoria_supervisor(self):
        self.auth(self.supervisor_token)
        data = {'nome': 'Premium', 'descricao': 'Premium', 'capacidade': 3}
        response = self.client.post('/api/categorias/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_categoria(self):
        self.auth(self.gestor_token)
        data = {'nome': 'Standard Plus', 'descricao': 'Atualizado', 'capacidade': 3}
        response = self.client.put(f'/api/categorias/{self.categoria.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.categoria.refresh_from_db()
        self.assertEqual(self.categoria.nome, 'Standard Plus')

    def test_delete_categoria(self):
        self.auth(self.gestor_token)
        self.quarto.delete()
        response = self.client.delete(f'/api/categorias/{self.categoria.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CategoriaQuarto.objects.filter(pk=self.categoria.pk).exists())

    def test_delete_categoria_with_quartos_fails(self):
        self.auth(self.gestor_token)
        from django.db.models.deletion import ProtectedError
        with self.assertRaises(ProtectedError):
            self.categoria.delete()
        self.assertTrue(CategoriaQuarto.objects.filter(pk=self.categoria.pk).exists())

    def test_create_categoria_auto_assigns_hotel(self):
        self.auth(self.gestor_token)
        data = {'nome': 'Suite', 'descricao': 'Suite', 'capacidade': 2}
        response = self.client.post('/api/categorias/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        categoria = CategoriaQuarto.objects.get(pk=response.data['id'])
        self.assertEqual(categoria.hotel, self.hotel)


class QuartoAPITest(BaseAPITest):
    def test_list_quartos(self):
        self.auth(self.gestor_token)
        response = self.client.get('/api/quartos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_quarto(self):
        self.auth(self.gestor_token)
        data = {
            'numero': '201',
            'andar': 2,
            'categoria': self.categoria.pk,
            'status': StatusQuarto.DISPONIVEL,
        }
        response = self.client.post('/api/quartos/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['numero'], '201')

    def test_create_quarto_default_status(self):
        self.auth(self.gestor_token)
        data = {'numero': '301', 'andar': 3, 'categoria': self.categoria.pk}
        response = self.client.post('/api/quartos/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], StatusQuarto.DISPONIVEL)

    def test_update_quarto_status(self):
        self.auth(self.gestor_token)
        data = {'status': StatusQuarto.OCUPADO}
        response = self.client.patch(f'/api/quartos/{self.quarto.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quarto.refresh_from_db()
        self.assertEqual(self.quarto.status, StatusQuarto.OCUPADO)

    def test_delete_quarto(self):
        self.auth(self.gestor_token)
        response = self.client.delete(f'/api/quartos/{self.quarto.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_quarto_disponivel_list(self):
        self.auth(self.gestor_token)
        response = self.client.get('/api/quartos/disponiveis/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_quarto_disponivel_excludes_ocupado(self):
        self.quarto.status = StatusQuarto.OCUPADO
        self.quarto.save()
        self.auth(self.gestor_token)
        response = self.client.get('/api/quartos/disponiveis/')
        self.assertEqual(len(response.data), 0)


class QuartoDisponivelAPITest(BaseAPITest):
    def test_quartos_disponiveis_any_authenticated(self):
        self.auth(self.hospede_token)
        response = self.client.get('/api/quartos/disponiveis/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_quartos_disponiveis_unauthenticated(self):
        response = self.client.get('/api/quartos/disponiveis/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class QuartoStatusUpdateTest(BaseAPITest):
    def setUp(self):
        super().setUp()
        self.atendente.hotel = self.hotel
        self.atendente.save()
        self.url = f'/api/quartos/{self.quarto.pk}/status/'

    def test_atendente_disp_to_ocup(self):
        self.auth(self.atendente_token)
        response = self.client.patch(self.url, {'status': 'OCUP'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quarto.refresh_from_db()
        self.assertEqual(self.quarto.status, StatusQuarto.OCUPADO)

    def test_atendente_disp_to_limp(self):
        self.auth(self.atendente_token)
        response = self.client.patch(self.url, {'status': 'LIMP'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quarto.refresh_from_db()
        self.assertEqual(self.quarto.status, StatusQuarto.LIMPEZA)

    def test_atendente_limp_to_disp(self):
        self.quarto.status = StatusQuarto.LIMPEZA
        self.quarto.save()
        self.auth(self.atendente_token)
        response = self.client.patch(self.url, {'status': 'DISP'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quarto.refresh_from_db()
        self.assertEqual(self.quarto.status, StatusQuarto.DISPONIVEL)

    def test_atendente_disp_to_manu_denied(self):
        self.auth(self.atendente_token)
        response = self.client.patch(self.url, {'status': 'MANU'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_atendente_ocup_to_anything_denied(self):
        self.quarto.status = StatusQuarto.OCUPADO
        self.quarto.save()
        self.auth(self.atendente_token)
        for target in ['DISP', 'LIMP', 'MANU']:
            response = self.client.patch(self.url, {'status': target}, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_atendente_manu_to_anything_denied(self):
        self.quarto.status = StatusQuarto.MANUTENCAO
        self.quarto.save()
        self.auth(self.atendente_token)
        for target in ['DISP', 'LIMP', 'OCUP']:
            response = self.client.patch(self.url, {'status': target}, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_supervisor_disp_to_manu(self):
        self.auth(self.supervisor_token)
        response = self.client.patch(self.url, {'status': 'MANU'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quarto.refresh_from_db()
        self.assertEqual(self.quarto.status, StatusQuarto.MANUTENCAO)

    def test_supervisor_ocup_to_limp(self):
        self.quarto.status = StatusQuarto.OCUPADO
        self.quarto.save()
        self.auth(self.supervisor_token)
        response = self.client.patch(self.url, {'status': 'LIMP'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quarto.refresh_from_db()
        self.assertEqual(self.quarto.status, StatusQuarto.LIMPEZA)

    def test_supervisor_manu_to_disp(self):
        self.quarto.status = StatusQuarto.MANUTENCAO
        self.quarto.save()
        self.auth(self.supervisor_token)
        response = self.client.patch(self.url, {'status': 'DISP'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quarto.refresh_from_db()
        self.assertEqual(self.quarto.status, StatusQuarto.DISPONIVEL)

    def test_gestor_disp_to_manu(self):
        self.auth(self.gestor_token)
        response = self.client.patch(self.url, {'status': 'MANU'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quarto.refresh_from_db()
        self.assertEqual(self.quarto.status, StatusQuarto.MANUTENCAO)

    def test_status_change_records_audit(self):
        self.auth(self.atendente_token)
        response = self.client.patch(self.url, {'status': 'OCUP'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quarto.refresh_from_db()
        self.assertIsNotNone(self.quarto.status_changed_at)
        self.assertEqual(self.quarto.status_changed_by, self.atendente)

    def test_unauthenticated_denied(self):
        response = self.client.patch(self.url, {'status': 'OCUP'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_status_value(self):
        self.auth(self.atendente_token)
        response = self.client.patch(self.url, {'status': 'XXXX'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────
# Reserva Tests
# ─────────────────────────────────────────

from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch
from .models import Reserva, StatusReserva
from tarifasManutencao.models import Tarifa, TipoTemporada


class ReservaFactory:
    @staticmethod
    def create(hotel=None, categoria=None, quarto=None, hospede=None, **kwargs):
        if hotel is None:
            hotel = HotelFactory.create()
        if categoria is None:
            categoria = CategoriaQuartoFactory.create(hotel=hotel)
        if quarto is None:
            quarto = QuartoFactory.create(hotel=hotel, categoria=categoria)
        if hospede is None:
            hospede = UsuarioFactory.create(role='HO')
        today = date.today()
        defaults = {
            'hotel': hotel,
            'categoria': categoria,
            'quarto': quarto,
            'hospede': hospede,
            'dataEntrada': today + timedelta(days=1),
            'dataSaida': today + timedelta(days=3),
            'numHospedes': 2,
            'valorTotal': 200,
            'status': StatusReserva.PENDENTE,
        }
        defaults.update(kwargs)
        return Reserva.objects.create(**defaults)


class ReservaCreateAPITest(BaseAPITest):
    def setUp(self):
        super().setUp()
        self.url = '/api/reservas/'
        self.hospede.hotel = self.hotel
        self.hospede.save()
        self.hospede_token = str(RefreshToken.for_user(self.hospede).access_token)
        Tarifa.objects.create(
            categoria=self.categoria,
            valorDiaria=Decimal('100.00'),
            dataInicio=date.today() - timedelta(days=30),
            dataFim=date.today() + timedelta(days=365),
            tipoTemporada=TipoTemporada.BAIXA,
        )

    def test_create_reserva_valid(self):
        self.auth(self.hospede_token)
        data = {
            'hotel': self.hotel.pk,
            'categoria': self.categoria.pk,
            'dataEntrada': (date.today() + timedelta(days=10)).isoformat(),
            'dataSaida': (date.today() + timedelta(days=12)).isoformat(),
            'numHospedes': 2,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['codigo'].startswith('RES'))
        self.assertEqual(response.data['status'], 'PEND')
        self.assertIsNotNone(response.data['quarto'])
        self.assertGreater(Decimal(str(response.data['valorTotal'])), 0)

    def test_create_reserva_calculates_valor_total(self):
        self.auth(self.hospede_token)
        data = {
            'hotel': self.hotel.pk,
            'categoria': self.categoria.pk,
            'dataEntrada': (date.today() + timedelta(days=20)).isoformat(),
            'dataSaida': (date.today() + timedelta(days=22)).isoformat(),
            'numHospedes': 2,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(response.data['valorTotal'])), Decimal('200.00'))

    def test_create_reserva_assigns_quarto(self):
        self.auth(self.hospede_token)
        data = {
            'hotel': self.hotel.pk,
            'categoria': self.categoria.pk,
            'dataEntrada': (date.today() + timedelta(days=15)).isoformat(),
            'dataSaida': (date.today() + timedelta(days=17)).isoformat(),
            'numHospedes': 2,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        reserva = Reserva.objects.get(pk=response.data['id'])
        self.assertIsNotNone(reserva.quarto)
        self.assertEqual(reserva.quarto.categoria, self.categoria)

    def test_create_reserva_num_hospedes_exceeds_capacidade(self):
        self.auth(self.hospede_token)
        data = {
            'hotel': self.hotel.pk,
            'categoria': self.categoria.pk,
            'dataEntrada': (date.today() + timedelta(days=10)).isoformat(),
            'dataSaida': (date.today() + timedelta(days=12)).isoformat(),
            'numHospedes': 10,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reserva_no_availability(self):
        self.auth(self.hospede_token)
        ReservaFactory.create(
            hotel=self.hotel, categoria=self.categoria, quarto=self.quarto,
            hospede=self.hospede,
            dataEntrada=date.today() + timedelta(days=5),
            dataSaida=date.today() + timedelta(days=7),
            status=StatusReserva.CONFIRMADA,
        )
        data = {
            'hotel': self.hotel.pk,
            'categoria': self.categoria.pk,
            'dataEntrada': (date.today() + timedelta(days=6)).isoformat(),
            'dataSaida': (date.today() + timedelta(days=8)).isoformat(),
            'numHospedes': 2,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reserva_past_date(self):
        self.auth(self.hospede_token)
        data = {
            'hotel': self.hotel.pk,
            'categoria': self.categoria.pk,
            'dataEntrada': (date.today() - timedelta(days=1)).isoformat(),
            'dataSaida': (date.today() + timedelta(days=1)).isoformat(),
            'numHospedes': 2,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reserva_wrong_hotel_categoria(self):
        other_hotel = HotelFactory.create(cnpj='99999999000199')
        other_cat = CategoriaQuartoFactory.create(hotel=other_hotel)
        self.auth(self.hospede_token)
        data = {
            'hotel': self.hotel.pk,
            'categoria': other_cat.pk,
            'dataEntrada': (date.today() + timedelta(days=10)).isoformat(),
            'dataSaida': (date.today() + timedelta(days=12)).isoformat(),
            'numHospedes': 2,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reserva_unauthenticated(self):
        data = {
            'hotel': self.hotel.pk,
            'categoria': self.categoria.pk,
            'dataEntrada': (date.today() + timedelta(days=10)).isoformat(),
            'dataSaida': (date.today() + timedelta(days=12)).isoformat(),
            'numHospedes': 2,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('hospedagemInfraestrutura.service.send_mail')
    def test_create_reserva_sends_email(self, mock_send_mail):
        self.auth(self.hospede_token)
        data = {
            'hotel': self.hotel.pk,
            'categoria': self.categoria.pk,
            'dataEntrada': (date.today() + timedelta(days=10)).isoformat(),
            'dataSaida': (date.today() + timedelta(days=12)).isoformat(),
            'numHospedes': 2,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mock_send_mail.assert_called_once()
        args = mock_send_mail.call_args
        self.assertIn(response.data['codigo'], args.kwargs.get('message', args[1] if len(args) > 1 else ''))


class ReservaListAPITest(BaseAPITest):
    def setUp(self):
        super().setUp()
        self.url = '/api/reservas/'
        self.hospede.hotel = self.hotel
        self.hospede.save()
        self.hospede_token = str(RefreshToken.for_user(self.hospede).access_token)
        self.reserva = ReservaFactory.create(
            hotel=self.hotel, categoria=self.categoria, quarto=self.quarto,
            hospede=self.hospede,
        )

    def test_list_reservas_hospede(self):
        self.auth(self.hospede_token)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_reservas_gestor(self):
        self.auth(self.gestor_token)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_reservas_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ReservaDetailAPITest(BaseAPITest):
    def setUp(self):
        super().setUp()
        self.hospede.hotel = self.hotel
        self.hospede.save()
        self.hospede_token = str(RefreshToken.for_user(self.hospede).access_token)
        self.reserva = ReservaFactory.create(
            hotel=self.hotel, categoria=self.categoria, quarto=self.quarto,
            hospede=self.hospede,
        )
        self.url = f'/api/reservas/{self.reserva.pk}/'

    def test_detail_own_reserva(self):
        self.auth(self.hospede_token)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['codigo'], self.reserva.codigo)

    def test_detail_other_user_reserva(self):
        other_hospede = UsuarioFactory.create(role='HO', username='other', cpf='55555555555', telefone='85955555555')
        other_token = str(RefreshToken.for_user(other_hospede).access_token)
        self.auth(other_token)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ReservaCancelAPITest(BaseAPITest):
    def setUp(self):
        super().setUp()
        self.hospede.hotel = self.hotel
        self.hospede.save()
        self.hospede_token = str(RefreshToken.for_user(self.hospede).access_token)
        self.reserva = ReservaFactory.create(
            hotel=self.hotel, categoria=self.categoria, quarto=self.quarto,
            hospede=self.hospede,
        )
        self.url = f'/api/reservas/{self.reserva.pk}/cancelar/'

    def test_cancel_reserva_pendente(self):
        self.auth(self.hospede_token)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reserva.refresh_from_db()
        self.assertEqual(self.reserva.status, StatusReserva.CANCELADA)

    def test_cancel_reserva_confirmada(self):
        self.reserva.status = StatusReserva.CONFIRMADA
        self.reserva.save()
        self.auth(self.hospede_token)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reserva.refresh_from_db()
        self.assertEqual(self.reserva.status, StatusReserva.CANCELADA)

    def test_cancel_reserva_check_in_denied(self):
        self.reserva.status = StatusReserva.CHECK_IN
        self.reserva.save()
        self.auth(self.hospede_token)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancel_reserva_finalizada_denied(self):
        self.reserva.status = StatusReserva.FINALIZADA
        self.reserva.save()
        self.auth(self.hospede_token)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancel_reserva_liberar_quarto(self):
        self.reserva.quarto = self.quarto
        self.reserva.save()
        self.quarto.status = StatusQuarto.OCUPADO
        self.quarto.save()
        self.auth(self.hospede_token)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quarto.refresh_from_db()
        self.assertEqual(self.quarto.status, StatusQuarto.DISPONIVEL)

    @patch('hospedagemInfraestrutura.service.send_mail')
    def test_cancel_reserva_sends_email(self, mock_send_mail):
        self.auth(self.hospede_token)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_mail.assert_called_once()
        args = mock_send_mail.call_args
        self.assertIn(self.reserva.codigo, args.kwargs.get('message', args[1] if len(args) > 1 else ''))


class ReservaCheckInAPITest(BaseAPITest):
    def setUp(self):
        super().setUp()
        self.hospede.hotel = self.hotel
        self.hospede.save()
        self.hospede_token = str(RefreshToken.for_user(self.hospede).access_token)
        self.reserva = ReservaFactory.create(
            hotel=self.hotel, categoria=self.categoria, quarto=self.quarto,
            hospede=self.hospede, status=StatusReserva.CONFIRMADA,
            dataEntrada=date.today() + timedelta(days=1),
        )
        self.url = f'/api/reservas/{self.reserva.pk}/check-in/'

    def test_checkin_valid(self):
        self.auth(self.hospede_token)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reserva.refresh_from_db()
        self.assertEqual(self.reserva.status, StatusReserva.CHECK_IN)
        self.quarto.refresh_from_db()
        self.assertEqual(self.quarto.status, StatusQuarto.OCUPADO)

    def test_checkin_not_confirmada_denied(self):
        self.reserva.status = StatusReserva.PENDENTE
        self.reserva.save()
        self.auth(self.hospede_token)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkin_check_in_already_denied(self):
        self.reserva.status = StatusReserva.CHECK_IN
        self.reserva.save()
        self.auth(self.hospede_token)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkin_cancelled_denied(self):
        self.reserva.status = StatusReserva.CANCELADA
        self.reserva.save()
        self.auth(self.hospede_token)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkin_too_early_denied(self):
        self.reserva.dataEntrada = date.today() + timedelta(days=3)
        self.reserva.save()
        self.auth(self.hospede_token)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkin_unauthenticated(self):
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_checkin_other_user_denied(self):
        other_hospede = UsuarioFactory.create(role='HO', username='other', cpf='55555555555', telefone='85955555555')
        other_token = str(RefreshToken.for_user(other_hospede).access_token)
        self.auth(other_token)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch('hospedagemInfraestrutura.service.send_mail')
    def test_checkin_sends_email(self, mock_send_mail):
        self.auth(self.hospede_token)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_mail.assert_called_once()
        args = mock_send_mail.call_args
        self.assertIn(self.reserva.codigo, args.kwargs.get('message', args[1] if len(args) > 1 else ''))

    def test_checkin_no_quarto_denied(self):
        self.reserva.quarto = None
        self.reserva.save()
        self.auth(self.hospede_token)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
