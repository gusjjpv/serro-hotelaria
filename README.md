# Configuração do Ambiente

## 1. Clonar o repositório

## 2. Criar ambiente virtual

### Linux/Mac

```bash
python3 -m venv venv
source venv/bin/activate
```

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

---

## 3. Instalar dependências

```bash
pip install -r requirements.txt
```

---

## 4. Configurar variáveis de ambiente

Crie e Edite o arquivo `.env`:

```env
SECRET_KEY=
DEBUG=
```

### Gerando uma SECRET_KEY

Cada desenvolvedor deve gerar sua própria chave:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copie o valor gerado para o campo `SECRET_KEY`.
---

## 8. Executar o projeto

```bash
python manage.py runserver
```

Acesse:

```
http://127.0.0.1:8000/
```

Admin:

```
http://127.0.0.1:8000/admin/
```

---

# Git Flow

## Branch Principal

```text
main
```

## Branch de Desenvolvimento

```text
develop
```

## Novas Funcionalidades

deve criar uma branch nova para isso.

```text
feature/nome-da-feature
```

Exemplo:

```text
feature/reservation-module
feature/payment-module
feature/authentication
```
---

## Commit

usar os padroes de commit:
https://github.com/iuricode/padroes-de-commits

# Segurança

Nunca enviar para o Git:

- .env
- credenciais
- tokens
- SECRET_KEY

O arquivo `.env` deve permanecer apenas na máquina do desenvolvedor ou no ambiente de produção.