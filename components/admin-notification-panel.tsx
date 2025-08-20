"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { sendNotification, getAllUsers, type UserData } from "@/lib/firestore"
import { CheckCircle, AlertCircle, Send } from "lucide-react"

export default function AdminNotificationPanel() {
  const [titulo, setTitulo] = useState("")
  const [corpo, setCorpo] = useState("")
  const [destinatario, setDestinatario] = useState<string>("todos")
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userData = await getAllUsers()
        setUsers(userData)
      } catch (error) {
        console.error("Error loading users:", error)
      }
    }
    loadUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!titulo.trim() || !corpo.trim()) {
      setMessage({ type: "error", text: "Título e corpo são obrigatórios" })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const userId = destinatario === "todos" ? null : destinatario
      await sendNotification(titulo, corpo, userId)

      setMessage({ type: "success", text: "Notificação enviada com sucesso!" })
      setTitulo("")
      setCorpo("")
      setDestinatario("todos")
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao enviar notificação. Tente novamente." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="border-[#7DE08D]/20">
        <CardHeader className="bg-gradient-to-r from-[#7DE08D]/10 to-[#598F74]/10">
          <CardTitle className="text-[#081534] flex items-center gap-2">
            <Send className="h-5 w-5" />
            Painel de Notificações - Admin
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="titulo" className="text-sm font-medium text-[#081534]">
                Título da Notificação
              </label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Digite o título da notificação"
                className="border-[#7DE08D]/30 focus:border-[#7DE08D]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="corpo" className="text-sm font-medium text-[#081534]">
                Mensagem
              </label>
              <Textarea
                id="corpo"
                value={corpo}
                onChange={(e) => setCorpo(e.target.value)}
                placeholder="Digite a mensagem da notificação"
                rows={4}
                className="border-[#7DE08D]/30 focus:border-[#7DE08D]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="destinatario" className="text-sm font-medium text-[#081534]">
                Destinatário
              </label>
              <Select value={destinatario} onValueChange={setDestinatario}>
                <SelectTrigger className="border-[#7DE08D]/30 focus:border-[#7DE08D]">
                  <SelectValue placeholder="Selecione o destinatário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os usuários</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.uid} value={user.uid}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {message && (
              <Alert
                className={message.type === "success" ? "border-[#7DE08D] bg-[#7DE08D]/10" : "border-red-500 bg-red-50"}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-[#598F74]" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription className={message.type === "success" ? "text-[#598F74]" : "text-red-700"}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7DE08D] hover:bg-[#598F74] text-[#081534] font-medium"
            >
              {loading ? "Enviando..." : "Enviar Notificação"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
