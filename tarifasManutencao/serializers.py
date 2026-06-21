from rest_framework import serializers
from .models import Tarifa, TipoTemporada, Manutencao, MotivoManutencao, StatusManutencao


class TarifaSerializer(serializers.ModelSerializer):
    tipoTemporada_display = serializers.CharField(
        source='get_tipoTemporada_display', read_only=True,
    )
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True)

    class Meta:
        model = Tarifa
        fields = [
            'id', 'categoria', 'categoria_nome', 'valorDiaria', 'dataInicio', 'dataFim',
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


class ManutencaoSerializer(serializers.ModelSerializer):
    motivo_display = serializers.CharField(source='get_motivo_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    quarto_numero = serializers.CharField(source='quarto.numero', read_only=True)
    hotel_nome = serializers.CharField(source='hotel.nome', read_only=True)

    class Meta:
        model = Manutencao
        fields = [
            'id', 'quarto', 'quarto_numero', 'hotel', 'hotel_nome',
            'dataInicio', 'dataFim', 'motivo', 'motivo_display',
            'descricao', 'status', 'status_display', 'statusAnterior',
            'dataCriacao', 'dataAtualizacao',
        ]
        read_only_fields = [
            'id', 'status', 'statusAnterior', 'dataCriacao', 'dataAtualizacao',
        ]


class ManutencaoCreateSerializer(serializers.Serializer):
    quarto = serializers.IntegerField()
    hotel = serializers.IntegerField()
    dataInicio = serializers.DateField()
    dataFim = serializers.DateField()
    motivo = serializers.ChoiceField(choices=MotivoManutencao.choices)
    descricao = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_quarto(self, value):
        from django.shortcuts import get_object_or_404
        from hospedagemInfraestrutura.models import Quarto, StatusQuarto
        quarto = get_object_or_404(Quarto, pk=value)
        if quarto.status == StatusQuarto.OCUPADO:
            raise serializers.ValidationError(
                'Não é possível bloquear quarto com status OCUPADO.'
            )
        return quarto

    def validate_hotel(self, value):
        from django.shortcuts import get_object_or_404
        from hospedagemInfraestrutura.models import Hotel
        return get_object_or_404(Hotel, pk=value)

    def validate(self, attrs):
        dataInicio = attrs['dataInicio']
        dataFim = attrs['dataFim']
        quarto = attrs['quarto']

        if dataFim < dataInicio:
            raise serializers.ValidationError(
                {'dataFim': 'dataFim deve ser igual ou posterior a dataInicio.'}
            )

        overlapping = Manutencao.objects.filter(
            quarto=quarto,
            status__in=[StatusManutencao.AGENDADA, StatusManutencao.EM_ANDAMENTO],
            dataInicio__lt=dataFim,
            dataFim__gt=dataInicio,
        )
        if overlapping.exists():
            raise serializers.ValidationError(
                'Já existe uma manutenção agendada/em andamento para este quarto no período informado.'
            )

        return attrs
