from django.contrib import admin
from .models import Usuario, Endereco

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'cpf')
    search_fields = ('username', 'email', 'cpf')
    list_filter = ('role',)

@admin.register(Endereco)
class EnderecoAdmin(admin.ModelAdmin):
    list_display = ('rua', 'numero', 'bairro', 'cidade', 'estado', 'cep')
    search_fields = ('rua', 'bairro', 'cidade', 'estado', 'cep')
    list_filter = ('estado', 'cidade',)