import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/features/shared/Layout'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { GestorRegisterPage } from '@/features/auth/GestorRegisterPage'
import { HospedeDashboard } from '@/features/hospede/HospedeDashboard'
import { AdminDashboard } from '@/features/admin/AdminDashboard'
import { ProfilePage } from '@/features/shared/ProfilePage'
import { FuncionariosPage } from '@/features/admin/FuncionariosPage'
import { HospedesPage } from '@/features/admin/HospedesPage'
import { HotelPage } from '@/features/admin/HotelPage'
import { CategoriasPage } from '@/features/admin/CategoriasPage'
import { QuartosPage } from '@/features/admin/QuartosPage'
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
    path: '/',
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
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
