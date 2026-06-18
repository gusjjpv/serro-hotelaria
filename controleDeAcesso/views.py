from rest_framework.generics import CreateAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView, RetrieveUpdateAPIView, UpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .serializers import (
    RegisterSerializer, GestorRegisterSerializer, CustomTokenObtainPairSerializer,
    UserProfileSerializer, UserAdminSerializer, UserListSerializer,
    FuncionarioListSerializer, FuncionarioDetailSerializer, FuncionarioCreateSerializer,
)
from .permissions import IsGestor
from .models import Usuario


class FuncionarioQuerysetMixin:
    def get_queryset(self):
        from hospedagemInfraestrutura.models import Hotel
        hotel = Hotel.objects.filter(gestor=self.request.user).first()
        if not hotel:
            return Usuario.objects.none()
        return Usuario.objects.filter(hotel=hotel, role__in=['SV', 'AT'])


class RegisterView(CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class GestorRegisterView(CreateAPIView):
    serializer_class = GestorRegisterSerializer
    permission_classes = [AllowAny]


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(RetrieveAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListCreateView(ListCreateAPIView):
    queryset = Usuario.objects.all()
    permission_classes = [IsAuthenticated, IsGestor]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserListSerializer
        return UserAdminSerializer


class UserDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UserAdminSerializer
    permission_classes = [IsAuthenticated, IsGestor]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class FuncionarioListView(FuncionarioQuerysetMixin, ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsGestor]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return FuncionarioListSerializer
        return FuncionarioCreateSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(username__icontains=search) |
                Q(cpf__icontains=search)
            )
        return queryset


class FuncionarioDetailView(FuncionarioQuerysetMixin, RetrieveUpdateAPIView):
    serializer_class = FuncionarioDetailSerializer
    permission_classes = [IsAuthenticated, IsGestor]


class FuncionarioInativarView(FuncionarioQuerysetMixin, UpdateAPIView):
    serializer_class = FuncionarioListSerializer
    permission_classes = [IsAuthenticated, IsGestor]

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({'detail': 'Funcionário inativado com sucesso.'}, status=status.HTTP_200_OK)


class FuncionarioReativarView(FuncionarioQuerysetMixin, UpdateAPIView):
    serializer_class = FuncionarioListSerializer
    permission_classes = [IsAuthenticated, IsGestor]

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = True
        instance.save()
        return Response({'detail': 'Funcionário reativado com sucesso.'}, status=status.HTTP_200_OK)
