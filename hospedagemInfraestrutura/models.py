from django.db import models
from controleDeAcesso.models import Endereco, Usuario


class Hotel(models.Model):
    nome = models.CharField(max_length=255)
    cnpj = models.CharField(max_length=18, unique=True)
    endereco = models.ForeignKey(Endereco, on_delete=models.PROTECT)
    telefoneContato = models.CharField(max_length=20)
    emailContato = models.EmailField()
    gestor = models.OneToOneField(
        Usuario, on_delete=models.CASCADE, limit_choices_to={'role': 'GE'},
    )
    dataCriacao = models.DateTimeField(auto_now_add=True)
    dataAtualizacao = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.nome} - {self.cnpj}'
