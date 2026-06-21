from rest_framework import serializers

from .models import Conta, Despesa, Produto, StatusConta, CategoriaDespesa


class ContaSerializer(serializers.ModelSerializer):
    reserva_codigo = serializers.CharField(source='reserva.codigo', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    despesas_count = serializers.IntegerField(source='despesas.count', read_only=True)

    class Meta:
        model = Conta
        fields = [
            'id', 'reserva', 'reserva_codigo', 'dataAbertura', 'dataFechamento',
            'totalAcumulado', 'status', 'status_display', 'nomeTitular',
            'cpfTitular', 'despesas_count', 'dataCriacao', 'dataAtualizacao',
        ]
        read_only_fields = [
            'id', 'dataAbertura', 'totalAcumulado', 'dataCriacao', 'dataAtualizacao',
        ]


class DespesaSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    produto_nome = serializers.CharField(source='produto.nome', read_only=True, default=None)

    class Meta:
        model = Despesa
        fields = [
            'id', 'conta', 'descricao', 'valor', 'categoria', 'categoria_display',
            'produto', 'produto_nome', 'dataHora', 'dataCriacao', 'dataAtualizacao',
        ]
        read_only_fields = ['id', 'dataHora', 'dataCriacao', 'dataAtualizacao']


class DespesaCreateSerializer(serializers.Serializer):
    conta = serializers.IntegerField()
    descricao = serializers.CharField(max_length=255)
    valor = serializers.DecimalField(max_digits=10, decimal_places=2)
    categoria = serializers.ChoiceField(choices=CategoriaDespesa.choices)
    produto = serializers.IntegerField(required=False, allow_null=True, default=None)

    def validate_conta(self, value):
        from django.shortcuts import get_object_or_404
        conta = get_object_or_404(Conta, pk=value)
        if conta.status != StatusConta.ABERTA:
            raise serializers.ValidationError('Somente contas ABERTAS podem receber despesas.')
        return conta

    def validate_produto(self, value):
        if value is None:
            return None
        from django.shortcuts import get_object_or_404
        produto = get_object_or_404(Produto, pk=value, ativo=True)
        return produto

    def validate(self, attrs):
        conta = attrs['conta']
        reserva = conta.reserva
        if reserva.status != 'CHIN':
            raise serializers.ValidationError(
                'Só é possível lançar despesas em reservas com CHECK_IN.'
            )
        return attrs


class ProdutoSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    class Meta:
        model = Produto
        fields = [
            'id', 'nome', 'descricao', 'categoria', 'categoria_display',
            'precoAtual', 'ativo', 'dataCriacao', 'dataAtualizacao',
        ]
        read_only_fields = ['id', 'dataCriacao', 'dataAtualizacao']
