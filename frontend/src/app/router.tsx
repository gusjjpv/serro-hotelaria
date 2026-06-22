import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/features/shared/Layout'
import { PublicLayout } from '@/features/shared/PublicLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { GestorRegisterPage } from '@/features/auth/GestorRegisterPage'
import { LandingPage } from '@/features/public/LandingPage'
import { HotelDetailPage } from '@/features/public/HotelDetailPage'
import { ResultadosPage } from '@/features/public/ResultadosPage'
import { CheckoutPage } from '@/features/public/CheckoutPage'
import { ReservaSucessoPage } from '@/features/public/ReservaSucessoPage'
import { HospedeDashboard } from '@/features/hospede/HospedeDashboard'
import { AdminDashboard } from '@/features/admin/AdminDashboard'
import { ProfilePage } from '@/features/shared/ProfilePage'
import { FuncionariosPage } from '@/features/admin/FuncionariosPage'
import { HospedesPage } from '@/features/admin/HospedesPage'
import { HotelPage } from '@/features/admin/HotelPage'
import { CategoriasPage } from '@/features/admin/CategoriasPage'
import { QuartosPage } from '@/features/admin/QuartosPage'
import { TarifasPage } from '@/features/admin/TarifasPage'
import { MinhasReservasPage } from '@/features/hospede/MinhasReservasPage'
import { PainelCheckInPage } from '@/features/admin/PainelCheckInPage'
import { ContaPage } from '@/features/admin/ContaPage'
import { ExtratoPage } from '@/features/hospede/ExtratoPage'
import { ManutencaoPage } from '@/features/admin/ManutencaoPage'
import { RelatorioFaturamentoPage } from '@/features/admin/RelatorioFaturamentoPage'
import { CheckInOnlinePage } from '@/features/hospede/CheckInOnlinePage'
import { AuthGuard } from '@/features/shared/AuthGuard'

function RoleDashboard() {
  const { role, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (role === 'HO') {
    return <HospedeDashboard />
  }

  return <AdminDashboard />
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/register/gestor',
    element: <GestorRegisterPage />,
  },
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        path: 'hoteis/:id',
        element: <HotelDetailPage />,
      },
      {
        path: 'disponibilidade',
        element: <ResultadosPage />,
      },
      {
        path: 'reservar',
        element: <CheckoutPage />,
      },
      {
        path: 'reserva-sucesso',
        element: <ReservaSucessoPage />,
      },
    ],
  },
  {
    path: '/app',
    element: (
      <AuthGuard>
        <Layout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <RoleDashboard />,
      },
      {
        path: 'me',
        element: <ProfilePage />,
      },
      {
        path: 'minhas-reservas',
        element: <MinhasReservasPage />,
      },
      {
        path: 'checkin',
        element: <CheckInOnlinePage />,
      },
      {
        path: 'extrato',
        element: <ExtratoPage />,
      },
      {
        path: 'admin/funcionarios',
        element: <FuncionariosPage />,
      },
      {
        path: 'admin/hospedes',
        element: <HospedesPage />,
      },
      {
        path: 'admin/hotel',
        element: <HotelPage />,
      },
      {
        path: 'admin/categorias',
        element: <CategoriasPage />,
      },
      {
        path: 'admin/quartos',
        element: <QuartosPage />,
      },
      {
        path: 'admin/tarifas',
        element: <TarifasPage />,
      },
      {
        path: 'admin/checkin',
        element: <PainelCheckInPage />,
      },
      {
        path: 'admin/consumo',
        element: <ContaPage />,
      },
      {
        path: 'admin/manutencao',
        element: <ManutencaoPage />,
      },
      {
        path: 'admin/relatorios',
        element: <RelatorioFaturamentoPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
