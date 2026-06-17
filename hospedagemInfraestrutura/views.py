from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from controleDeAcesso.permissions import IsGestor
from .models import Hotel
from .serializers import HotelSerializer


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
