import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

export type Task = {
  id: string
  title: string
  description: string
  status: "pending" | "completed"
  dueDate: string
  assignedTo: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type Message = {
  id: string
  userId: string
  userName: string
  text: string
  timestamp: Timestamp
  chatType: "general" | "private"
  recipientId?: string
}

export type NotificationData = {
  id: string
  userId: string
  title: string
  text: string
  read: boolean
  createdAt: Timestamp
  type: "task" | "message" | "system"
}

// Tasks operations
export const getTasks = async (userId?: string): Promise<Task[]> => {
  try {
    let q = collection(db, "tasks")

    if (userId) {
      q = query(collection(db, "tasks"), where("assignedTo", "==", userId))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Task,
    )
  } catch (error) {
    console.error("Error getting tasks:", error)
    throw error
  }
}

export const addTask = async (task: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, "tasks"), {
      ...task,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding task:", error)
    throw error
  }
}

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  try {
    await updateDoc(doc(db, "tasks", taskId), {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error updating task:", error)
    throw error
  }
}

// Messages operations
export const getMessages = async (chatType: "general" | "private", recipientId?: string): Promise<Message[]> => {
  try {
    let q = query(collection(db, "messages"), where("chatType", "==", chatType), orderBy("timestamp", "desc"))

    if (chatType === "private" && recipientId) {
      q = query(
        collection(db, "messages"),
        where("chatType", "==", "private"),
        where("recipientId", "==", recipientId),
        orderBy("timestamp", "desc"),
      )
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Message,
    )
  } catch (error) {
    console.error("Error getting messages:", error)
    throw error
  }
}

export const addMessage = async (message: Omit<Message, "id" | "timestamp">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "messages"), {
      ...message,
      timestamp: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding message:", error)
    throw error
  }
}

// Notifications operations
export const getNotifications = async (userId: string): Promise<NotificationData[]> => {
  try {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as NotificationData,
    )
  } catch (error) {
    console.error("Error getting notifications:", error)
    throw error
  }
}

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

// Real-time listeners
export const subscribeToMessages = (
  chatType: "general" | "private",
  callback: (messages: Message[]) => void,
  recipientId?: string,
) => {
  let q = query(collection(db, "messages"), where("chatType", "==", chatType), orderBy("timestamp", "desc"))

  if (chatType === "private" && recipientId) {
    q = query(
      collection(db, "messages"),
      where("chatType", "==", "private"),
      where("recipientId", "==", recipientId),
      orderBy("timestamp", "desc"),
    )
  }

  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Message,
    )
    callback(messages)
  })
}

export const subscribeToNotifications = (userId: string, callback: (notifications: NotificationData[]) => void) => {
  const q = query(collection(db, "notifications"), where("userId", "==", userId), orderBy("createdAt", "desc"))

  return onSnapshot(q, (querySnapshot) => {
    const notifications = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as NotificationData,
    )
    callback(notifications)
  })
}

// Admin notification functions
export type UserData = {
  uid: string
  email: string
  role: string
}

export const sendNotification = async (titulo: string, corpo: string, userId: string | null): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "notificacoes"), {
      titulo,
      corpo,
      userId,
      enviadaEm: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error sending notification:", error)
    throw error
  }
}

export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"))
    return querySnapshot.docs.map(
      (doc) =>
        ({
          uid: doc.id,
          ...doc.data(),
        }) as UserData,
    )
  } catch (error) {
    console.error("Error getting users:", error)
    throw error
  }
}
