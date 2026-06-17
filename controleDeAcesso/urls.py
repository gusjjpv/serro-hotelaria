from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, GestorRegisterView, CustomTokenObtainPairView, MeView, UserListCreateView, UserDetailView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('register/gestor/', GestorRegisterView.as_view(), name='auth-register-gestor'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('users/', UserListCreateView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
]
