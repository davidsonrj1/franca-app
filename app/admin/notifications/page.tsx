"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import AdminNotificationPanel from "@/components/admin-notification-panel"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AdminNotificationsPage() {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      router.push("/")
    }
  }, [user, role, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7DE08D]"></div>
      </div>
    )
  }

  if (!user || role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#081534] mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <AdminNotificationPanel />
}
