from django.urls import path
from .views import TarifaListCreateView, TarifaDetailView

urlpatterns = [
    path('tarifas/', TarifaListCreateView.as_view(), name='tarifa-list'),
    path('tarifas/<int:pk>/', TarifaDetailView.as_view(), name='tarifa-detail'),
]
