from django.contrib import admin
from .models import Hotel, CategoriaQuarto, Quarto


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
