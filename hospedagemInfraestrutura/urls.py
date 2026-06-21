from django.urls import path
from .views import (
    HotelRegisterView, HotelManageView,
    HotelPublicListView, HotelPublicDetailView, HotelDisponibilidadeView,
    CategoriaQuartoListCreateView, CategoriaQuartoDetailView,
    QuartoListCreateView, QuartoDetailView, QuartoDisponivelListView,
    QuartoStatusUpdateView,
    ReservaListCreateView, ReservaDetailView, ReservaCancelView,
    ReservaCheckInView, ReservaCheckInPresencialView, ReservaCheckOutView,
    PainelDoDiaView,
)

urlpatterns = [
    path('hoteis/', HotelPublicListView.as_view(), name='hotel-public-list'),
    path('hoteis/<int:pk>/', HotelPublicDetailView.as_view(), name='hotel-public-detail'),
    path('hoteis/<int:pk>/disponibilidade/', HotelDisponibilidadeView.as_view(), name='hotel-disponibilidade'),
    path('hotel/register/', HotelRegisterView.as_view(), name='hotel-register'),
    path('hotel/', HotelManageView.as_view(), name='hotel-manage'),
    path('categorias/', CategoriaQuartoListCreateView.as_view(), name='categoria-list'),
    path('categorias/<int:pk>/', CategoriaQuartoDetailView.as_view(), name='categoria-detail'),
    path('quartos/', QuartoListCreateView.as_view(), name='quarto-list'),
    path('quartos/disponiveis/', QuartoDisponivelListView.as_view(), name='quarto-disponivel-list'),
    path('quartos/<int:pk>/', QuartoDetailView.as_view(), name='quarto-detail'),
    path('quartos/<int:pk>/status/', QuartoStatusUpdateView.as_view(), name='quarto-status'),
    path('reservas/', ReservaListCreateView.as_view(), name='reserva-list-create'),
    path('reservas/<int:pk>/', ReservaDetailView.as_view(), name='reserva-detail'),
    path('reservas/<int:pk>/cancelar/', ReservaCancelView.as_view(), name='reserva-cancel'),
    path('reservas/<int:pk>/check-in/', ReservaCheckInView.as_view(), name='reserva-checkin'),
    path('reservas/<int:pk>/checkin-presencial/', ReservaCheckInPresencialView.as_view(), name='reserva-checkin-presencial'),
    path('reservas/<int:pk>/checkout/', ReservaCheckOutView.as_view(), name='reserva-checkout'),
    path('reservas/painel-do-dia/', PainelDoDiaView.as_view(), name='reserva-painel-do-dia'),
]
