import { useCallback, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/client'
import AuthContext from './authContext'

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('taskflow_user') || 'null')
  } catch {
    localStorage.removeItem('taskflow_user')
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('taskflow_token'))
  const [user, setUser] = useState(readUser)

  const clearSession = useCallback(() => {
    localStorage.removeItem('taskflow_token')
    localStorage.removeItem('taskflow_user')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    window.addEventListener('taskflow:unauthorized', clearSession)
    return () => window.removeEventListener('taskflow:unauthorized', clearSession)
  }, [clearSession])

  const saveSession = useCallback((data) => {
    localStorage.setItem('taskflow_token', data.token)
    localStorage.setItem('taskflow_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }, [])

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials)
    saveSession(data)
  }, [saveSession])

  const register = useCallback(async (details) => {
    const { data } = await authApi.register(details)
    saveSession(data)
  }, [saveSession])

  const logout = useCallback(() => clearSession(), [clearSession])

  const value = useMemo(
    () => ({ token, user, login, register, logout }),
    [token, user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
