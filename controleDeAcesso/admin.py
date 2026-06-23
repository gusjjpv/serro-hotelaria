from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Endereco, Usuario, Hospede, Atendente, Supervisor, Gestor


@admin.register(Endereco)
class EnderecoAdmin(admin.ModelAdmin):
    list_display = ('rua', 'numero', 'bairro', 'cidade', 'estado', 'cep')
    search_fields = ('rua', 'bairro', 'cidade', 'estado', 'cep')
    list_filter = ('estado', 'cidade')


class BaseUserAdmin(UserAdmin):
    model = Usuario

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Dados Pessoais', {
            'fields': ('first_name', 'last_name', 'email', 'telefone', 'dataNascimento', 'genero', 'cpf')
        }),
        ('Vinculos', {
            'fields': ('endereco', 'hotel')
        }),
        ('Permissoes', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Datas Importantes', {
            'fields': ('last_login', 'date_joined')
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2',
                'first_name', 'last_name', 'telefone', 'dataNascimento',
                'genero', 'cpf', 'endereco', 'hotel',
                'is_active', 'is_staff',
            ),
        }),
    )


@admin.register(Gestor)
class GestorAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'cpf', 'hotel')
    search_fields = ('username', 'email', 'first_name', 'cpf')
    list_filter = ('hotel',)

    def get_queryset(self, request):
        return super().get_queryset(request).filter(role='GE')

    def save_model(self, request, obj, form, change):
        if not change:
            obj.role = 'GE'
        super().save_model(request, obj, form, change)


@admin.register(Supervisor)
class SupervisorAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'cpf', 'hotel')
    search_fields = ('username', 'email', 'first_name', 'cpf')
    list_filter = ('hotel',)

    def get_queryset(self, request):
        return super().get_queryset(request).filter(role='SV')

    def save_model(self, request, obj, form, change):
        if not change:
            obj.role = 'SV'
        super().save_model(request, obj, form, change)


@admin.register(Atendente)
class AtendenteAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'cpf', 'numeroDeCadastro', 'hotel')
    search_fields = ('username', 'email', 'first_name', 'cpf')
    list_filter = ('hotel',)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Dados Pessoais', {
            'fields': ('first_name', 'last_name', 'email', 'telefone', 'dataNascimento', 'genero', 'cpf')
        }),
        ('Vinculos', {
            'fields': ('endereco', 'hotel')
        }),
        ('Cadastro Profissional', {
            'fields': ('numeroDeCadastro',)
        }),
        ('Permissoes', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Datas Importantes', {
            'fields': ('last_login', 'date_joined')
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2',
                'first_name', 'last_name', 'telefone', 'dataNascimento',
                'genero', 'cpf', 'endereco', 'hotel',
                'is_active', 'is_staff',
            ),
        }),
    )

    readonly_fields = ('numeroDeCadastro',)

    def get_queryset(self, request):
        return super().get_queryset(request).filter(role='AT')

    def save_model(self, request, obj, form, change):
        if not change:
            obj.role = 'AT'
        super().save_model(request, obj, form, change)


@admin.register(Hospede)
class HospedeAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'cpf', 'pontosFidelidade')
    search_fields = ('username', 'email', 'first_name', 'cpf')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Dados Pessoais', {
            'fields': ('first_name', 'last_name', 'email', 'telefone', 'dataNascimento', 'genero', 'cpf')
        }),
        ('Vinculos', {
            'fields': ('endereco',)
        }),
        ('Programa de Fidelidade', {
            'fields': ('pontosFidelidade',)
        }),
        ('Permissoes', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Datas Importantes', {
            'fields': ('last_login', 'date_joined')
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2',
                'first_name', 'last_name', 'telefone', 'dataNascimento',
                'genero', 'cpf', 'endereco', 'pontosFidelidade',
                'is_active', 'is_staff',
            ),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).filter(role='HO')

    def save_model(self, request, obj, form, change):
        if not change:
            obj.role = 'HO'
        super().save_model(request, obj, form, change)
