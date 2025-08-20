import { getToken, onMessage } from "firebase/messaging"
import { doc, updateDoc } from "firebase/firestore"
import { messaging, db } from "./firebase"

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    // Check if notifications are supported in this browser
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications")
      return false
    }

    // Check current permission status
    let permission = Notification.permission

    // Request permission if not already granted
    if (permission === "default") {
      permission = await Notification.requestPermission()
    }

    if (permission !== "granted") {
      console.log("Notification permission not granted")
      return false
    }

    return true
  } catch (error) {
    console.error("Error requesting notification permissions:", error)
    return false
  }
}

export const getFCMToken = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      console.log("Firebase Messaging not supported")
      return null
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    })

    return token
  } catch (error) {
    console.error("Error getting FCM token:", error)
    return null
  }
}

export const saveFCMTokenToFirestore = async (userId: string, fcmToken: string): Promise<void> => {
  try {
    await updateDoc(doc(db, "users", userId), {
      fcmToken: fcmToken,
      lastTokenUpdate: new Date(),
    })
    console.log("FCM token saved to Firestore")
  } catch (error) {
    console.error("Error saving FCM token:", error)
    throw error
  }
}

export const registerForPushNotifications = async (userId: string): Promise<void> => {
  try {
    const hasPermission = await requestNotificationPermissions()
    if (!hasPermission) {
      throw new Error("Notification permissions not granted")
    }

    const fcmToken = await getFCMToken()

    if (fcmToken) {
      await saveFCMTokenToFirestore(userId, fcmToken)
      console.log("Push notification token registered successfully")
    } else {
      throw new Error("Failed to get FCM token")
    }
  } catch (error) {
    console.error("Error registering for push notifications:", error)
    throw error
  }
}

export const setupForegroundNotificationListener = () => {
  if (!messaging) return

  return onMessage(messaging, (payload) => {
    console.log("Message received in foreground:", payload)

    if (payload.notification && Notification.permission === "granted") {
      new Notification(payload.notification.title || "Nova notificação", {
        body: payload.notification.body || "",
        icon: "/favicon.ico",
        data: payload.data || {},
      })
    }
  })
}

export const setupNotificationClickListener = () => {
  // Handle notification clicks in web environment
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "NOTIFICATION_CLICK") {
        console.log("Notification clicked:", event.data)
        // Handle notification click navigation here
      }
    })
  }
}

export const setupNotificationResponseListener = setupNotificationClickListener
