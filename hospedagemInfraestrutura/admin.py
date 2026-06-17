from django.contrib import admin
from .models import Hotel


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cnpj', 'telefoneContato', 'emailContato', 'gestor')
    search_fields = ('nome', 'cnpj', 'emailContato')
    list_filter = ('dataCriacao',)
