from django.db import models
from django.utils.timezone import now


class StatusConta(models.TextChoices):
    ABERTA = 'ABER', 'Aberta'
    PAGA = 'PAGA', 'Paga'
    FECHADA = 'FECH', 'Fechada'
    CANCELADA = 'CANC', 'Cancelada'


class CategoriaDespesa(models.TextChoices):
    FRIGOBAR = 'FRIG', 'Frigobar'
    SERVICO_QUARTO = 'SERV', 'Serviço de Quarto'
    SPA = 'SPA', 'Spa'
    OUTROS = 'OUTR', 'Outros'


class Conta(models.Model):
    reserva = models.OneToOneField(
        'hospedagemInfraestrutura.Reserva',
        on_delete=models.PROTECT,
        related_name='conta',
    )
    dataAbertura = models.DateTimeField(default=now)
    dataFechamento = models.DateTimeField(null=True, blank=True)
    totalAcumulado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(
        max_length=4,
        choices=StatusConta.choices,
        default=StatusConta.ABERTA,
    )
    nomeTitular = models.CharField(max_length=255)
    cpfTitular = models.CharField(max_length=14)
    dataCriacao = models.DateTimeField(auto_now_add=True)
    dataAtualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Conta'
        verbose_name_plural = 'Contas'
        ordering = ['-dataCriacao']

    def __str__(self):
        return f'Conta {self.pk} - {self.reserva.codigo} ({self.get_status_display()})'


class Produto(models.Model):
    nome = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, default='')
    categoria = models.CharField(max_length=4, choices=CategoriaDespesa.choices)
    precoAtual = models.DecimalField(max_digits=10, decimal_places=2)
    ativo = models.BooleanField(default=True)
    dataCriacao = models.DateTimeField(auto_now_add=True)
    dataAtualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Produto'
        verbose_name_plural = 'Produtos'
        ordering = ['nome']

    def __str__(self):
        return f'{self.nome} - R$ {self.precoAtual:.2f}'


class Despesa(models.Model):
    conta = models.ForeignKey(Conta, on_delete=models.CASCADE, related_name='despesas')
    descricao = models.CharField(max_length=255)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.CharField(max_length=4, choices=CategoriaDespesa.choices)
    produto = models.ForeignKey(
        Produto, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='despesas',
    )
    dataHora = models.DateTimeField(default=now)
    dataCriacao = models.DateTimeField(auto_now_add=True)
    dataAtualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Despesa'
        verbose_name_plural = 'Despesas'
        ordering = ['-dataHora']

    def __str__(self):
        return f'{self.descricao} - R$ {self.valor:.2f}'
