from rest_framework import serializers
from django.db.models import Q
from .models import Tarifa, TipoTemporada


class TarifaSerializer(serializers.ModelSerializer):
    tipoTemporada_display = serializers.CharField(
        source='get_tipoTemporada_display', read_only=True,
    )

    class Meta:
        model = Tarifa
        fields = [
            'id', 'categoria', 'valorDiaria', 'dataInicio', 'dataFim',
            'tipoTemporada', 'tipoTemporada_display',
            'dataCriacao', 'dataAtualizacao',
        ]
        read_only_fields = ['id', 'dataCriacao', 'dataAtualizacao']

    def validate(self, attrs):
        dataInicio = attrs.get('dataInicio')
        dataFim = attrs.get('dataFim')
        categoria = attrs.get('categoria')

        if dataInicio and dataFim and dataFim < dataInicio:
            raise serializers.ValidationError(
                {'dataFim': 'dataFim deve ser igual ou posterior a dataInicio.'}
            )

        if categoria and dataInicio and dataFim:
            instance = self.instance
            overlapping = Tarifa.objects.filter(
                categoria=categoria,
                dataInicio__lte=dataFim,
                dataFim__gte=dataInicio,
            )
            if instance:
                overlapping = overlapping.exclude(pk=instance.pk)

            if overlapping.exists():
                raise serializers.ValidationError(
                    'Ja existe uma tarifa vigente para esta categoria no periodo informado.'
                )

        return attrs
