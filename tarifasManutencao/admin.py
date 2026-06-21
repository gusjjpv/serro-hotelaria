from django.contrib import admin
from .models import Tarifa, Manutencao


@admin.register(Tarifa)
class TarifaAdmin(admin.ModelAdmin):
    list_display = ('categoria', 'tipoTemporada', 'valorDiaria', 'dataInicio', 'dataFim')
    list_filter = ('tipoTemporada', 'categoria__hotel')
    search_fields = ('categoria__nome',)
    readonly_fields = ('dataCriacao', 'dataAtualizacao')


@admin.register(Manutencao)
class ManutencaoAdmin(admin.ModelAdmin):
    list_display = ('id', 'quarto', 'hotel', 'motivo', 'status', 'dataInicio', 'dataFim')
    list_filter = ('status', 'motivo', 'hotel')
    search_fields = ('quarto__numero', 'descricao')
    readonly_fields = ('statusAnterior', 'dataCriacao', 'dataAtualizacao')
