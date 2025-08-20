import { signInWithEmailAndPassword, signOut, onAuthStateChanged, getIdTokenResult, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase"

export type AppUser = {
  uid: string
  email: string
  name: string
  role: "admin" | "user"
  fcmToken?: string
  firebaseUser?: User
}

export const loginWithEmail = async (email: string, password: string): Promise<AppUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid))
    if (!userDoc.exists()) {
      throw new Error("Dados do usuário não encontrados")
    }

    const userData = userDoc.data()
    return {
      uid: user.uid,
      email: user.email!,
      name: userData.name,
      role: userData.role,
      fcmToken: userData.fcmToken,
      firebaseUser: user,
    }
  } catch (error: any) {
    throw new Error(error.message || "Erro ao fazer login")
  }
}

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch (error: any) {
    throw new Error(error.message || "Erro ao fazer logout")
  }
}

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

export const getUserRole = async (user: User): Promise<string> => {
  try {
    const tokenResult = await getIdTokenResult(user)
    const role = tokenResult.claims.role as string

    // Default role logic based on email
    if (!role) {
      return user.email === "gabriel@francapp.com" ? "admin" : "user"
    }

    return role
  } catch (error) {
    console.error("Error getting user role:", error)
    // Fallback to email-based role assignment
    return user.email === "gabriel@francapp.com" ? "admin" : "user"
  }
}
