"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getAuth } from "firebase/auth"
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore"
import { Loader2, MessageCircle, Send } from "lucide-react"

type ChatMessage = {
  id: string
  userId: string
  nome: string
  mensagem: string
  enviadoEm: any
}

export default function ChatGeral() {
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

  useEffect(() => {
    if (!currentUser) {
      setError("Usuário não autenticado")
      setLoading(false)
      return
    }

    try {
      const chatRef = collection(db, "chat_geral")
      const q = query(chatRef, orderBy("enviadoEm", "asc"))

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
          setLoading(false)
        },
        (error) => {
          console.error("Erro ao buscar mensagens:", error)
          setError("Erro ao carregar mensagens")
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Erro ao configurar chat:", error)
      setError("Erro ao configurar chat")
      setLoading(false)
    }
  }, [currentUser, db])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !currentUser || sending) return

    setSending(true)
    try {
      await addDoc(collection(db, "chat_geral"), {
        userId: currentUser.uid,
        nome: currentUser.displayName || currentUser.email?.split("@")[0] || "Usuário",
        mensagem: newMessage.trim(),
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
          <h2 className="text-2xl font-bold font-sans text-foreground">Chat Geral</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground font-serif">Carregando mensagens...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-2xl font-bold font-sans text-foreground">Chat Geral</h2>
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <h2 className="text-2xl font-bold font-sans text-foreground">Chat Geral</h2>
        <p className="text-sm text-muted-foreground font-serif">
          {messages.length} {messages.length === 1 ? "mensagem" : "mensagens"}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold font-sans text-foreground mb-2">Nenhuma mensagem ainda</h3>
              <p className="text-muted-foreground font-serif">Seja o primeiro a enviar uma mensagem!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isCurrentUser = message.userId === currentUser?.uid
              return (
                <div key={message.id} className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                  <Avatar className="w-8 h-8 border-2 border-primary/20 flex-shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-sans font-semibold">
                      {getInitials(message.nome)}
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
                      <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                        <span
                          className={`font-semibold text-sm font-sans ${
                            isCurrentUser ? "text-primary-foreground/90" : "text-foreground"
                          }`}
                        >
                          {message.nome}
                        </span>
                        <span
                          className={`text-xs ${
                            isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(message.enviadoEm)}
                        </span>
                      </div>
                      <p
                        className={`text-sm font-serif ${
                          isCurrentUser ? "text-primary-foreground" : "text-foreground"
                        }`}
                      >
                        {message.mensagem}
                      </p>
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
            placeholder="Digite sua mensagem..."
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
