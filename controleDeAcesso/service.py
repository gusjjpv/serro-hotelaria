import logging

from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Usuario, Endereco, Atendente, Supervisor, Hospede

logger = logging.getLogger(__name__)


def criar_usuario(data):
    endereco = Endereco.objects.create(**data.pop('endereco'))
    senha = data.pop('senha')
    data.pop('role', None)

    usuario = Hospede.objects.create(
        endereco=endereco,
        role=Usuario.Role.HOSPEDE,
        **data,
    )
    if senha:
        usuario.set_password(senha)
    usuario.save()
    return usuario


def criar_usuario_gestor(data):
    endereco = Endereco.objects.create(**data.pop('endereco'))
    senha = data.pop('senha', None)
    data.pop('role', None)

    usuario = Usuario.objects.create(
        endereco=endereco,
        role=Usuario.Role.GESTOR,
        **data,
    )
    if senha:
        usuario.set_password(senha)
    usuario.save()
    return usuario


def criar_usuario_por_gestor(data, hotel=None):
    endereco = Endereco.objects.create(**data.pop('endereco'))
    senha = data.pop('senha', None)
    role = data.pop('role')

    Model = Atendente if role == 'AT' else Supervisor
    usuario = Model.objects.create(
        endereco=endereco,
        hotel=hotel,
        role=role,
        **data,
    )
    if senha:
        usuario.set_password(senha)
    usuario.save()
    return usuario


def gerar_tokens(usuario):
    refresh = RefreshToken.for_user(usuario)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def enviar_email_boas_vindas(usuario):
    try:
        send_mail(
            subject='Bem-vindo ao Serro Hotelaria',
            message=f'Olá {usuario.first_name},\n\nSeu cadastro foi realizado com sucesso!',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[usuario.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.warning(f'Falha ao enviar email de boas-vindas para {usuario.email}: {e}')


def inativar_usuario(usuario):
    usuario.is_active = False
    usuario.save()
    return usuario


def reativar_usuario(usuario):
    usuario.is_active = True
    usuario.save()
    return usuario
