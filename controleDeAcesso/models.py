from django.db import models, transaction
from django.contrib.auth.models import AbstractUser


class Endereco(models.Model):
    rua = models.CharField(max_length=100)
    numero = models.CharField(max_length=5)
    complemento = models.CharField(max_length=100, blank=True, default='')
    bairro = models.CharField(max_length=100)
    cidade = models.CharField(max_length=100)
    estado = models.CharField(max_length=100)
    cep = models.CharField(max_length=8)

    class Meta:
        verbose_name = 'Endereço'
        verbose_name_plural = 'Endereços'

    def __str__(self):
        return f"{self.rua}, {self.numero} - {self.bairro}, {self.cidade} - {self.estado}, CEP: {self.cep}"


class Usuario(AbstractUser):
    username = models.CharField(max_length=20, unique=True)
    telefone = models.CharField(max_length=14, unique=True)
    dataNascimento = models.DateField()
    genero = models.CharField(max_length=10)
    endereco = models.ForeignKey(Endereco, on_delete=models.PROTECT)
    cpf = models.CharField(max_length=11, unique=True)
    dataAtualizacao = models.DateTimeField(auto_now=True)
    hotel = models.ForeignKey(
        'hospedagemInfraestrutura.Hotel',
        null=True, blank=True,
        on_delete=models.SET_NULL,
    )

    class Role(models.TextChoices):
        SUPERVISOR = 'SV', 'Supervisor'
        GESTOR = 'GE', 'Gestor'
        ATENDENTE = 'AT', 'Atendente'
        HOSPEDE = 'HO', 'Hóspede'

    role = models.CharField(max_length=2, choices=Role.choices)

    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'

    def __str__(self):
        return self.username


class Hospede(Usuario):
    pontosFidelidade = models.IntegerField(default=0)

    class Meta:
        verbose_name = 'Hóspede'
        verbose_name_plural = 'Hóspedes'

    def __str__(self):
        return f"{self.username} - Pontos: {self.pontosFidelidade}"


class Atendente(Usuario):
    numeroDeCadastro = models.CharField(max_length=20, unique=True)

    def save(self, *args, **kwargs):
        if not self.numeroDeCadastro:
            from django.db.models import IntegerField
            from django.db.models.functions import Substr
            from django.db.models.functions import Cast
            with transaction.atomic():
                ultimo = (
                    Atendente.objects
                    .select_for_update()
                    .filter(numeroDeCadastro__startswith='CAD')
                    .annotate(numerico=Cast(Substr('numeroDeCadastro', 4), output_field=IntegerField()))
                    .order_by('-numerico')
                    .values_list('numeroDeCadastro', flat=True)
                    .first()
                )
                if ultimo:
                    sequencia = int(ultimo[3:]) + 1
                else:
                    sequencia = 1
                self.numeroDeCadastro = f'CAD{sequencia:03d}'
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Atendente'
        verbose_name_plural = 'Atendentes'

    def __str__(self):
        return f"{self.username} - Cadastro: {self.numeroDeCadastro}"


class Supervisor(Usuario):

    class Meta:
        verbose_name = 'Supervisor'
        verbose_name_plural = 'Supervisores'

    def __str__(self):
        return f"{self.username} - Supervisor"


class Gestor(Supervisor):

    class Meta:
        verbose_name = 'Gestor'
        verbose_name_plural = 'Gestores'

    def __str__(self):
        return f"{self.username} - Gestor"
