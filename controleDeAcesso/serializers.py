from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import Usuario, Endereco
from .service import criar_usuario, criar_usuario_gestor, gerar_tokens, enviar_email_boas_vindas


class EnderecoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Endereco
        fields = ['rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep']


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    username = serializers.CharField(max_length=20)
    telefone = serializers.CharField(max_length=14)
    dataNascimento = serializers.DateField()
    genero = serializers.CharField(max_length=10)
    cpf = serializers.CharField(max_length=11)
    senha = serializers.CharField(write_only=True, min_length=8)
    endereco = EnderecoSerializer()

    def validate_email(self, value):
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email já está cadastrado.")
        return value

    def validate_username(self, value):
        if Usuario.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este username já está em uso.")
        return value

    def validate_cpf(self, value):
        if Usuario.objects.filter(cpf=value).exists():
            raise serializers.ValidationError("Este CPF já está cadastrado.")
        return value

    def validate_telefone(self, value):
        if Usuario.objects.filter(telefone=value).exists():
            raise serializers.ValidationError("Este telefone já está cadastrado.")
        return value

    def create(self, validated_data):
        usuario = criar_usuario(validated_data)
        enviar_email_boas_vindas(usuario)
        return usuario

    def to_representation(self, instance):
        tokens = gerar_tokens(instance)
        return {
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user': {
                'id': instance.id,
                'email': instance.email,
                'username': instance.username,
                'first_name': instance.first_name,
                'last_name': instance.last_name,
                'role': instance.role,
            }
        }


class GestorRegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    username = serializers.CharField(max_length=20)
    telefone = serializers.CharField(max_length=14)
    dataNascimento = serializers.DateField()
    genero = serializers.CharField(max_length=10)
    cpf = serializers.CharField(max_length=11)
    senha = serializers.CharField(write_only=True, min_length=8)
    endereco = EnderecoSerializer()

    def validate_email(self, value):
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email já está cadastrado.")
        return value

    def validate_username(self, value):
        if Usuario.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este username já está em uso.")
        return value

    def validate_cpf(self, value):
        if Usuario.objects.filter(cpf=value).exists():
            raise serializers.ValidationError("Este CPF já está cadastrado.")
        return value

    def validate_telefone(self, value):
        if Usuario.objects.filter(telefone=value).exists():
            raise serializers.ValidationError("Este telefone já está cadastrado.")
        return value

    def create(self, validated_data):
        usuario = criar_usuario_gestor(validated_data)
        enviar_email_boas_vindas(usuario)
        return usuario

    def to_representation(self, instance):
        tokens = gerar_tokens(instance)
        return {
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user': {
                'id': instance.id,
                'email': instance.email,
                'username': instance.username,
                'first_name': instance.first_name,
                'last_name': instance.last_name,
                'role': instance.role,
            }
        }


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError(
                    'Credenciais inválidas.',
                    code='authorization',
                )
        else:
            raise serializers.ValidationError(
                'Informe username e senha.',
                code='authorization',
            )

        refresh = self.get_token(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
            }
        }


class UserProfileSerializer(serializers.ModelSerializer):
    endereco = EnderecoSerializer(read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'telefone', 'cpf', 'dataNascimento', 'genero',
            'role', 'endereco', 'date_joined',
        ]


class UserAdminSerializer(serializers.ModelSerializer):
    endereco = EnderecoSerializer()
    senha = serializers.CharField(write_only=True, min_length=8, required=False)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'telefone', 'cpf', 'dataNascimento', 'genero',
            'role', 'endereco', 'senha', 'is_active',
        ]

    def validate_email(self, value):
        qs = Usuario.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Este email já está cadastrado.")
        return value

    def validate_username(self, value):
        qs = Usuario.objects.filter(username=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Este username já está em uso.")
        return value

    def validate_cpf(self, value):
        qs = Usuario.objects.filter(cpf=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Este CPF já está cadastrado.")
        return value

    def validate_telefone(self, value):
        qs = Usuario.objects.filter(telefone=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Este telefone já está cadastrado.")
        return value

    def create(self, validated_data):
        from .service import criar_usuario_por_gestor
        from hospedagemInfraestrutura.models import Hotel
        request = self.context.get('request')
        hotel = Hotel.objects.filter(gestor=request.user).first() if request else None
        return criar_usuario_por_gestor(validated_data, hotel=hotel)

    def update(self, instance, validated_data):
        endereco_data = validated_data.pop('endereco', None)
        if endereco_data:
            for attr, value in endereco_data.items():
                setattr(instance.endereco, attr, value)
            instance.endereco.save()

        senha = validated_data.pop('senha', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if senha:
            instance.set_password(senha)
        instance.save()
        return instance


class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'is_active', 'date_joined',
        ]
