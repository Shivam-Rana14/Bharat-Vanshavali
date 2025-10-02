"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('AuthProvider: Checking auth...')
        const response = await fetch('/api/auth/me', { 
          credentials: 'include',
          cache: 'no-store' // Force fresh request, no cache
        })
        console.log('AuthProvider: Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('AuthProvider: Response data:', data)
          if (data?.success) {
            console.log('AuthProvider: Setting user:', data.user)
            setUser(data.user)
          } else {
            console.log('AuthProvider: No success, setting user to null')
            setUser(null)
          }
        } else {
          console.log('AuthProvider: Response not ok, setting user to null')
          setUser(null)
        }
      } catch (error) {
        console.log('AuthProvider: Error checking auth:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = (userData: User) => {
    console.log('Auth Provider - Login called with user:', userData)
    setUser(userData)
    
    // Redirect handled by login pages or middleware; no push here to avoid race.
  }

  const logout = async () => {
    try {
      console.log('AuthProvider: Logout called, clearing user immediately')
      // Clear user state immediately
      setUser(null)
      
      console.log('AuthProvider: Calling logout API...')
      // Call logout API to clear cookie
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      console.log('AuthProvider: Logout API response:', response.status)
      
      // Small delay to ensure cookie is cleared before redirect
      console.log('AuthProvider: Waiting for cookie to clear...')
      setTimeout(() => {
        console.log('AuthProvider: Redirecting to login...')
        window.location.href = '/login'
      }, 100)
    } catch (error) {
      console.error('AuthProvider: Logout failed:', error)
      // Still redirect even if API fails
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}