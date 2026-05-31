import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

function loadAuth() {
  try {
    const token = localStorage.getItem('repolaunch_token')
    const user = JSON.parse(localStorage.getItem('repolaunch_user') || 'null')
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadAuth)

  function login(token, user) {
    localStorage.setItem('repolaunch_token', token)
    localStorage.setItem('repolaunch_user', JSON.stringify(user))
    setAuth({ token, user })
  }

  function logout() {
    localStorage.removeItem('repolaunch_token')
    localStorage.removeItem('repolaunch_user')
    // clear project cache too
    Object.keys(localStorage)
      .filter(k => k.startsWith('repolaunch_'))
      .forEach(k => localStorage.removeItem(k))
    setAuth({ token: null, user: null })
  }

  return (
    <AuthContext.Provider value={{
      user: auth.user,
      token: auth.token,
      isAuthenticated: !!auth.token,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
