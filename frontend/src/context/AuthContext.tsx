/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../lib/api'

type AuthContextValue = {
  token: string | null
  userId: number | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_KEY = 'auth-token'

const getUserIdFromToken = (token: string | null) => {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  try {
    const payload = JSON.parse(atob(padded)) as { sub?: string }
    const userId = Number(payload.sub)
    return Number.isFinite(userId) ? userId : null
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  )
  const userId = getUserIdFromToken(token)

  const login = async (email: string, password: string) => {
    const formData = new URLSearchParams()
    formData.set('username', email)
    formData.set('password', password)

    const response = await api.post('/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const accessToken = response.data.access_token
    localStorage.setItem(TOKEN_KEY, accessToken)
    setToken(accessToken)
  }

  const register = async (name: string, email: string, password: string) => {
    await api.post('/register', { name, email, password })
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, userId, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
