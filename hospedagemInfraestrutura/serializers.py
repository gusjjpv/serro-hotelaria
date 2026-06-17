import re

from rest_framework import serializers

from controleDeAcesso.serializers import EnderecoSerializer
from .models import Hotel
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
