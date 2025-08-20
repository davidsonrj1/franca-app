"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getAuth } from "firebase/auth"
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDocs,
} from "firebase/firestore"
import { Loader2, MessageCircle, Send, ArrowLeft, Users } from "lucide-react"

type User = {
  uid: string
  nome: string
  email: string
}

type ChatMessage = {
  id: string
  remetenteId: string
  conteudo: string
  enviadoEm: any
}

type Conversa = {
  id: string
  ultimaMensagem?: string
  ultimoUpdate?: any
  participantes: string[]
}

export default function ChatPrivado() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const auth = getAuth()
  const db = getFirestore()
  const currentUser = auth.currentUser

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load users list
  useEffect(() => {
    if (!currentUser) {
      setError("Usuário não autenticado")
      setLoading(false)
      return
    }

    const loadUsers = async () => {
      try {
        const usersRef = collection(db, "users")
        const snapshot = await getDocs(usersRef)
        const usersList: User[] = []

        snapshot.forEach((doc) => {
          const userData = doc.data()
          if (doc.id !== currentUser.uid) {
            // Exclude current user
            usersList.push({
              uid: doc.id,
              nome: userData.nome || userData.displayName || userData.email?.split("@")[0] || "Usuário",
              email: userData.email || "",
            })
          }
        })

        setUsers(usersList)
        setLoading(false)
      } catch (error) {
        console.error("Erro ao carregar usuários:", error)
        setError("Erro ao carregar usuários")
        setLoading(false)
      }
    }

    loadUsers()
  }, [currentUser, db])

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedUser || !currentUser) return

    const conversaId = getConversaId(currentUser.uid, selectedUser.uid)

    try {
      const messagesRef = collection(db, `conversas/${conversaId}/mensagens`)
      const q = query(messagesRef, orderBy("enviadoEm", "asc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messagesList: ChatMessage[] = []
          snapshot.forEach((doc) => {
            messagesList.push({
              id: doc.id,
              ...doc.data(),
            } as ChatMessage)
          })
          setMessages(messagesList)
        },
        (error) => {
          console.error("Erro ao buscar mensagens:", error)
          setError("Erro ao carregar mensagens")
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Erro ao configurar chat:", error)
      setError("Erro ao configurar chat")
    }
  }, [selectedUser, currentUser, db])

  const getConversaId = (uid1: string, uid2: string) => {
    return [uid1, uid2].sort().join("_")
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !currentUser || !selectedUser || sending) return

    setSending(true)
    try {
      const conversaId = getConversaId(currentUser.uid, selectedUser.uid)

      // Create conversation document if it doesn't exist
      await setDoc(
        doc(db, "conversas", conversaId),
        {
          participantes: [currentUser.uid, selectedUser.uid],
          ultimaAtividade: serverTimestamp(),
        },
        { merge: true },
      )

      // Add message to subcollection
      await addDoc(collection(db, `conversas/${conversaId}/mensagens`), {
        remetenteId: currentUser.uid,
        conteudo: newMessage.trim(),
        enviadoEm: serverTimestamp(),
      })

      setNewMessage("") // Auto-clear input
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      setError("Erro ao enviar mensagem")
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ""

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return ""
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-2xl font-bold font-sans text-foreground">Chat Privado</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground font-serif">Carregando usuários...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-2xl font-bold font-sans text-foreground">Chat Privado</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="border-red-200">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 font-serif">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show conversation view
  if (selectedUser) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Avatar className="w-8 h-8 border-2 border-primary/20">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-sans font-semibold">
              {getInitials(selectedUser.nome)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-bold font-sans text-foreground">{selectedUser.nome}</h2>
            <p className="text-xs text-muted-foreground font-serif">{selectedUser.email}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold font-sans text-foreground mb-2">Nenhuma mensagem ainda</h3>
                <p className="text-muted-foreground font-serif">Inicie uma conversa com {selectedUser.nome}!</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isCurrentUser = message.remetenteId === currentUser?.uid
                return (
                  <div key={message.id} className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                    <Avatar className="w-8 h-8 border-2 border-primary/20 flex-shrink-0">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-sans font-semibold">
                        {getInitials(isCurrentUser ? currentUser?.displayName || "Eu" : selectedUser.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 max-w-[80%] ${isCurrentUser ? "text-right" : ""}`}>
                      <div
                        className={`inline-block p-3 rounded-2xl ${
                          isCurrentUser
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-card border border-border rounded-bl-md"
                        }`}
                      >
                        <p
                          className={`text-sm font-serif ${
                            isCurrentUser ? "text-primary-foreground" : "text-foreground"
                          }`}
                        >
                          {message.conteudo}
                        </p>
                        <span
                          className={`text-xs block mt-1 ${
                            isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(message.enviadoEm)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Mensagem para ${selectedUser.nome}...`}
              className="body-normal border-border focus:ring-primary"
              disabled={sending}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newMessage.trim() || sending}
              className="bg-primary hover:bg-secondary text-primary-foreground font-sans font-semibold px-4"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // Show users list
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <h2 className="text-2xl font-bold font-sans text-foreground">Chat Privado</h2>
        <p className="text-sm text-muted-foreground font-serif">Selecione um usuário para conversar</p>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {users.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold font-sans text-foreground mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground font-serif">Não há outros usuários disponíveis para conversar.</p>
            </div>
          </div>
        ) : (
          users.map((user) => (
            <Card
              key={user.uid}
              className="border-border/50 hover:border-primary/30 transition-colors duration-200 cursor-pointer"
              onClick={() => setSelectedUser(user)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-primary/20">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-sans font-semibold">
                      {getInitials(user.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-sans font-semibold text-foreground">{user.nome}</h3>
                    <p className="text-sm text-muted-foreground font-serif">{user.email}</p>
                  </div>
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
