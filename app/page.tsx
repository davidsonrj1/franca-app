"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, CheckSquare, MessageCircle, Send, Calendar, Bell, LogOut, Shield, Plus, Settings } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import MinhasNotificacoes from "@/components/minhas-notificacoes"
import ChatGeral from "@/components/chat-geral"
import ChatPrivado from "@/components/chat-privado"
import FrancaLogo from "@/components/franca-logo"

type Task = {
  id: string
  title: string
  description: string
  status: "pending" | "completed"
  dueDate: string
}

type Message = {
  id: string
  user: string
  text: string
  timestamp: string
  avatar?: string
}

type Notification = {
  id: string
  title: string
  text: string
  date: string
  read: boolean
}

export default function FrancaApp() {
  const { user: currentUser, role, login, logout: handleLogout, loading, error: authError } = useAuth()
  const router = useRouter()
  const isLoggedIn = !!currentUser

  const [activeTab, setActiveTab] = useState("home")
  const [taskFilter, setTaskFilter] = useState("all")

  // Mock data
  const tasks: Task[] = [
    {
      id: "1",
      title: "Revisar proposta comercial",
      description: "Analisar proposta do cliente XYZ",
      status: "pending",
      dueDate: "2024-01-25",
    },
    {
      id: "2",
      title: "Reunião de equipe",
      description: "Reunião semanal da equipe de vendas",
      status: "completed",
      dueDate: "2024-01-20",
    },
    {
      id: "3",
      title: "Follow-up cliente ABC",
      description: "Entrar em contato com cliente ABC",
      status: "pending",
      dueDate: "2024-01-26",
    },
  ]

  const messages: Message[] = [
    {
      id: "1",
      user: "Gabriel França",
      text: "Boa tarde pessoal! Como estão as vendas hoje?",
      timestamp: "14:30",
      avatar: "GF",
    },
    { id: "2", user: "Maria Silva", text: "Fechei mais 2 contratos hoje! 🎉", timestamp: "14:32", avatar: "MS" },
    { id: "3", user: "João Santos", text: "Excelente! Vamos manter o ritmo!", timestamp: "14:35", avatar: "JS" },
  ]

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password)
    } catch (error) {
      // Error is handled by the auth hook
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === "pending") return task.status === "pending"
    if (taskFilter === "completed") return task.status === "completed"
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <FrancaLogo size="lg" showText={false} className="mx-auto mb-4" />
          <p className="body-normal text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 shadow-lg">
          <CardHeader className="text-center pb-6">
            <FrancaLogo size="lg" className="mx-auto mb-4" />
            <CardTitle className="text-2xl font-sans font-bold text-foreground">Acesso ao Sistema</CardTitle>
            <p className="body-normal text-muted-foreground">Entre com suas credenciais</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleLogin(formData.get("email") as string, formData.get("password") as string)
              }}
            >
              <div className="space-y-4">
                <Input
                  name="email"
                  type="email"
                  placeholder="E-mail"
                  className="body-normal border-border focus:ring-primary"
                  required
                />
                <Input
                  name="password"
                  type="password"
                  placeholder="Senha"
                  className="body-normal border-border focus:ring-primary"
                  required
                />
                {authError && <p className="text-destructive body-small">{authError}</p>}
                <Button
                  type="submit"
                  className="w-full font-sans font-semibold bg-primary hover:bg-secondary text-primary-foreground"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </div>
            </form>
            <div className="text-xs text-muted-foreground text-center body-small">
              <p>Configure o Firebase para autenticação</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <FrancaLogo size="sm" showText={true} />
          </div>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <Button variant="ghost" size="sm" onClick={() => router.push("/admin/notifications")} className="p-2">
                <Settings className="w-4 h-4 text-primary" />
              </Button>
            )}
            {role === "admin" && <Shield className="w-4 h-4 text-primary" />}
            <Avatar className="w-8 h-8 border-2 border-primary/20">
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-sans font-semibold">
                {currentUser?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="home" className="h-full p-4 space-y-6 overflow-y-auto">
            <div>
              <h2 className="font-sans font-bold text-foreground mb-2">Olá, {currentUser?.name.split(" ")[0]}!</h2>
              <p className="body-normal text-muted-foreground">Resumo da sua semana</p>
              {role === "admin" && (
                <Badge variant="default" className="mt-2 bg-primary text-primary-foreground font-sans font-semibold">
                  <Shield className="w-3 h-3 mr-1" />
                  Administrador
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-primary font-sans mb-1">
                    {tasks.filter((t) => t.status === "pending").length}
                  </div>
                  <p className="body-small text-muted-foreground">Tarefas Pendentes</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-secondary font-sans mb-1">0</div>
                  <p className="body-small text-muted-foreground">Notificações</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 body-normal bg-card hover:bg-primary/5 border-border hover:border-primary/30 transition-all duration-200"
                onClick={() => setActiveTab("tasks")}
              >
                <CheckSquare className="w-6 h-6 text-primary" />
                <span className="font-sans font-medium">Tarefas</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 body-normal bg-card hover:bg-primary/5 border-border hover:border-primary/30 transition-all duration-200"
                onClick={() => setActiveTab("chat")}
              >
                <MessageCircle className="w-6 h-6 text-primary" />
                <span className="font-sans font-medium">Chat Geral</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 body-normal bg-card hover:bg-primary/5 border-border hover:border-primary/30 transition-all duration-200"
                onClick={() => setActiveTab("messages")}
              >
                <Send className="w-6 h-6 text-primary" />
                <span className="font-sans font-medium">Privado</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 body-normal bg-card hover:bg-primary/5 border-border hover:border-primary/30 transition-all duration-200"
                onClick={() => setActiveTab("calendar")}
              >
                <Calendar className="w-6 h-6 text-primary" />
                <span className="font-sans font-medium">Calendário</span>
              </Button>
            </div>

            {role === "admin" && (
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-sans font-semibold text-foreground flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-primary" />
                        Painel Administrativo
                      </h3>
                      <p className="body-small text-muted-foreground">Enviar notificações para usuários</p>
                    </div>
                    <Button
                      onClick={() => router.push("/admin/notifications")}
                      className="bg-primary hover:bg-secondary text-primary-foreground font-sans font-semibold transition-colors duration-200"
                    >
                      Acessar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="h-full p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-sans font-bold text-foreground">Tarefas</h2>
              <Button
                size="sm"
                className="font-sans font-semibold bg-primary hover:bg-secondary text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={taskFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setTaskFilter("all")}
                className="font-sans font-medium"
              >
                Todas
              </Button>
              <Button
                variant={taskFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setTaskFilter("pending")}
                className="font-sans font-medium"
              >
                Pendentes
              </Button>
              <Button
                variant={taskFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setTaskFilter("completed")}
                className="font-sans font-medium"
              >
                Concluídas
              </Button>
            </div>

            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="border-border/50 hover:border-primary/30 transition-colors duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-sans font-semibold text-foreground mb-1">{task.title}</h3>
                        <p className="body-normal text-muted-foreground">{task.description}</p>
                        <p className="body-small text-muted-foreground mt-2">Prazo: {task.dueDate}</p>
                      </div>
                      <Badge
                        variant={task.status === "completed" ? "secondary" : "outline"}
                        className="font-sans font-medium"
                      >
                        {task.status === "completed" ? "Concluída" : "Pendente"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="h-full flex flex-col">
            <ChatGeral />
          </TabsContent>

          <TabsContent value="messages" className="h-full overflow-hidden">
            <ChatPrivado />
          </TabsContent>

          <TabsContent value="calendar" className="h-full p-4 space-y-4 overflow-y-auto">
            <h2 className="font-sans font-bold text-foreground">Calendário</h2>
            <Card className="border-border/50 hover:border-primary/30 transition-colors duration-200">
              <CardContent className="p-4">
                <div className="text-center text-muted-foreground body-normal">
                  <Calendar className="w-12 h-12 mx-auto mb-2" />
                  <p>Visualização do calendário em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="h-full overflow-hidden">
            <MinhasNotificacoes />
          </TabsContent>

          <TabsContent value="profile" className="h-full p-4 space-y-4 overflow-y-auto">
            <h2 className="font-sans font-bold text-foreground">Perfil</h2>
            <Card className="border-border/50">
              <CardContent className="p-6 text-center space-y-4">
                <Avatar className="w-20 h-20 mx-auto border-4 border-primary/20">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xl font-sans font-bold">
                    {currentUser?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-sans font-semibold text-foreground mb-1">{currentUser?.name}</h3>
                  <p className="body-normal text-muted-foreground">{currentUser?.email}</p>
                  <Badge variant={role === "admin" ? "default" : "secondary"} className="mt-2 font-sans font-medium">
                    {role === "admin" ? "Administrador" : "Usuário"}
                  </Badge>
                </div>
                {role === "admin" && (
                  <Button
                    onClick={() => router.push("/admin/notifications")}
                    variant="outline"
                    className="w-full font-sans font-medium bg-card hover:bg-primary/5 border-primary/30 text-primary hover:text-primary"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Painel Admin
                  </Button>
                )}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full font-sans font-medium bg-card hover:bg-destructive/5 border-border hover:border-destructive/30"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </div>

        {/* Bottom Navigation */}
        <TabsList className="grid grid-cols-5 h-16 bg-card border-t border-border shadow-lg">
          <TabsTrigger
            value="home"
            className="flex-col gap-1 h-full font-sans font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="flex-col gap-1 h-full font-sans font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-xs">Tarefas</span>
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="flex-col gap-1 h-full font-sans font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">Chat</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex-col gap-1 h-full font-sans font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Bell className="w-5 h-5" />
            <span className="text-xs">Avisos</span>
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="flex-col gap-1 h-full font-sans font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs">Perfil</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
