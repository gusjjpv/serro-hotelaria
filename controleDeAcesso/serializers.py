from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import Usuario, Endereco
from .service import criar_usuario, gerar_tokens, enviar_email_boas_vindas


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
            }
        }


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
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
            }
        }
