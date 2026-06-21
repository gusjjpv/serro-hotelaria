from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from controleDeAcesso.permissions import IsGestor, IsSupervisor, IsAtendente
from .models import Conta, Despesa, Produto
from .serializers import (
    ContaSerializer, DespesaSerializer, DespesaCreateSerializer,
    ProdutoSerializer,
)
from .service import adicionar_despesa, obter_extrato


class DespesaCreateView(generics.CreateAPIView):
    serializer_class = DespesaCreateSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        despesa = adicionar_despesa(
            conta=data['conta'],
            descricao=data['descricao'],
            valor=data['valor'],
            categoria=data['categoria'],
            produto=data.get('produto'),
        )
        return Response(
            DespesaSerializer(despesa).data,
            status=status.HTTP_201_CREATED,
        )


class ContaExtratoView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        from django.shortcuts import get_object_or_404
        user = self.request.user
        if user.role in ('GE', 'SV', 'AT'):
            if user.role == 'GE':
                return get_object_or_404(
                    Conta, pk=self.kwargs['pk'], reserva__hotel__gestor=user,
                )
            return get_object_or_404(
                Conta, pk=self.kwargs['pk'], reserva__hotel=user.hotel,
            )
        return get_object_or_404(
            Conta, pk=self.kwargs['pk'], reserva__hospede=user,
        )

    def get(self, request, *args, **kwargs):
        conta = self.get_object()
        despesas = obter_extrato(conta)
        return Response({
            'conta': ContaSerializer(conta).data,
            'despesas': DespesaSerializer(despesas, many=True).data,
        })


class ProdutoListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return ProdutoSerializer

    def get_queryset(self):
        return Produto.objects.all()

    def perform_create(self, serializer):
        serializer.save()


class ProdutoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProdutoSerializer
    permission_classes = [IsAuthenticated]
    queryset = Produto.objects.all()

    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save(update_fields=['ativo', 'dataAtualizacao'])
