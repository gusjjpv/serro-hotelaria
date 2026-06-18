from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from controleDeAcesso.permissions import IsGestor
from .models import Tarifa
from .serializers import TarifaSerializer


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
