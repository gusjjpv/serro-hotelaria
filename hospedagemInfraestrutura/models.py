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
        related_name='+',
    )
    dataCriacao = models.DateTimeField(auto_now_add=True)
    dataAtualizacao = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.nome} - {self.cnpj}'


class StatusQuarto(models.TextChoices):
    DISPONIVEL = 'DISP', 'Disponível'
    OCUPADO = 'OCUP', 'Ocupado'
    LIMPEZA = 'LIMP', 'Em Limpeza'
    MANUTENCAO = 'MANU', 'Em Manutenção'


class CategoriaQuarto(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='categorias')
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, default='')
    capacidade = models.PositiveIntegerField()
    precoBase = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    dataCriacao = models.DateTimeField(auto_now_add=True)
    dataAtualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'categorias de quarto'
        unique_together = ['hotel', 'nome']

    def __str__(self):
        return f'{self.nome} ({self.capacidade} pessoa{"s" if self.capacidade > 1 else ""})'


class Quarto(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='quartos')
    numero = models.CharField(max_length=10)
    andar = models.IntegerField()
    categoria = models.ForeignKey(CategoriaQuarto, on_delete=models.PROTECT, related_name='quartos')
    status = models.CharField(
        max_length=4,
        choices=StatusQuarto.choices,
        default=StatusQuarto.DISPONIVEL,
    )
    dataCriacao = models.DateTimeField(auto_now_add=True)
    dataAtualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['hotel', 'numero']

    def __str__(self):
        return f'Quarto {self.numero} - {self.get_status_display()}'
