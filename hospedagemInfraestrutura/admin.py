from django.contrib import admin
from .models import Hotel, CategoriaQuarto, Quarto, Reserva


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cnpj', 'telefoneContato', 'emailContato', 'gestor', 'dataCriacao')
    search_fields = ('nome', 'cnpj', 'emailContato')
    list_filter = ('dataCriacao',)
    readonly_fields = ('dataCriacao', 'dataAtualizacao')

    fieldsets = (
        ('Dados do Hotel', {
            'fields': ('nome', 'cnpj')
        }),
        ('Contato', {
            'fields': ('telefoneContato', 'emailContato')
        }),
        ('Vinculos', {
            'fields': ('endereco', 'gestor')
        }),
        ('Datas', {
            'fields': ('dataCriacao', 'dataAtualizacao')
        }),
    )


@admin.register(CategoriaQuarto)
class CategoriaQuartoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'hotel', 'capacidade', 'dataCriacao')
    search_fields = ('nome',)
    list_filter = ('hotel',)
    readonly_fields = ('dataCriacao', 'dataAtualizacao')

    fieldsets = (
        ('Dados da Categoria', {
            'fields': ('hotel', 'nome', 'descricao', 'capacidade')
        }),
        ('Datas', {
            'fields': ('dataCriacao', 'dataAtualizacao')
        }),
    )


@admin.register(Quarto)
class QuartoAdmin(admin.ModelAdmin):
    list_display = ('numero', 'hotel', 'categoria', 'status', 'andar')
    search_fields = ('numero',)
    list_filter = ('status', 'hotel', 'categoria')
    list_editable = ('status',)
    readonly_fields = ('dataCriacao', 'dataAtualizacao')

    fieldsets = (
        ('Dados do Quarto', {
            'fields': ('hotel', 'numero', 'andar', 'categoria', 'status')
        }),
        ('Datas', {
            'fields': ('dataCriacao', 'dataAtualizacao')
        }),
    )


@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'hospede', 'hotel', 'categoria', 'quarto', 'dataEntrada', 'dataSaida', 'status', 'valorTotal')
    search_fields = ('codigo', 'hospede__username', 'hospede__first_name')
    list_filter = ('status', 'hotel', 'categoria')
    readonly_fields = ('codigo', 'dataReserva', 'dataAtualizacao')

    fieldsets = (
        ('Reserva', {
            'fields': ('codigo', 'hospede', 'hotel', 'categoria', 'quarto')
        }),
        ('Estadia', {
            'fields': ('dataEntrada', 'dataSaida', 'numHospedes', 'valorTotal', 'status')
        }),
        ('Datas', {
            'fields': ('dataReserva', 'dataAtualizacao')
        }),
    )
