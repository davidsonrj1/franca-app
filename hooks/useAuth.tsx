"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "firebase/auth"
import { onAuthChange, loginWithEmail, logout, getUserRole, type AppUser } from "@/lib/auth"
import {
  registerForPushNotifications,
  setupForegroundNotificationListener,
  setupNotificationResponseListener,
} from "@/lib/notifications"

type AuthContextType = {
  user: AppUser | null
  role: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userData = await loginWithEmail(firebaseUser.email!, "")
          setUser(userData)

          const userRole = await getUserRole(firebaseUser)
          setRole(userRole)

          // Register for push notifications after successful login
          try {
            await registerForPushNotifications(firebaseUser.uid)
          } catch (notificationError) {
            console.error("Failed to register for push notifications:", notificationError)
            // Don't block login if notification registration fails
          }
        } catch (error) {
          console.error("Error getting user data:", error)
          setUser(null)
          setRole(null)
        }
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    })

    // Setup notification listeners
    const unsubscribeForeground = setupForegroundNotificationListener()
    const unsubscribeResponse = setupNotificationResponseListener()

    return () => {
      unsubscribe()
      if (unsubscribeForeground) unsubscribeForeground()
      if (unsubscribeResponse) unsubscribeResponse()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)
      const userData = await loginWithEmail(email, password)
      setUser(userData)

      if (userData.firebaseUser) {
        const userRole = await getUserRole(userData.firebaseUser)
        setRole(userRole)
      }

      // Register for push notifications after successful login
      try {
        await registerForPushNotifications(userData.uid)
      } catch (notificationError) {
        console.error("Failed to register for push notifications:", notificationError)
        // Don't block login if notification registration fails
      }
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setError(null)
      await logout()
      setUser(null)
      setRole(null)
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }

  const value = {
    user,
    role,
    loading,
    login,
    logout: handleLogout,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
