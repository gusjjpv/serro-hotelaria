from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from controleDeAcesso.permissions import IsGestor, IsSupervisor, IsAtendente
from .models import Hotel, CategoriaQuarto, Quarto
from .serializers import (
    HotelSerializer, CategoriaQuartoSerializer, QuartoSerializer,
    HotelPublicSerializer, HotelPublicDetailSerializer,
)


class HotelRegisterView(generics.CreateAPIView):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    permission_classes = [IsAuthenticated, IsGestor]

    def perform_create(self, serializer):
        serializer.save(gestor=self.request.user)


class HotelManageView(generics.RetrieveUpdateAPIView):
    serializer_class = HotelSerializer
    permission_classes = [IsAuthenticated, IsGestor]

    def get_object(self):
        return get_object_or_404(Hotel, gestor=self.request.user)


class CategoriaQuartoListCreateView(generics.ListCreateAPIView):
    serializer_class = CategoriaQuartoSerializer
    permission_classes = [IsAuthenticated, IsSupervisor]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'GE':
            return CategoriaQuarto.objects.filter(hotel__gestor=user)
        return CategoriaQuarto.objects.filter(hotel=user.hotel)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'GE':
            hotel = get_object_or_404(Hotel, gestor=user)
        else:
            hotel = user.hotel
        serializer.save(hotel=hotel)


class CategoriaQuartoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategoriaQuartoSerializer
    permission_classes = [IsAuthenticated, IsSupervisor]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'GE':
            return CategoriaQuarto.objects.filter(hotel__gestor=user)
        return CategoriaQuarto.objects.filter(hotel=user.hotel)


class QuartoListCreateView(generics.ListCreateAPIView):
    serializer_class = QuartoSerializer
    permission_classes = [IsAuthenticated, IsSupervisor]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'GE':
            return Quarto.objects.filter(hotel__gestor=user)
        return Quarto.objects.filter(hotel=user.hotel)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'GE':
            hotel = get_object_or_404(Hotel, gestor=user)
        else:
            hotel = user.hotel
        serializer.save(hotel=hotel)


class QuartoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = QuartoSerializer
    permission_classes = [IsAuthenticated, IsSupervisor]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'GE':
            return Quarto.objects.filter(hotel__gestor=user)
        return Quarto.objects.filter(hotel=user.hotel)


class QuartoDisponivelListView(generics.ListAPIView):
    serializer_class = QuartoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Quarto.objects.filter(status='DISP')


class HotelPublicListView(generics.ListAPIView):
    serializer_class = HotelPublicSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Hotel.objects.select_related('endereco').all()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(nome__icontains=search) | Q(endereco__cidade__icontains=search)
            )
        return qs


class HotelPublicDetailView(generics.RetrieveAPIView):
    serializer_class = HotelPublicDetailSerializer
    permission_classes = [AllowAny]
    queryset = Hotel.objects.select_related('endereco').prefetch_related('categorias__quartos')
