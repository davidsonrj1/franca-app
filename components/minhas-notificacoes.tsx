"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { getAuth } from "firebase/auth"
import { getFirestore, collection, query, where, orderBy, onSnapshot, or } from "firebase/firestore"
import { Loader2, Bell } from "lucide-react"

type Notification = {
  id: string
  titulo: string
  corpo: string
  enviadaEm: any
  userId: string | null
}

export default function MinhasNotificacoes() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()
    const db = getFirestore()
    const currentUser = auth.currentUser

    if (!currentUser) {
      setError("Usuário não autenticado")
      setLoading(false)
      return
    }

    try {
      const notificationsRef = collection(db, "notificacoes")
      const q = query(
        notificationsRef,
        or(where("userId", "==", currentUser.uid), where("userId", "==", null)),
        orderBy("enviadaEm", "desc"),
      )

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notificationsList: Notification[] = []
          snapshot.forEach((doc) => {
            notificationsList.push({
              id: doc.id,
              ...doc.data(),
            } as Notification)
          })
          setNotifications(notificationsList)
          setLoading(false)
        },
        (error) => {
          console.error("Erro ao buscar notificações:", error)
          setError("Erro ao carregar notificações")
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Erro ao configurar listener:", error)
      setError("Erro ao configurar notificações")
      setLoading(false)
    }
  }, [])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Data inválida"
    }
  }

  if (loading) {
    return (
      <div className="h-full p-4 space-y-4 overflow-y-auto">
        <h1 className="text-2xl font-bold font-sans text-foreground">Minhas Notificações</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground font-serif">Carregando notificações...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full p-4 space-y-4 overflow-y-auto">
        <h1 className="text-2xl font-bold font-sans text-foreground">Minhas Notificações</h1>
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 font-serif">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <h1 className="text-2xl font-bold font-sans text-foreground">Minhas Notificações</h1>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold font-sans text-foreground mb-2">Nenhuma notificação recebida</h3>
            <p className="text-muted-foreground font-serif">Você não possui notificações no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card key={notification.id}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold font-sans text-foreground">{notification.titulo}</h3>
                  <p className="text-sm text-muted-foreground font-serif">{notification.corpo}</p>
                  <p className="text-xs text-muted-foreground font-serif">{formatDate(notification.enviadaEm)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
