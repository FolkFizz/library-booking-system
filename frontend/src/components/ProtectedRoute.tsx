import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

type ProtectedRouteProps = {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation()
  const storedToken = localStorage.getItem('auth-token')

  if (!storedToken) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export default ProtectedRoute
