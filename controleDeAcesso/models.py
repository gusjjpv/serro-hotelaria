from django.db import models
from django.contrib.auth.models import AbstractUser

class Endereco(models.Model):    
    rua = models.CharField(max_length=100)
    numero = models.CharField(max_length=5)
    complemento = models.CharField(max_length=100, blank=True, default='')
    bairro = models.CharField(max_length=100)
    cidade = models.CharField(max_length=100)
    estado = models.CharField(max_length=100)
    cep = models.CharField(max_length=8)

    def __str__(self):
        return f"{self.rua}, {self.numero} - {self.bairro}, {self.cidade} - {self.estado}, CEP: {self.cep}"

class Usuario(AbstractUser):
    username = models.CharField(max_length=20, unique=True)
    telefone = models.CharField(max_length=14, unique=True)
    dataNascimento = models.DateField()
    genero = models.CharField(max_length=10)
    endereco = models.ForeignKey(Endereco, on_delete=models.PROTECT)
    cpf = models.CharField(max_length=11, unique=True)
    dataAtualizacao = models.DateTimeField(auto_now=True)

    class Role(models.TextChoices):
        SUPERVISOR = 'SV', 'Supervisor'
        GESTOR = 'GE', 'Gestor'
        ATENDENTE = 'AT', 'Atendente'
        HOSPEDE = 'HO', 'Hóspede'
    
    role = models.CharField(max_length=2, choices=Role.choices)

    def __str__(self):
        return self.username


class Hospede(Usuario):
    pontosFidelidade = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.username} - Pontos: {self.pontosFidelidade}"


class Atendente(Usuario):
    numeroDeCadastro = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return f"{self.username} - Cadastro: {self.numeroDeCadastro}"


class Supervisor(Usuario):

    def __str__(self):
        return f"{self.username} - Supervisor"
    
class Gestor(Supervisor):

    def __str__(self):
        return f"{self.username} - Gestor"
