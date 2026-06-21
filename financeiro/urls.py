from django.urls import path
from .views import (
    DespesaCreateView, ContaExtratoView,
    ProdutoListCreateView, ProdutoDetailView,
)

urlpatterns = [
    path('despesas/', DespesaCreateView.as_view(), name='despesa-create'),
    path('contas/<int:pk>/extrato/', ContaExtratoView.as_view(), name='conta-extrato'),
    path('produtos/', ProdutoListCreateView.as_view(), name='produto-list-create'),
    path('produtos/<int:pk>/', ProdutoDetailView.as_view(), name='produto-detail'),
]
