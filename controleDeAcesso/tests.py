from django.test import TestCase
from django.db import IntegrityError

from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from controleDeAcesso.models import Endereco, Usuario, Atendente
from controleDeAcesso.service import inativar_usuario, reativar_usuario


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
    def create(gestor=None, **kwargs):
        from hospedagemInfraestrutura.models import Hotel
        if gestor is None:
            gestor = UsuarioFactory.create(role='GE')
        defaults = {
            'nome': 'Hotel Teste',
            'cnpj': '12345678000190',
            'endereco': EnderecoFactory.create(),
            'telefoneContato': '(85) 3000-0000',
            'emailContato': 'contato@hotelteste.com',
            'gestor': gestor,
        }
        defaults.update(kwargs)
        return Hotel.objects.create(**defaults)


# ─────────────────────────────────────────
# Service Tests
# ─────────────────────────────────────────

class InativarUsuarioTest(TestCase):
    def setUp(self):
        self.usuario = UsuarioFactory.create()

    def test_inativar_usuario(self):
        self.assertTrue(self.usuario.is_active)
        inativar_usuario(self.usuario)
        self.usuario.refresh_from_db()
        self.assertFalse(self.usuario.is_active)

    def test_reativar_usuario(self):
        self.usuario.is_active = False
        self.usuario.save()
        reativar_usuario(self.usuario)
        self.usuario.refresh_from_db()
        self.assertTrue(self.usuario.is_active)


# ─────────────────────────────────────────
# API Tests
# ─────────────────────────────────────────

class BaseAPITest(APITestCase):
    def setUp(self):
        self.gestor = UsuarioFactory.create(role='GE', username='gestor1', cpf='11111111111', telefone='85911111111')
        self.supervisor = UsuarioFactory.create(role='SV', username='supervisor1', cpf='22222222222', telefone='85922222222')
        self.atendente = Atendente.objects.create(
            username='atendente1',
            cpf='33333333333',
            telefone='85933333333',
            dataNascimento='1990-01-01',
            genero='M',
            endereco=EnderecoFactory.create(),
            role='AT',
            email='atendente1@test.com',
        )
        self.atendente.set_password('testpass123')
        self.atendente.save()
        self.hospede = UsuarioFactory.create(role='HO', username='hospede1', cpf='44444444444', telefone='85944444444')

        self.hotel = HotelFactory.create(gestor=self.gestor)

        self.supervisor.hotel = self.hotel
        self.supervisor.save()
        self.atendente.hotel = self.hotel
        self.atendente.save()

        self.gestor_token = str(RefreshToken.for_user(self.gestor).access_token)
        self.supervisor_token = str(RefreshToken.for_user(self.supervisor).access_token)
        self.atendente_token = str(RefreshToken.for_user(self.atendente).access_token)
        self.hospede_token = str(RefreshToken.for_user(self.hospede).access_token)

    def auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


class FuncionarioListViewTest(BaseAPITest):
    def test_list_funcionarios_gestor(self):
        self.auth(self.gestor_token)
        response = self.client.get('/api/auth/funcionarios/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_funcionarios_supervisor_forbidden(self):
        self.auth(self.supervisor_token)
        response = self.client.get('/api/auth/funcionarios/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_funcionarios_atendente_forbidden(self):
        self.auth(self.atendente_token)
        response = self.client.get('/api/auth/funcionarios/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_funcionarios_hospede_forbidden(self):
        self.auth(self.hospede_token)
        response = self.client.get('/api/auth/funcionarios/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_funcionarios_unauthenticated(self):
        response = self.client.get('/api/auth/funcionarios/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_filter_by_role(self):
        self.auth(self.gestor_token)
        response = self.client.get('/api/auth/funcionarios/?role=AT')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['role'], 'AT')

    def test_search_by_name(self):
        self.auth(self.gestor_token)
        response = self.client.get('/api/auth/funcionarios/?search=supervisor')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_funcionario_atendente(self):
        self.auth(self.gestor_token)
        data = {
            'first_name': 'Novo',
            'last_name': 'Atendente',
            'email': 'novo@test.com',
            'username': 'novoatendente',
            'telefone': '85999999999',
            'dataNascimento': '1995-05-05',
            'genero': 'M',
            'cpf': '99999999999',
            'senha': 'senha1234',
            'role': 'AT',
            'endereco': {
                'rua': 'Rua Nova',
                'numero': '456',
                'complemento': '',
                'bairro': 'Centro',
                'cidade': 'Fortaleza',
                'estado': 'CE',
                'cep': '60000000',
            }
        }
        response = self.client.post('/api/auth/funcionarios/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = Usuario.objects.get(username='novoatendente')
        detail = self.client.get(f'/api/auth/funcionarios/{user.pk}/')
        self.assertTrue(detail.data['numeroDeCadastro'].startswith('CAD'))
        self.assertEqual(len(detail.data['numeroDeCadastro']), 6)

    def test_create_funcionario_supervisor(self):
        self.auth(self.gestor_token)
        data = {
            'first_name': 'Novo',
            'last_name': 'Supervisor',
            'email': 'novosup@test.com',
            'username': 'novosupervisor',
            'telefone': '85988888888',
            'dataNascimento': '1995-05-05',
            'genero': 'M',
            'cpf': '88888888888',
            'senha': 'senha1234',
            'role': 'SV',
            'endereco': {
                'rua': 'Rua Nova',
                'numero': '789',
                'complemento': '',
                'bairro': 'Centro',
                'cidade': 'Fortaleza',
                'estado': 'CE',
                'cep': '60000000',
            }
        }
        response = self.client.post('/api/auth/funcionarios/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_funcionario_invalid_role(self):
        self.auth(self.gestor_token)
        data = {
            'first_name': 'Teste',
            'last_name': 'Invalido',
            'email': 'invalido@test.com',
            'username': 'invalido',
            'telefone': '85977777777',
            'dataNascimento': '1995-05-05',
            'genero': 'M',
            'cpf': '77777777777',
            'senha': 'senha1234',
            'role': 'GE',
            'endereco': {
                'rua': 'Rua Nova',
                'numero': '111',
                'complemento': '',
                'bairro': 'Centro',
                'cidade': 'Fortaleza',
                'estado': 'CE',
                'cep': '60000000',
            }
        }
        response = self.client.post('/api/auth/funcionarios/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class FuncionarioDetailViewTest(BaseAPITest):
    def test_get_funcionario_detail(self):
        self.auth(self.gestor_token)
        response = self.client.get(f'/api/auth/funcionarios/{self.supervisor.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'supervisor1')

    def test_update_funcionario(self):
        self.auth(self.gestor_token)
        data = {'first_name': 'Supervisor Atualizado'}
        response = self.client.patch(f'/api/auth/funcionarios/{self.supervisor.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.supervisor.refresh_from_db()
        self.assertEqual(self.supervisor.first_name, 'Supervisor Atualizado')

    def test_funcionario_detail_numero_cadastro(self):
        atendente_cad = Atendente.objects.create(
            username='atendente_cad',
            cpf='55555555555',
            telefone='85955555555',
            dataNascimento='1990-01-01',
            genero='M',
            endereco=EnderecoFactory.create(),
            role='AT',
            email='atendente_cad@test.com',
            hotel=self.hotel,
        )
        self.auth(self.gestor_token)
        response = self.client.get(f'/api/auth/funcionarios/{atendente_cad.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['numeroDeCadastro'].startswith('CAD'))
        self.assertEqual(len(response.data['numeroDeCadastro']), 6)

    def test_funcionario_detail_supervisor_no_numero_cadastro(self):
        self.auth(self.gestor_token)
        response = self.client.get(f'/api/auth/funcionarios/{self.supervisor.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['numeroDeCadastro'])

    def test_numero_cadastro_sequencial(self):
        a1 = Atendente.objects.create(
            username='atend_seq1', cpf='66666666666', telefone='85966666666',
            dataNascimento='1990-01-01', genero='M', endereco=EnderecoFactory.create(),
            role='AT', email='seq1@test.com',
        )
        a2 = Atendente.objects.create(
            username='atend_seq2', cpf='66666666667', telefone='85966666667',
            dataNascimento='1990-01-01', genero='M', endereco=EnderecoFactory.create(),
            role='AT', email='seq2@test.com',
        )
        self.assertNotEqual(a1.numeroDeCadastro, a2.numeroDeCadastro)
        self.assertTrue(a1.numeroDeCadastro.startswith('CAD'))
        self.assertTrue(a2.numeroDeCadastro.startswith('CAD'))
        n1 = int(a1.numeroDeCadastro[3:])
        n2 = int(a2.numeroDeCadastro[3:])
        self.assertEqual(n2, n1 + 1)


class FuncionarioInativarReativarTest(BaseAPITest):
    def test_inativar_funcionario(self):
        self.auth(self.gestor_token)
        response = self.client.patch(f'/api/auth/funcionarios/{self.supervisor.pk}/inativar/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.supervisor.refresh_from_db()
        self.assertFalse(self.supervisor.is_active)

    def test_reativar_funcionario(self):
        self.supervisor.is_active = False
        self.supervisor.save()
        self.auth(self.gestor_token)
        response = self.client.patch(f'/api/auth/funcionarios/{self.supervisor.pk}/reativar/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.supervisor.refresh_from_db()
        self.assertTrue(self.supervisor.is_active)

    def test_inativar_forbidden_non_gestor(self):
        self.auth(self.supervisor_token)
        response = self.client.patch(f'/api/auth/funcionarios/{self.atendente.pk}/inativar/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reativar_forbidden_non_gestor(self):
        self.auth(self.supervisor_token)
        response = self.client.patch(f'/api/auth/funcionarios/{self.atendente.pk}/reativar/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
