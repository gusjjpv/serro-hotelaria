from django.db import models
from django.utils.timezone import now as timezone_now
from controleDeAcesso.models import Endereco, Usuario


class StatusQuarto(models.TextChoices):
    DISPONIVEL = 'DISP', 'Disponível'
    OCUPADO = 'OCUP', 'Ocupado'
    LIMPEZA = 'LIMP', 'Em Limpeza'
    MANUTENCAO = 'MANU', 'Em Manutenção'


ALLOWED_QUARTO_TRANSITIONS = {
    StatusQuarto.DISPONIVEL: [StatusQuarto.OCUPADO, StatusQuarto.LIMPEZA, StatusQuarto.MANUTENCAO],
    StatusQuarto.OCUPADO: [StatusQuarto.LIMPEZA],
    StatusQuarto.LIMPEZA: [StatusQuarto.DISPONIVEL, StatusQuarto.MANUTENCAO],
    StatusQuarto.MANUTENCAO: [StatusQuarto.DISPONIVEL],
}


class StatusReserva(models.TextChoices):
    PENDENTE = 'PEND', 'Pendente'
    CONFIRMADA = 'CONF', 'Confirmada'
    CHECK_IN = 'CHIN', 'Check-in'
    FINALIZADA = 'FINA', 'Finalizada'
    CANCELADA = 'CANC', 'Cancelada'


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
    status_changed_at = models.DateTimeField(null=True, blank=True)
    status_changed_by = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, null=True, blank=True,
    )
    dataCriacao = models.DateTimeField(auto_now_add=True)
    dataAtualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['hotel', 'numero']

    def __str__(self):
        return f'Quarto {self.numero} - {self.get_status_display()}'


class Reserva(models.Model):
    codigo = models.CharField(max_length=10, unique=True)
    hospede = models.ForeignKey(
        Usuario, on_delete=models.PROTECT, related_name='reservas',
        limit_choices_to={'role': 'HO'},
    )
    hotel = models.ForeignKey(Hotel, on_delete=models.PROTECT, related_name='reservas')
    categoria = models.ForeignKey(
        CategoriaQuarto, on_delete=models.PROTECT, related_name='reservas',
    )
    quarto = models.ForeignKey(
        Quarto, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reservas',
    )
    dataEntrada = models.DateField()
    dataSaida = models.DateField()
    numHospedes = models.PositiveIntegerField()
    valorTotal = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=4, choices=StatusReserva.choices, default=StatusReserva.PENDENTE,
    )
    dataReserva = models.DateTimeField(auto_now_add=True)
    dataAtualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Reserva'
        verbose_name_plural = 'Reservas'
        ordering = ['-dataReserva']

    def save(self, *args, **kwargs):
        if not self.codigo:
            from django.db.models import Max, IntegerField
            from django.db.models.functions import Cast, Substr
            last = (
                Reserva.objects
                .filter(codigo__startswith='RES')
                .annotate(num=Cast(Substr('codigo', 4), output_field=IntegerField()))
                .order_by('-num')
                .values_list('num', flat=True)
                .first()
            )
            self.codigo = f'RES{(last or 0) + 1:05d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.codigo} - {self.hospede.username} ({self.get_status_display()})'
