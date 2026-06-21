from django.db import models
from django.core.exceptions import ValidationError


class TipoTemporada(models.TextChoices):
    ALTA = 'ALTA', 'Alta Temporada'
    BAIXA = 'BAIXA', 'Baixa Temporada'


class MotivoManutencao(models.TextChoices):
    PREVENTIVA = 'PREV', 'Preventiva'
    CORRETIVA = 'CORR', 'Corretiva'
    LIMPEZA = 'LIMP', 'Limpeza'


class StatusManutencao(models.TextChoices):
    AGENDADA = 'AGEN', 'Agendada'
    EM_ANDAMENTO = 'EMAN', 'Em Andamento'
    CONCLUIDA = 'CONC', 'Concluída'
    CANCELADA = 'CANC', 'Cancelada'


class Tarifa(models.Model):
    categoria = models.ForeignKey(
        'hospedagemInfraestrutura.CategoriaQuarto',
        on_delete=models.CASCADE,
        related_name='tarifas',
    )
    valorDiaria = models.DecimalField(max_digits=10, decimal_places=2)
    dataInicio = models.DateField()
    dataFim = models.DateField()
    tipoTemporada = models.CharField(max_length=5, choices=TipoTemporada.choices)
    dataCriacao = models.DateTimeField(auto_now_add=True)
    dataAtualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Tarifa'
        verbose_name_plural = 'Tarifas'
        ordering = ['-dataInicio']

    def __str__(self):
        return f'{self.categoria.nome} - {self.get_tipoTemporada_display()} - R$ {self.valorDiaria}'

    def clean(self):
        if self.dataFim and self.dataInicio and self.dataFim < self.dataInicio:
            raise ValidationError('dataFim deve ser igual ou posterior a dataInicio.')

        if self.categoria and self.dataInicio and self.dataFim:
            overlapping = Tarifa.objects.filter(
                categoria=self.categoria,
                dataInicio__lte=self.dataFim,
                dataFim__gte=self.dataInicio,
            )
            if self.pk:
                overlapping = overlapping.exclude(pk=self.pk)
            if overlapping.exists():
                raise ValidationError('Ja existe uma tarifa vigente para esta categoria no periodo informado.')

    def estaVigente(self, data):
        return self.dataInicio <= data <= self.dataFim

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Manutencao(models.Model):
    quarto = models.ForeignKey(
        'hospedagemInfraestrutura.Quarto',
        on_delete=models.CASCADE,
        related_name='manutencoes',
    )
    hotel = models.ForeignKey(
        'hospedagemInfraestrutura.Hotel',
        on_delete=models.CASCADE,
        related_name='manutencoes',
    )
    dataInicio = models.DateField()
    dataFim = models.DateField()
    motivo = models.CharField(max_length=4, choices=MotivoManutencao.choices)
    descricao = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=4,
        choices=StatusManutencao.choices,
        default=StatusManutencao.EM_ANDAMENTO,
    )
    statusAnterior = models.CharField(max_length=4)
    dataCriacao = models.DateTimeField(auto_now_add=True)
    dataAtualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Manutenção'
        verbose_name_plural = 'Manutenções'
        ordering = ['-dataCriacao']

    def __str__(self):
        return f'Manutenção {self.pk} - Quarto {self.quarto.numero} ({self.get_status_display()})'
