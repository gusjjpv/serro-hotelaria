from datetime import date, timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Q, Count, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from controleDeAcesso.permissions import IsGestor, IsSupervisor, IsAtendente
from .models import Hotel, CategoriaQuarto, Quarto, StatusQuarto, Reserva, StatusReserva, ALLOWED_QUARTO_TRANSITIONS, ATENDENTE_ALLOWED_TRANSITIONS
from .serializers import (
    HotelSerializer, CategoriaQuartoSerializer, QuartoSerializer,
    QuartoStatusSerializer, HotelPublicSerializer, HotelPublicDetailSerializer,
    CategoriaDisponivelSerializer, ReservaSerializer, ReservaCreateSerializer,
    ReservaCancelSerializer, ReservaCheckInSerializer,
    ReservaCheckInPresencialSerializer, ReservaCheckOutSerializer,
)


class HotelRegisterView(generics.CreateAPIView):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    permission_classes = [IsAuthenticated, IsGestor]

    def perform_create(self, serializer):
        serializer.save(gestor=self.request.user)


class HotelManageView(generics.RetrieveUpdateAPIView):
    serializer_class = HotelSerializer
    permission_classes = [IsAuthenticated, IsGestor]

    def get_object(self):
        return get_object_or_404(Hotel, gestor=self.request.user)


class CategoriaQuartoListCreateView(generics.ListCreateAPIView):
    serializer_class = CategoriaQuartoSerializer
    permission_classes = [IsAuthenticated, IsSupervisor]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'GE':
            return CategoriaQuarto.objects.filter(hotel__gestor=user)
        return CategoriaQuarto.objects.filter(hotel=user.hotel)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'GE':
            hotel = get_object_or_404(Hotel, gestor=user)
        else:
            hotel = user.hotel
        serializer.save(hotel=hotel)


class CategoriaQuartoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategoriaQuartoSerializer
    permission_classes = [IsAuthenticated, IsSupervisor]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'GE':
            return CategoriaQuarto.objects.filter(hotel__gestor=user)
        return CategoriaQuarto.objects.filter(hotel=user.hotel)


class QuartoListCreateView(generics.ListCreateAPIView):
    serializer_class = QuartoSerializer
    permission_classes = [IsAuthenticated, IsSupervisor]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'GE':
            return Quarto.objects.filter(hotel__gestor=user)
        return Quarto.objects.filter(hotel=user.hotel)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'GE':
            hotel = get_object_or_404(Hotel, gestor=user)
        else:
            hotel = user.hotel
        serializer.save(hotel=hotel)


class QuartoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = QuartoSerializer
    permission_classes = [IsAuthenticated, IsSupervisor]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'GE':
            return Quarto.objects.filter(hotel__gestor=user)
        return Quarto.objects.filter(hotel=user.hotel)


class QuartoStatusUpdateView(generics.UpdateAPIView):
    serializer_class = QuartoStatusSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'GE':
            return Quarto.objects.filter(hotel__gestor=user)
        return Quarto.objects.filter(hotel=user.hotel)

    def perform_update(self, serializer):
        instance = self.get_object()
        new_status = serializer.validated_data['status']
        old_status = instance.status
        user = self.request.user

        if user.role == 'AT':
            allowed = ATENDENTE_ALLOWED_TRANSITIONS.get(old_status, [])
        else:
            allowed = ALLOWED_QUARTO_TRANSITIONS.get(old_status, [])

        if new_status not in allowed:
            raise serializers.ValidationError(
                {'status': f'Não é permitido alterar de "{instance.get_status_display()}" para "{dict(StatusQuarto.choices).get(new_status)}".'}
            )

        instance.status = new_status
        instance.status_changed_at = timezone.now()
        instance.status_changed_by = user
        instance.save(update_fields=['status', 'status_changed_at', 'status_changed_by'])


class QuartoDisponivelListView(generics.ListAPIView):
    serializer_class = QuartoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Quarto.objects.filter(status='DISP')


class HotelPublicListView(generics.ListAPIView):
    serializer_class = HotelPublicSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Hotel.objects.select_related('endereco').all()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(nome__icontains=search) | Q(endereco__cidade__icontains=search)
            )
        return qs


class HotelPublicDetailView(generics.RetrieveAPIView):
    serializer_class = HotelPublicDetailSerializer
    permission_classes = [AllowAny]
    queryset = Hotel.objects.select_related('endereco').prefetch_related('categorias__quartos')


class HotelDisponibilidadeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        hotel = get_object_or_404(Hotel, pk=pk)

        try:
            data_entrada = date.fromisoformat(request.query_params.get('dataEntrada', ''))
            data_saida = date.fromisoformat(request.query_params.get('dataSaida', ''))
            num_hospedes = int(request.query_params.get('numHospedes', 1))
        except (TypeError, ValueError):
            return Response({'error': 'Parâmetros dataEntrada, dataSaida e numHospedes são obrigatórios.'}, status=400)

        dias = (data_saida - data_entrada).days
        if dias <= 0:
            return Response({'error': 'Período de estadia inválido.'}, status=400)

        categorias = hotel.categorias.filter(capacidade__gte=num_hospedes)

        from tarifasManutencao.models import Tarifa

        results = []
        for cat in categorias:
            total_rooms = cat.quartos.filter(status=StatusQuarto.DISPONIVEL).count()
            overlapping = Reserva.objects.filter(
                categoria=cat,
                status=StatusReserva.CONFIRMADA,
                dataEntrada__lt=data_saida,
                dataSaida__gt=data_entrada,
            ).count()

            quartos_disponiveis = max(0, total_rooms - overlapping)
            if quartos_disponiveis == 0:
                continue

            valor_total = Decimal('0.00')
            current = data_entrada
            while current < data_saida:
                tarifa = Tarifa.objects.filter(
                    categoria=cat,
                    dataInicio__lte=current,
                    dataFim__gte=current,
                ).order_by('-dataInicio').first()

                valor_total += tarifa.valorDiaria if tarifa else cat.precoBase
                current += timedelta(days=1)

            results.append({
                'id': cat.id,
                'nome': cat.nome,
                'descricao': cat.descricao,
                'capacidade': cat.capacidade,
                'precoBase': cat.precoBase,
                'quartosDisponiveis': quartos_disponiveis,
                'valorTotal': valor_total,
                'dias': dias,
            })

        serializer = CategoriaDisponivelSerializer(results, many=True)
        return Response(serializer.data)


class ReservaListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ReservaCreateSerializer
        return ReservaSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ('GE', 'SV', 'AT'):
            if user.role == 'GE':
                return Reserva.objects.filter(hotel__gestor=user)
            return Reserva.objects.filter(hotel=user.hotel)
        return Reserva.objects.filter(hospede=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from .service import enviar_email_confirmacao_reserva
        with transaction.atomic():
            reserva = serializer.save()
            enviar_email_confirmacao_reserva(reserva)
        return Response(
            ReservaSerializer(reserva).data,
            status=status.HTTP_201_CREATED,
        )


class ReservaDetailView(generics.RetrieveAPIView):
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        if user.role in ('GE', 'SV', 'AT'):
            if user.role == 'GE':
                return get_object_or_404(
                    Reserva, pk=self.kwargs['pk'], hotel__gestor=user,
                )
            return get_object_or_404(
                Reserva, pk=self.kwargs['pk'], hotel=user.hotel,
            )
        return get_object_or_404(
            Reserva, pk=self.kwargs['pk'], hospede=user,
        )


class ReservaCancelView(generics.UpdateAPIView):
    serializer_class = ReservaCancelSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        if user.role in ('GE', 'SV', 'AT'):
            if user.role == 'GE':
                return get_object_or_404(
                    Reserva, pk=self.kwargs['pk'], hotel__gestor=user,
                )
            return get_object_or_404(
                Reserva, pk=self.kwargs['pk'], hotel=user.hotel,
            )
        return get_object_or_404(
            Reserva, pk=self.kwargs['pk'], hospede=user,
        )

    def update(self, request, *args, **kwargs):
        reserva = self.get_object()
        serializer = self.get_serializer(reserva, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        from .service import enviar_email_cancelamento_reserva
        with transaction.atomic():
            reserva = serializer.save()
            enviar_email_cancelamento_reserva(reserva)
        return Response(ReservaSerializer(reserva).data)


class ReservaCheckInView(generics.UpdateAPIView):
    serializer_class = ReservaCheckInSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        if user.role in ('GE', 'SV', 'AT'):
            if user.role == 'GE':
                return get_object_or_404(
                    Reserva, pk=self.kwargs['pk'], hotel__gestor=user,
                )
            return get_object_or_404(
                Reserva, pk=self.kwargs['pk'], hotel=user.hotel,
            )
        return get_object_or_404(
            Reserva, pk=self.kwargs['pk'], hospede=user,
        )

    def update(self, request, *args, **kwargs):
        reserva = self.get_object()
        serializer = self.get_serializer(reserva, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        from .service import enviar_email_checkin_reserva
        from financeiro.service import criar_conta
        with transaction.atomic():
            reserva = serializer.save()
            criar_conta(reserva)
            enviar_email_checkin_reserva(reserva)
        return Response(ReservaSerializer(reserva).data)


class ReservaCheckInPresencialView(generics.UpdateAPIView):
    serializer_class = ReservaCheckInPresencialSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        if user.role in ('GE', 'SV', 'AT'):
            if user.role == 'GE':
                return get_object_or_404(
                    Reserva, pk=self.kwargs['pk'], hotel__gestor=user,
                )
            return get_object_or_404(
                Reserva, pk=self.kwargs['pk'], hotel=user.hotel,
            )
        return get_object_or_404(
            Reserva, pk=self.kwargs['pk'], hospede=user,
        )

    def update(self, request, *args, **kwargs):
        reserva = self.get_object()
        serializer = self.get_serializer(reserva, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        from .service import enviar_email_checkin_reserva
        from financeiro.service import criar_conta
        with transaction.atomic():
            reserva = serializer.save()
            criar_conta(reserva)
            enviar_email_checkin_reserva(reserva)
        return Response(ReservaSerializer(reserva).data)


class ReservaCheckOutView(generics.UpdateAPIView):
    serializer_class = ReservaCheckOutSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        if user.role in ('GE', 'SV', 'AT'):
            if user.role == 'GE':
                return get_object_or_404(
                    Reserva, pk=self.kwargs['pk'], hotel__gestor=user,
                )
            return get_object_or_404(
                Reserva, pk=self.kwargs['pk'], hotel=user.hotel,
            )
        return get_object_or_404(
            Reserva, pk=self.kwargs['pk'], hospede=user,
        )

    def update(self, request, *args, **kwargs):
        reserva = self.get_object()
        serializer = self.get_serializer(reserva, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        from .service import enviar_email_checkout_reserva
        from financeiro.service import fechar_conta
        with transaction.atomic():
            reserva = serializer.save()
            fechar_conta(reserva)
            enviar_email_checkout_reserva(reserva)
        return Response(ReservaSerializer(reserva).data)


class PainelDoDiaView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        if user.role == 'GE':
            hoteis = Hotel.objects.filter(gestor=user)
        elif user.role in ('SV', 'AT'):
            hoteis = Hotel.objects.filter(pk=user.hotel_id)
        else:
            hoteis = Hotel.objects.filter(reservas__hospede=user).distinct()

        hoje = timezone.now().date()
        amanha = hoje + timedelta(days=1)

        reservas = Reserva.objects.filter(hotel__in=hoteis).select_related(
            'hospede', 'hotel', 'categoria', 'quarto',
        )

        checkins = reservas.filter(
            dataEntrada__in=[hoje, amanha],
            status__in=[StatusReserva.PENDENTE, StatusReserva.CONFIRMADA],
        )
        checkouts = reservas.filter(
            dataSaida__in=[hoje, amanha],
            status=StatusReserva.CHECK_IN,
        )

        def serialize_checkin(r):
            return {
                'id': r.id,
                'codigo': r.codigo,
                'hospede_nome': r.hospede.get_full_name() or r.hospede.username,
                'quarto_numero': r.quarto.numero if r.quarto else None,
                'categoria': r.categoria.nome,
                'dataEntrada': r.dataEntrada.isoformat(),
                'status': r.status,
            }

        def serialize_checkout(r):
            return {
                'id': r.id,
                'codigo': r.codigo,
                'hospede_nome': r.hospede.get_full_name() or r.hospede.username,
                'quarto_numero': r.quarto.numero if r.quarto else None,
                'categoria': r.categoria.nome,
                'dataSaida': r.dataSaida.isoformat(),
                'status': r.status,
            }

        return Response({
            'checkins_previstos': [serialize_checkin(r) for r in checkins],
            'checkouts_previstos': [serialize_checkout(r) for r in checkouts],
        })


class DashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def _get_hoteis(self, user):
        if user.role == 'GE':
            return Hotel.objects.filter(gestor=user)
        if user.role in ('SV', 'AT'):
            return Hotel.objects.filter(pk=user.hotel_id)
        return Hotel.objects.none()

    def get(self, request, *args, **kwargs):
        user = request.user
        if user.role not in ('GE', 'SV', 'AT'):
            return Response(
                {'detail': 'Sem permissão para acessar o dashboard.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        hoteis = self._get_hoteis(user)
        hoje = timezone.now().date()

        quartos_agg = Quarto.objects.filter(hotel__in=hoteis).aggregate(
            total=Count('id'),
            ocupados=Count('id', filter=Q(status=StatusQuarto.OCUPADO)),
            disponiveis=Count('id', filter=Q(status=StatusQuarto.DISPONIVEL)),
            em_limpeza=Count('id', filter=Q(status=StatusQuarto.LIMPEZA)),
            manutencao=Count('id', filter=Q(status=StatusQuarto.MANUTENCAO)),
        )

        reservas_hoje = Reserva.objects.filter(hotel__in=hoteis)

        checkins_pendentes = reservas_hoje.filter(
            dataEntrada=hoje,
            status__in=[StatusReserva.PENDENTE, StatusReserva.CONFIRMADA],
        ).count()

        checkouts_pendentes = reservas_hoje.filter(
            dataSaida=hoje,
            status=StatusReserva.CHECK_IN,
        ).count()

        from financeiro.models import Conta
        faturamento = Conta.objects.filter(
            reserva__hotel__in=hoteis,
            dataAbertura__date=hoje,
            status__in=['ABER', 'PAGA', 'FECH'],
        ).aggregate(total=Sum('totalAcumulado'))['total'] or Decimal('0.00')

        reservas_ativas = Reserva.objects.filter(
            hotel__in=hoteis,
            status__in=[StatusReserva.CONFIRMADA, StatusReserva.CHECK_IN],
        ).select_related('hospede', 'quarto', 'categoria').order_by('dataEntrada')[:20]

        return Response({
            'metricas': {
                'quartosOcupados': quartos_agg['ocupados'],
                'quartosTotal': quartos_agg['total'],
                'quartosDisponiveis': quartos_agg['disponiveis'],
                'quartosEmLimpeza': quartos_agg['em_limpeza'],
                'quartosManutencao': quartos_agg['manutencao'],
                'checkinsPendentes': checkins_pendentes,
                'checkoutsPendentes': checkouts_pendentes,
                'faturamentoDoDia': f'{faturamento:.2f}',
            },
            'reservasAtivas': [
                {
                    'id': r.id,
                    'codigo': r.codigo,
                    'hospedeNome': r.hospede.get_full_name() or r.hospede.username,
                    'quartoNumero': r.quarto.numero if r.quarto else None,
                    'categoria': r.categoria.nome,
                    'dataEntrada': r.dataEntrada.isoformat(),
                    'dataSaida': r.dataSaida.isoformat(),
                    'status': r.status,
                    'statusDisplay': r.get_status_display(),
                }
                for r in reservas_ativas
            ],
        })


class RelatorioFaturamentoView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsGestor]

    def get(self, request, *args, **kwargs):
        user = request.user
        hoteis = Hotel.objects.filter(gestor=user)

        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')

        if not data_inicio or not data_fim:
            return Response(
                {'detail': 'Parâmetros data_inicio e data_fim são obrigatórios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            data_inicio = date.fromisoformat(data_inicio)
            data_fim = date.fromisoformat(data_fim)
        except ValueError:
            return Response(
                {'detail': 'Formato de data inválido. Use YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if data_fim < data_inicio:
            return Response(
                {'detail': 'data_fim deve ser igual ou posterior a data_inicio.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservas = Reserva.objects.filter(
            hotel__in=hoteis,
            dataEntrada__gte=data_inicio,
            dataSaida__lte=data_fim,
        ).exclude(
            status=StatusReserva.CANCELADA,
        ).select_related('hospede', 'quarto', 'categoria')

        resumo = reservas.aggregate(
            totalReservas=Count('id'),
            receitaTotal=Sum('valorTotal'),
        )

        total_diarias = sum(
            (r.dataSaida - r.dataEntrada).days for r in reservas
        )

        receita = resumo['receitaTotal'] or Decimal('0.00')

        return Response({
            'filtro': {
                'dataInicio': data_inicio.isoformat(),
                'dataFim': data_fim.isoformat(),
            },
            'resumo': {
                'totalReservas': resumo['totalReservas'],
                'totalDiarias': total_diarias,
                'receitaTotal': f'{receita:.2f}',
            },
            'reservas': [
                {
                    'id': r.id,
                    'codigo': r.codigo,
                    'hospedeNome': r.hospede.get_full_name() or r.hospede.username,
                    'quartoNumero': r.quarto.numero if r.quarto else None,
                    'categoria': r.categoria.nome,
                    'dataEntrada': r.dataEntrada.isoformat(),
                    'dataSaida': r.dataSaida.isoformat(),
                    'numDias': (r.dataSaida - r.dataEntrada).days,
                    'valorTotal': f'{r.valorTotal:.2f}',
                }
                for r in reservas
            ],
        })
