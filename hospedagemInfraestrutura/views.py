from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from controleDeAcesso.permissions import IsGestor, IsSupervisor, IsAtendente
from .models import Hotel, CategoriaQuarto, Quarto, StatusQuarto, Reserva, StatusReserva, ALLOWED_QUARTO_TRANSITIONS
from .serializers import (
    HotelSerializer, CategoriaQuartoSerializer, QuartoSerializer,
    QuartoStatusSerializer, HotelPublicSerializer, HotelPublicDetailSerializer,
    CategoriaDisponivelSerializer, ReservaSerializer, ReservaCreateSerializer,
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


class QuartoStatusUpdateView(generics.UpdateAPIView):
    serializer_class = QuartoStatusSerializer
    permission_classes = [IsAuthenticated, IsSupervisor]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'GE':
            return Quarto.objects.filter(hotel__gestor=user)
        return Quarto.objects.filter(hotel=user.hotel)

    def perform_update(self, serializer):
        instance = self.get_object()
        new_status = serializer.validated_data['status']
        old_status = instance.status

        allowed = ALLOWED_QUARTO_TRANSITIONS.get(old_status, [])
        if new_status not in allowed:
            raise serializers.ValidationError(
                {'status': f'Não é permitido alterar de "{instance.get_status_display()}" para "{dict(StatusQuarto.choices).get(new_status)}".'}
            )

        instance.status = new_status
        instance.status_changed_at = timezone.now()
        instance.status_changed_by = self.request.user
        instance.save(update_fields=['status', 'status_changed_at', 'status_changed_by'])


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


class HotelDisponibilidadeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        hotel = get_object_or_404(Hotel, pk=pk)

        try:
            data_entrada = date.fromisoformat(request.query_params.get('dataEntrada', ''))
            data_saida = date.fromisoformat(request.query_params.get('dataSaida', ''))
            num_hospedes = int(request.query_params.get('numHospedes', 1))
        except (TypeError, ValueError):
            return Response({'error': 'Parâmetros dataEntrada, dataSaida e numHospedes são obrigatórios.'}, status=400)

        dias = (data_saida - data_entrada).days
        if dias <= 0:
            return Response({'error': 'Período de estadia inválido.'}, status=400)

        categorias = hotel.categorias.filter(capacidade__gte=num_hospedes)

        from tarifasManutencao.models import Tarifa

        results = []
        for cat in categorias:
            total_rooms = cat.quartos.filter(status=StatusQuarto.DISPONIVEL).count()
            overlapping = Reserva.objects.filter(
                categoria=cat,
                status=StatusReserva.CONFIRMADA,
                dataEntrada__lt=data_saida,
                dataSaida__gt=data_entrada,
            ).count()

            quartos_disponiveis = max(0, total_rooms - overlapping)
            if quartos_disponiveis == 0:
                continue

            valor_total = Decimal('0.00')
            current = data_entrada
            while current < data_saida:
                tarifa = Tarifa.objects.filter(
                    categoria=cat,
                    dataInicio__lte=current,
                    dataFim__gte=current,
                ).order_by('-dataInicio').first()

                valor_total += tarifa.valorDiaria if tarifa else cat.precoBase
                current += timedelta(days=1)

            results.append({
                'id': cat.id,
                'nome': cat.nome,
                'descricao': cat.descricao,
                'capacidade': cat.capacidade,
                'precoBase': cat.precoBase,
                'quartosDisponiveis': quartos_disponiveis,
                'valorTotal': valor_total,
                'dias': dias,
            })

        serializer = CategoriaDisponivelSerializer(results, many=True)
        return Response(serializer.data)


class ReservaCreateView(generics.CreateAPIView):
    serializer_class = ReservaCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(hospede=self.request.user)


class ReservaDetailView(generics.RetrieveAPIView):
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return get_object_or_404(
            Reserva, pk=self.kwargs['pk'], hospede=self.request.user,
        )
