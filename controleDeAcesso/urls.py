from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, GestorRegisterView, CustomTokenObtainPairView, MeView, UserListCreateView, UserDetailView

urlpatterns = [
    # Público: cadastro de hóspede (role=HO)
    path('register/', RegisterView.as_view(), name='auth-register'),
    # Público: cadastro de gestor (role=GE)
    path('register/gestor/', GestorRegisterView.as_view(), name='auth-register-gestor'),

    # Público: login — retorna access + refresh + user com role
    path('login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    # Público: renovar access token usando refresh token
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # Autenticado: perfil completo do usuário logado (com endereco)
    path('me/', MeView.as_view(), name='auth-me'),

    # Gestor apenas: listar usuários (GET) ou criar qualquer role (POST)
    path('users/', UserListCreateView.as_view(), name='user-list'),
    # Gestor apenas: GET/PUT/PATCH/DELETE de um usuário (DELETE = desativar)
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
]
