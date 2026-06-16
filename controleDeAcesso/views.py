from rest_framework.generics import CreateAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .serializers import (
    RegisterSerializer, CustomTokenObtainPairSerializer,
    UserProfileSerializer, UserAdminSerializer, UserListSerializer,
)
from .permissions import IsGestor
from .models import Usuario


class RegisterView(CreateAPIView):
    serializer_class = RegisterSerializer
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
