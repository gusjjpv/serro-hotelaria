<div align="center">

# 🏨 SERRÔ Hotelaria

**Sistema de Gerenciamento Hoteleiro**

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-6.0-092E20?style=flat&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## 📑 Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [Principais Funcionalidades](#-principais-funcionalidades)
- [Atores do Sistema](#-atores-do-sistema)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Execução](#-execução)
- [Testes](#-testes)
- [Equipe](#-equipe)
- [Licença](#-licença)

---

## Sobre o Projeto

O **SERRÔ Hotelaria** é um sistema web completo para gerenciamento hoteleiro, desenvolvido para atender hotéis pequenos e médios.
O sistema cobre desde a **busca e reserva de quartos** até o **controle financeiro da estadia**, passando por check-in/out, manutenção de quartos e relatórios.

---

## Principais Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| **Busca de Disponibilidade** | Busca por hotel, categoria e datas com cálculo automático de valor |
| **Reserva Online** | Fluxo completo: busca → checkout → confirmação com JWT |
| **Check-in Online** | Hóspede confirma chegada a partir da meia-noite do dia anterior |
| **Check-in/out Presencial** | Atendente realiza para reservas pendentes ou confirmadas |
| **Conta do Quarto** | Lançamento de despesas: Frigobar, Serviço de Quarto, Spa, Outros |
| **Gestão de Quartos** | Controle de status: Disponível, Ocupado, Limpeza, Manutenção |
| **Gestão de Tarifas** | Cadastro de preços por categoria e período |
| **Bloqueio para Manutenção** | Supervisor bloqueia/desbloqueia quartos com motivo e período |
| **Dashboard** | Painel do dia: quartos por status, check-ins/out pendentes, faturamento |
| **Relatório de Faturamento** | Filtro por período com resumo e lista detalhada |

---

## Atores do Sistema

| Perfil | Sigla | Permissões |
|--------|-------|------------|
| **Gestor** | `GE` | Acesso total: hotéis, categorias, quartos, tarifas, funcionários, relatórios |
| **Supervisor** | `SV` | Gerenciar hóspedes, quartos, manutenção, relatórios |
| **Atendente** | `AT` | Check-in/out, lançar despesas, atualizar status dos quartos |
| **Hóspede** | `HO` | Buscar disponibilidade, reservar, cancelar, check-in online, ver extrato |

---

## Tecnologias

### Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Python | 3.12 | Linguagem principal |
| Django | 6.0 | Framework web |
| Django REST Framework | 3.17 | API REST |
| SimpleJWT | 5.5 | Autenticação JWT |
| SQLite | — | Banco de dados |

### Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 19 | Bibliologia UI |
| TypeScript | 6.0 | Tipagem estática |
| Vite | 8.0 | Build tool |
| Tailwind CSS | 4 | Estilização |

### Ferramentas

| Ferramenta | Uso |
|------------|-----|
| Git | Controle de versão |
| GitHub | Hospedagem do repositório |
| AWS | Deploy (planejado) |

---

## 📁 Estrutura do Projeto

```
serro-hotelaria/
├── controleDeAcesso/        # Autenticação, permissões, modelos de usuário
├── hospedagemInfraestrutura/# Reservas, quartos, hotéis, check-in/out
├── financeiro/              # Contas, despesas, produtos
├── tarifasManutencao/       # Tarifas e bloqueio para manutenção
├── frontend/                # React SPA
│   ├── src/
│   │   ├── features/        # Módulos (auth, admin, hospede, public, shared)
│   │   ├── services/        # Endpoints da API
│   │   ├── hooks/           # Hooks customizados
│   │   ├── types/           # Definições TypeScript
│   │   └── app/             # Router e providers
│   └── package.json
├── docs/                    # Diagramas UML e documentação
│   └── diagramas/
│       ├── casoDeUso/       # Diagramas de caso de uso
│       ├── classe/          # Diagramas de classes
│       ├── seguencia/       # Diagramas de sequência
│       ├── componentes/     # Diagramas de componentes
│       └── implantacao/     # Diagramas de implantação
├── manage.py
├── requirements.txt
└── .env
```

---

## Pré-requisitos

- Python 3.12+
- Node.js 18+
- npm ou yarn
- Git

---

## Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/gusjjpv/serro-hotelaria.git
cd serro-hotelaria
```

### 2. Configurar Backend

```bash
# Criar ambiente virtual
python3 -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows

# Instalar dependências
pip install -r requirements.txt
```

### 3. Configurar Frontend

```bash
cd frontend
npm install
```

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
SECRET_KEY=sua-chave-secreta-aqui
DEBUG=True

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=sua-senha-de-app
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=SERRÔ Hotelaria <seu-email@gmail.com>
```

### Gerando uma SECRET_KEY

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## Execução

### Backend

```bash
# Na raiz do projeto, com o ambiente virtual ativo
python manage.py migrate
python manage.py runserver
```

Acesse:
- API: `http://127.0.0.1:8000/`
- Admin: `http://127.0.0.1:8000/admin/`

### Frontend

```bash
cd frontend
npm run dev
```

---

# Equipe

| Nome | Papel | GitHub |
|------|-------|--------|
| **Vinicius** | Scrum Master + Backend | [@ViniciusOliver13](https://github.com/ViniciusOliver13) |
| **João** | FullStack + PR + Backend | [@gusjjpv](https://github.com/gusjjpv) |
| **Marcelo** | Frontend | [@marceloDev0](https://github.com/marceloDev0) |
| **Dinarte** | P.O | [@dinarteefilho](https://github.com/dinarteefilho) |
| **Thyago** | DevOps (Deploy AWS) | [@thyagofab](https://github.com/thyagofab) |

---
