from django.contrib import admin
from .models import Conta, Despesa, Produto


@admin.register(Conta)
class ContaAdmin(admin.ModelAdmin):
    list_display = ['id', 'reserva', 'nomeTitular', 'totalAcumulado', 'status', 'dataAbertura']
    list_filter = ['status']
    search_fields = ['nomeTitular', 'cpfTitular', 'reserva__codigo']


@admin.register(Despesa)
class DespesaAdmin(admin.ModelAdmin):
    list_display = ['id', 'conta', 'descricao', 'valor', 'categoria', 'dataHora']
    list_filter = ['categoria']
    search_fields = ['descricao', 'conta__reserva__codigo']


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ['id', 'nome', 'categoria', 'precoAtual', 'ativo']
    list_filter = ['categoria', 'ativo']
    search_fields = ['nome']
