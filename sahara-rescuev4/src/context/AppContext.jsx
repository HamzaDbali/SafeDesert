import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authAPI, getToken, setToken, clearToken } from '../api'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

export function AppProvider({ children }) {
  const [screen,  setScreen]  = useState('map')   // start on map immediately
  const [user,    setUser]    = useState(null)
  const [token,   setTk]      = useState(getToken)
  const [loading, setLoading] = useState(false)   // no loading gate — map shows instantly
  const [toast,   setToast]   = useState(null)

  // Try to verify token silently in background — don't block map
  useEffect(() => {
    if (!token) return
    authAPI.verify()
      .then(r => setUser(r.data.user))
      .catch(() => { /* stay on map — just not logged in */ })
  }, [])

  const login = useCallback(async (email, password) => {
    const r = await authAPI.login({ email, password })
    setToken(r.data.token)
    setTk(r.data.token)
    setUser(r.data.user || null)
    setScreen('map')
    return r.data
  }, [])

  const signup = useCallback(async (data) => {
    const r = await authAPI.signup(data)
    return r.data
  }, [])

  const logout = useCallback(() => {
    clearToken(); setTk(null); setUser(null); setScreen('map')
  }, [])

  const navigate  = useCallback((s) => setScreen(s), [])
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  return (
    <AppContext.Provider value={{ screen, navigate, user, setUser, token, login, signup, logout, loading, showToast }}>
      {children}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </AppContext.Provider>
  )
}

function Toast({ msg, type }) {
  const colors = { success: '#2A7A3B', error: '#C8291F', info: '#E8601C' }
  return (
    <div style={{
      position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
      background: colors[type] || '#1A1208', color: '#fff',
      padding: '11px 22px', borderRadius: 22, fontSize: 13, fontWeight: 600,
      zIndex: 9999, boxShadow: '0 4px 24px rgba(0,0,0,.35)',
      animation: 'fadeUp .3s ease both', whiteSpace: 'nowrap',
      fontFamily: 'var(--font-b)',
    }}>
      {msg}
    </div>
  )
}
