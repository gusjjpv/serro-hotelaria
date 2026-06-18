from datetime import date, timedelta

from django.test import TestCase
from django.contrib.admin.sites import AdminSite
from django.core.exceptions import ValidationError

from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from controleDeAcesso.models import Endereco, Usuario
from hospedagemInfraestrutura.models import Hotel, CategoriaQuarto
from .models import Tarifa, TipoTemporada
from .admin import TarifaAdmin
from .serializers import TarifaSerializer


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


class CategoriaQuartoFactory:
    @staticmethod
    def create(hotel=None, **kwargs):
        if hotel is None:
            hotel = HotelFactory.create()
        defaults = {
            'hotel': hotel,
            'nome': 'Standard',
            'descricao': 'Quarto padrao',
            'capacidade': 2,
            'precoBase': 150.00,
        }
        defaults.update(kwargs)
        return CategoriaQuarto.objects.create(**defaults)


class TarifaFactory:
    @staticmethod
    def create(categoria=None, **kwargs):
        if categoria is None:
            categoria = CategoriaQuartoFactory.create()
        defaults = {
            'categoria': categoria,
            'valorDiaria': 200.00,
            'dataInicio': date(2026, 7, 1),
            'dataFim': date(2026, 7, 31),
            'tipoTemporada': TipoTemporada.ALTA,
        }
        defaults.update(kwargs)
        return Tarifa.objects.create(**defaults)


# ----------------------------------------
# Model Tests
# ----------------------------------------

class TarifaModelTest(TestCase):
    def setUp(self):
        self.categoria = CategoriaQuartoFactory.create()
        self.tarifa = TarifaFactory.create(categoria=self.categoria)

    def test_str(self):
        result = str(self.tarifa)
        self.assertIn('Standard', result)
        self.assertIn('Alta Temporada', result)
        self.assertIn('200', result)

    def test_esta_vigente_true(self):
        data = date(2026, 7, 15)
        self.assertTrue(self.tarifa.estaVigente(data))

    def test_esta_vigente_false(self):
        data = date(2026, 8, 15)
        self.assertFalse(self.tarifa.estaVigente(data))

    def test_esta_vigente_boundary_start(self):
        self.assertTrue(self.tarifa.estaVigente(date(2026, 7, 1)))

    def test_esta_vigente_boundary_end(self):
        self.assertTrue(self.tarifa.estaVigente(date(2026, 7, 31)))

    def test_data_fim_before_data_inicio_raises(self):
        with self.assertRaises(ValidationError):
            TarifaFactory.create(
                categoria=self.categoria,
                dataInicio=date(2026, 8, 1),
                dataFim=date(2026, 7, 1),
            )

    def test_tipo_temporada_choices(self):
        self.assertEqual(TipoTemporada.ALTA, 'ALTA')
        self.assertEqual(TipoTemporada.BAIXA, 'BAIXA')


class TarifaOverlapTest(TestCase):
    def setUp(self):
        self.categoria = CategoriaQuartoFactory.create()

    def test_overlapping_periods_rejected(self):
        TarifaFactory.create(
            categoria=self.categoria,
            dataInicio=date(2026, 7, 1),
            dataFim=date(2026, 7, 31),
        )
        with self.assertRaises(ValidationError):
            TarifaFactory.create(
                categoria=self.categoria,
                dataInicio=date(2026, 7, 15),
                dataFim=date(2026, 8, 15),
            )

    def test_non_overlapping_periods_allowed(self):
        TarifaFactory.create(
            categoria=self.categoria,
            dataInicio=date(2026, 7, 1),
            dataFim=date(2026, 7, 31),
        )
        tarifa2 = TarifaFactory.create(
            categoria=self.categoria,
            dataInicio=date(2026, 8, 1),
            dataFim=date(2026, 8, 31),
            tipoTemporada=TipoTemporada.BAIXA,
        )
        self.assertIsNotNone(tarifa2.pk)


# ----------------------------------------
# Admin Tests
# ----------------------------------------

class TarifaAdminTest(TestCase):
    def test_admin_registered(self):
        site = AdminSite()
        admin = TarifaAdmin(Tarifa, site)
        self.assertIn('categoria', admin.list_display)
        self.assertIn('tipoTemporada', admin.list_display)
        self.assertIn('valorDiaria', admin.list_display)


# ----------------------------------------
# Serializer Tests
# ----------------------------------------

class TarifaSerializerTest(TestCase):
    def setUp(self):
        self.categoria = CategoriaQuartoFactory.create()
        self.tarifa = TarifaFactory.create(categoria=self.categoria)

    def test_serialization(self):
        serializer = TarifaSerializer(self.tarifa)
        data = serializer.data
        self.assertEqual(data['valorDiaria'], '200.00')
        self.assertEqual(data['tipoTemporada'], 'ALTA')
        self.assertIn('tipoTemporada_display', data)
        self.assertIn('id', data)

    def test_deserialization(self):
        data = {
            'categoria': self.categoria.pk,
            'valorDiaria': '180.00',
            'dataInicio': '2026-09-01',
            'dataFim': '2026-09-30',
            'tipoTemporada': 'BAIXA',
        }
        serializer = TarifaSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_period(self):
        data = {
            'categoria': self.categoria.pk,
            'valorDiaria': '180.00',
            'dataInicio': '2026-09-30',
            'dataFim': '2026-09-01',
            'tipoTemporada': 'BAIXA',
        }
        serializer = TarifaSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_overlapping_period_invalid(self):
        data = {
            'categoria': self.categoria.pk,
            'valorDiaria': '180.00',
            'dataInicio': '2026-07-15',
            'dataFim': '2026-08-15',
            'tipoTemporada': 'BAIXA',
        }
        serializer = TarifaSerializer(data=data)
        self.assertFalse(serializer.is_valid())


# ----------------------------------------
# API Tests
# ----------------------------------------

class BaseAPITest(APITestCase):
    def setUp(self):
        self.gestor = UsuarioFactory.create(role='GE', username='gestor1', cpf='11111111111', telefone='85911111111')
        self.supervisor = UsuarioFactory.create(role='SV', username='supervisor1', cpf='22222222222', telefone='85922222222')
        self.atendente = UsuarioFactory.create(role='AT', username='atendente1', cpf='33333333333', telefone='85933333333')
        self.hospede = UsuarioFactory.create(role='HO', username='hospede1', cpf='44444444444', telefone='85944444444')

        self.hotel = HotelFactory.create(gestor=self.gestor)
        self.categoria = CategoriaQuartoFactory.create(hotel=self.hotel, nome='Standard', capacidade=2)
        self.supervisor.hotel = self.hotel
        self.supervisor.save()

        self.gestor_token = str(RefreshToken.for_user(self.gestor).access_token)
        self.supervisor_token = str(RefreshToken.for_user(self.supervisor).access_token)
        self.atendente_token = str(RefreshToken.for_user(self.atendente).access_token)
        self.hospede_token = str(RefreshToken.for_user(self.hospede).access_token)

    def auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


class TarifaAPITest(BaseAPITest):
    def test_list_tarifas_gestor(self):
        TarifaFactory.create(categoria=self.categoria)
        self.auth(self.gestor_token)
        response = self.client.get('/api/tarifas/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_tarifas_supervisor_forbidden(self):
        self.auth(self.supervisor_token)
        response = self.client.get('/api/tarifas/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_tarifas_atendente_forbidden(self):
        self.auth(self.atendente_token)
        response = self.client.get('/api/tarifas/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_tarifas_hospede_forbidden(self):
        self.auth(self.hospede_token)
        response = self.client.get('/api/tarifas/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_tarifas_unauthenticated(self):
        response = self.client.get('/api/tarifas/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_tarifa_gestor(self):
        self.auth(self.gestor_token)
        data = {
            'categoria': self.categoria.pk,
            'valorDiaria': '250.00',
            'dataInicio': '2026-12-01',
            'dataFim': '2026-12-31',
            'tipoTemporada': 'ALTA',
        }
        response = self.client.post('/api/tarifas/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tipoTemporada'], 'ALTA')

    def test_create_tarifa_supervisor_forbidden(self):
        self.auth(self.supervisor_token)
        data = {
            'categoria': self.categoria.pk,
            'valorDiaria': '250.00',
            'dataInicio': '2026-12-01',
            'dataFim': '2026-12-31',
            'tipoTemporada': 'ALTA',
        }
        response = self.client.post('/api/tarifas/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_tarifa_overlap_rejected(self):
        self.auth(self.gestor_token)
        TarifaFactory.create(
            categoria=self.categoria,
            dataInicio=date(2026, 7, 1),
            dataFim=date(2026, 7, 31),
        )
        data = {
            'categoria': self.categoria.pk,
            'valorDiaria': '180.00',
            'dataInicio': '2026-07-15',
            'dataFim': '2026-08-15',
            'tipoTemporada': 'BAIXA',
        }
        response = self.client.post('/api/tarifas/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_tarifa_invalid_period(self):
        self.auth(self.gestor_token)
        data = {
            'categoria': self.categoria.pk,
            'valorDiaria': '180.00',
            'dataInicio': '2026-09-30',
            'dataFim': '2026-09-01',
            'tipoTemporada': 'BAIXA',
        }
        response = self.client.post('/api/tarifas/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_tarifa(self):
        self.auth(self.gestor_token)
        tarifa = TarifaFactory.create(categoria=self.categoria)
        data = {'valorDiaria': '300.00'}
        response = self.client.patch(f'/api/tarifas/{tarifa.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tarifa.refresh_from_db()
        self.assertEqual(tarifa.valorDiaria, 300.00)

    def test_delete_tarifa(self):
        self.auth(self.gestor_token)
        tarifa = TarifaFactory.create(categoria=self.categoria)
        response = self.client.delete(f'/api/tarifas/{tarifa.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Tarifa.objects.filter(pk=tarifa.pk).exists())

    def test_gestor_only_sees_own_hotel_tarifas(self):
        gestor2 = UsuarioFactory.create(role='GE', username='gestor2', cpf='55555555555', telefone='85955555555')
        hotel2 = HotelFactory.create(gestor=gestor2, cnpj='98765432000199')
        cat2 = CategoriaQuartoFactory.create(hotel=hotel2, nome='Luxo')
        TarifaFactory.create(categoria=cat2)

        self.auth(self.gestor_token)
        response = self.client.get('/api/tarifas/')
        self.assertEqual(len(response.data), 0)
