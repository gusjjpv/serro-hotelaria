import re
from datetime import date

from rest_framework import serializers

from controleDeAcesso.serializers import EnderecoSerializer
from .models import Hotel, CategoriaQuarto, Quarto, StatusQuarto, Reserva, StatusReserva
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
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True)
    status_changed_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Quarto
        fields = [
            'id', 'hotel', 'numero', 'andar', 'categoria', 'categoria_nome',
            'status', 'status_display', 'status_changed_at', 'status_changed_by',
            'status_changed_by_name', 'dataCriacao', 'dataAtualizacao',
        ]
        read_only_fields = [
            'id', 'hotel', 'status_changed_at', 'status_changed_by',
            'status_changed_by_name', 'dataCriacao', 'dataAtualizacao',
        ]

    def get_status_changed_by_name(self, obj):
        if obj.status_changed_by:
            return obj.status_changed_by.username
        return None

    def validate_status(self, value):
        if value not in StatusQuarto.values:
            raise serializers.ValidationError(f'Status inválido. Opções: {", ".join(StatusQuarto.values)}')
        return value


class QuartoStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=StatusQuarto.choices)

    def validate_status(self, value):
        instance = self.instance
        if instance and instance.status == StatusQuarto.OCUPADO and value != StatusQuarto.LIMPEZA:
            raise serializers.ValidationError(
                'Quartos ocupados só podem ser alterados para "Em Limpeza".'
            )
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


class CategoriaDisponivelSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nome = serializers.CharField()
    descricao = serializers.CharField()
    capacidade = serializers.IntegerField()
    precoBase = serializers.DecimalField(max_digits=10, decimal_places=2)
    quartosDisponiveis = serializers.IntegerField()
    valorTotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    dias = serializers.IntegerField()


class ReservaSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    hotel_nome = serializers.CharField(source='hotel.nome', read_only=True)
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True)
    quarto_numero = serializers.CharField(source='quarto.numero', read_only=True, allow_null=True)

    class Meta:
        model = Reserva
        fields = [
            'id', 'codigo', 'hospede', 'hotel', 'hotel_nome',
            'categoria', 'categoria_nome', 'quarto', 'quarto_numero',
            'dataEntrada', 'dataSaida', 'numHospedes', 'valorTotal',
            'status', 'status_display', 'dataReserva', 'dataAtualizacao',
        ]
        read_only_fields = [
            'id', 'codigo', 'status', 'dataReserva', 'dataAtualizacao',
        ]


class ReservaCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reserva
        fields = [
            'hotel', 'categoria', 'dataEntrada', 'dataSaida',
            'numHospedes', 'valorTotal',
        ]

    def validate(self, attrs):
        dataEntrada = attrs.get('dataEntrada')
        dataSaida = attrs.get('dataSaida')

        if dataEntrada and dataSaida and dataSaida <= dataEntrada:
            raise serializers.ValidationError(
                {'dataSaida': 'A data de saída deve ser posterior à data de entrada.'}
            )

        if dataEntrada and dataEntrada < date.today():
            raise serializers.ValidationError(
                {'dataEntrada': 'A data de entrada não pode ser no passado.'}
            )

        categoria = attrs.get('categoria')
        hotel = attrs.get('hotel')

        if categoria and hotel and categoria.hotel_id != hotel.id:
            raise serializers.ValidationError(
                {'categoria': 'A categoria não pertence ao hotel informado.'}
            )

        return attrs

    def create(self, validated_data):
        hospede = self.context['request'].user
        validated_data['hospede'] = hospede
        return super().create(validated_data)
