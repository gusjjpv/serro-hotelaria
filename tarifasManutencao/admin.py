from django.contrib import admin
from .models import Tarifa


@admin.register(Tarifa)
class TarifaAdmin(admin.ModelAdmin):
    list_display = ('categoria', 'tipoTemporada', 'valorDiaria', 'dataInicio', 'dataFim')
    list_filter = ('tipoTemporada', 'categoria__hotel')
    search_fields = ('categoria__nome',)
    readonly_fields = ('dataCriacao', 'dataAtualizacao')
