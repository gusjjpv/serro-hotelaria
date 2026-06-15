from django.db import models
from django.contrib.auth.models import AbstractUser

class Endereco(models.Model):    
    rua = models.CharField(max_length=100)
    numero = models.CharField(max_length=5)
    complemento = models.CharField(max_length=100)
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
    endereco = models.ForeignKey(Endereco, on_delete=models.CASCADE)
    cpf = models.CharField(max_length=11, unique=True)
    dataAtualizacao = models.DateTimeField(auto_now=True)

    class Role(models.TextChoices):
        SUPERVISOR = 'SV', 'Supervisor'
        GESTOR = 'GE', 'Gestor'
        ATENDENDE = 'AT', 'Atendente'
        HOSPEDE = 'HO', 'Hóspede'
    
    role = models.CharField(max_length=2, choices=Role.choices)

    def __str__(self):
        return self.username
    