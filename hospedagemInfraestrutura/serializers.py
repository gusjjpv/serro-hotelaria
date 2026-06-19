import re

from rest_framework import serializers

from controleDeAcesso.serializers import EnderecoSerializer
from .models import Hotel, CategoriaQuarto, Quarto, StatusQuarto
from .service import validar_cnpj, formatar_cnpj


class HotelSerializer(serializers.ModelSerializer):
    endereco = EnderecoSerializer()

    class Meta:
        model = Hotel
        fields = [
            'id', 'nome', 'cnpj', 'endereco', 'telefoneContato',
            'emailContato', 'dataCriacao', 'dataAtualizacao',
        ]
        read_only_fields = ['id', 'dataCriacao', 'dataAtualizacao']

    def validate_cnpj(self, value):
        digits = re.sub(r'[^\d]', '', value)
        try:
            validar_cnpj(digits)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        return formatar_cnpj(digits)

    def create(self, validated_data):
        from .service import criar_hotel
        try:
            return criar_hotel(validated_data, validated_data.pop('gestor'))
        except ValueError as e:
            raise serializers.ValidationError(str(e))

    def update(self, instance, validated_data):
        endereco_data = validated_data.pop('endereco', None)
        if endereco_data:
            for attr, value in endereco_data.items():
                setattr(instance.endereco, attr, value)
            instance.endereco.save()

        cnpj = validated_data.pop('cnpj', None)
        if cnpj:
            instance.cnpj = cnpj

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class CategoriaQuartoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaQuarto
        fields = [
            'id', 'hotel', 'nome', 'descricao', 'capacidade', 'precoBase',
            'dataCriacao', 'dataAtualizacao',
        ]
        read_only_fields = ['id', 'hotel', 'dataCriacao', 'dataAtualizacao']


class QuartoSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Quarto
        fields = [
            'id', 'hotel', 'numero', 'andar', 'categoria', 'status',
            'status_display', 'dataCriacao', 'dataAtualizacao',
        ]
        read_only_fields = ['id', 'hotel', 'dataCriacao', 'dataAtualizacao']

    def validate_status(self, value):
        if value not in StatusQuarto.values:
            raise serializers.ValidationError(f'Status inválido. Opções: {", ".join(StatusQuarto.values)}')
        return value


class HotelPublicSerializer(serializers.ModelSerializer):
    cidade = serializers.CharField(source='endereco.cidade', read_only=True)

    class Meta:
        model = Hotel
        fields = ['id', 'nome', 'cidade', 'telefoneContato', 'emailContato']


class CategoriaPublicSerializer(serializers.ModelSerializer):
    quartosDisponiveis = serializers.SerializerMethodField()

    class Meta:
        model = CategoriaQuarto
        fields = ['id', 'nome', 'descricao', 'capacidade', 'precoBase', 'quartosDisponiveis']

    def get_quartosDisponiveis(self, obj):
        return obj.quartos.filter(status=StatusQuarto.DISPONIVEL).count()


class HotelPublicDetailSerializer(serializers.ModelSerializer):
    cidade = serializers.CharField(source='endereco.cidade', read_only=True)
    enderecoCompleto = serializers.SerializerMethodField()
    categorias = CategoriaPublicSerializer(many=True, read_only=True)
    totalQuartos = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = [
            'id', 'nome', 'cidade', 'enderecoCompleto',
            'telefoneContato', 'emailContato', 'categorias', 'totalQuartos',
        ]

    def get_enderecoCompleto(self, obj):
        e = obj.endereco
        parts = [e.rua, e.numero]
        if e.complemento:
            parts.append(e.complemento)
        parts.append(f"{e.bairro} - {e.cidade}/{e.estado}")
        parts.append(f"CEP: {e.cep}")
        return ', '.join(parts)

    def get_totalQuartos(self, obj):
        return obj.quartos.filter(status=StatusQuarto.DISPONIVEL).count()
