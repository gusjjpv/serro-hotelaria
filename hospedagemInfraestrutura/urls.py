from django.urls import path
from .views import (
    HotelRegisterView, HotelManageView,
    HotelPublicListView, HotelPublicDetailView,
    CategoriaQuartoListCreateView, CategoriaQuartoDetailView,
    QuartoListCreateView, QuartoDetailView, QuartoDisponivelListView,
)

urlpatterns = [
    path('hoteis/', HotelPublicListView.as_view(), name='hotel-public-list'),
    path('hoteis/<int:pk>/', HotelPublicDetailView.as_view(), name='hotel-public-detail'),
    path('hotel/register/', HotelRegisterView.as_view(), name='hotel-register'),
    path('hotel/', HotelManageView.as_view(), name='hotel-manage'),
    path('categorias/', CategoriaQuartoListCreateView.as_view(), name='categoria-list'),
    path('categorias/<int:pk>/', CategoriaQuartoDetailView.as_view(), name='categoria-detail'),
    path('quartos/', QuartoListCreateView.as_view(), name='quarto-list'),
    path('quartos/<int:pk>/', QuartoDetailView.as_view(), name='quarto-detail'),
    path('quartos/disponiveis/', QuartoDisponivelListView.as_view(), name='quarto-disponivel-list'),
]
