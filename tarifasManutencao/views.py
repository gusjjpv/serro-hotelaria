from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from controleDeAcesso.permissions import IsGestor, IsSupervisor
from hospedagemInfraestrutura.models import Quarto, StatusQuarto
from .models import Tarifa, Manutencao, StatusManutencao
from .serializers import (
    TarifaSerializer, ManutencaoSerializer, ManutencaoCreateSerializer,
)


class TarifaListCreateView(generics.ListCreateAPIView):
    serializer_class = TarifaSerializer
    permission_classes = [IsAuthenticated, IsGestor]

    def get_queryset(self):
        return Tarifa.objects.filter(categoria__hotel__gestor=self.request.user)


class TarifaDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TarifaSerializer
    permission_classes = [IsAuthenticated, IsGestor]

    def get_queryset(self):
        return Tarifa.objects.filter(categoria__hotel__gestor=self.request.user)


class ManutencaoListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsSupervisor]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ManutencaoCreateSerializer
        return ManutencaoSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'GE':
            return Manutencao.objects.filter(hotel__gestor=user).select_related(
                'quarto', 'hotel',
            )
        return Manutencao.objects.filter(hotel=user.hotel).select_related(
            'quarto', 'hotel',
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        quarto = data['quarto']
        hotel = data['hotel']
        with transaction.atomic():
            manutencao = Manutencao.objects.create(
                quarto=quarto,
                hotel=hotel,
                dataInicio=data['dataInicio'],
                dataFim=data['dataFim'],
                motivo=data['motivo'],
                descricao=data.get('descricao', ''),
                status=StatusManutencao.EM_ANDAMENTO,
                statusAnterior=quarto.status,
            )
            quarto.status = StatusQuarto.MANUTENCAO
            quarto.save(update_fields=['status'])
        return Response(
            ManutencaoSerializer(manutencao).data,
            status=status.HTTP_201_CREATED,
        )


class ManutencaoDetailView(generics.RetrieveAPIView):
    serializer_class = ManutencaoSerializer
    permission_classes = [IsAuthenticated, IsSupervisor]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'GE':
            return Manutencao.objects.filter(hotel__gestor=user).select_related(
                'quarto', 'hotel',
            )
        return Manutencao.objects.filter(hotel=user.hotel).select_related(
            'quarto', 'hotel',
        )


class ManutencaoFinalizeView(generics.UpdateAPIView):
    serializer_class = ManutencaoSerializer
    permission_classes = [IsAuthenticated, IsSupervisor]

    def get_object(self):
        user = self.request.user
        if user.role == 'GE':
            return get_object_or_404(
                Manutencao, pk=self.kwargs['pk'], hotel__gestor=user,
            )
        return get_object_or_404(
            Manutencao, pk=self.kwargs['pk'], hotel=user.hotel,
        )

    def update(self, request, *args, **kwargs):
        manutencao = self.get_object()
        if manutencao.status not in (StatusManutencao.AGENDADA, StatusManutencao.EM_ANDAMENTO):
            return Response(
                {'detail': 'Somente manutenções AGENDADAS ou EM ANDAMENTO podem ser finalizadas.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            manutencao.status = StatusManutencao.CONCLUIDA
            manutencao.save(update_fields=['status', 'dataAtualizacao'])
            quarto = manutencao.quarto
            quarto.status = manutencao.statusAnterior
            quarto.save(update_fields=['status'])
        return Response(ManutencaoSerializer(manutencao).data)


class ManutencaoCancelView(generics.UpdateAPIView):
    serializer_class = ManutencaoSerializer
    permission_classes = [IsAuthenticated, IsSupervisor]

    def get_object(self):
        user = self.request.user
        if user.role == 'GE':
            return get_object_or_404(
                Manutencao, pk=self.kwargs['pk'], hotel__gestor=user,
            )
        return get_object_or_404(
            Manutencao, pk=self.kwargs['pk'], hotel=user.hotel,
        )

    def update(self, request, *args, **kwargs):
        manutencao = self.get_object()
        if manutencao.status not in (StatusManutencao.AGENDADA, StatusManutencao.EM_ANDAMENTO):
            return Response(
                {'detail': 'Somente manutenções AGENDADAS ou EM ANDAMENTO podem ser canceladas.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            manutencao.status = StatusManutencao.CANCELADA
            manutencao.save(update_fields=['status', 'dataAtualizacao'])
            quarto = manutencao.quarto
            quarto.status = manutencao.statusAnterior
            quarto.save(update_fields=['status'])
        return Response(ManutencaoSerializer(manutencao).data)
