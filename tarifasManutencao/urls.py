from django.urls import path
from .views import (
    TarifaListCreateView, TarifaDetailView,
    ManutencaoListCreateView, ManutencaoDetailView,
    ManutencaoFinalizeView, ManutencaoCancelView,
)

urlpatterns = [
    path('tarifas/', TarifaListCreateView.as_view(), name='tarifa-list'),
    path('tarifas/<int:pk>/', TarifaDetailView.as_view(), name='tarifa-detail'),
    path('manutencoes/', ManutencaoListCreateView.as_view(), name='manutencao-list-create'),
    path('manutencoes/<int:pk>/', ManutencaoDetailView.as_view(), name='manutencao-detail'),
    path('manutencoes/<int:pk>/finalizar/', ManutencaoFinalizeView.as_view(), name='manutencao-finalize'),
    path('manutencoes/<int:pk>/cancelar/', ManutencaoCancelView.as_view(), name='manutencao-cancel'),
]
