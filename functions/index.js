const functions = require("firebase-functions")
const admin = require("firebase-admin")

// Initialize Firebase Admin SDK
admin.initializeApp()

const db = admin.firestore()
const messaging = admin.messaging()

/**
 * Cloud Function que escuta criação de documentos na collection 'notificacoes'
 * e envia notificações push via FCM
 */
exports.enviarNotificacao = functions.firestore
  .document("notificacoes/{notificacaoId}")
  .onCreate(async (snap, context) => {
    try {
      const notificacao = snap.data()
      const { titulo, corpo, userId } = notificacao

      // Validar se os campos obrigatórios estão presentes
      if (!titulo || !corpo) {
        console.log("Notificação ignorada: título ou corpo ausente")
        return null
      }

      console.log(`Processando notificação: ${titulo}`)

      // Preparar payload da notificação
      const payload = {
        notification: {
          title: titulo,
          body: corpo,
        },
        data: {
          notificacaoId: context.params.notificacaoId,
          timestamp: Date.now().toString(),
        },
      }

      if (userId) {
        // Enviar para usuário específico
        await enviarParaUsuarioEspecifico(userId, payload)
      } else {
        // Enviar para todos os usuários
        await enviarParaTodosUsuarios(payload)
      }

      console.log("Notificação processada com sucesso")
      return null
    } catch (error) {
      console.error("Erro ao processar notificação:", error)
      return null
    }
  })

/**
 * Envia notificação para um usuário específico
 */
async function enviarParaUsuarioEspecifico(userId, payload) {
  try {
    const userDoc = await db.collection("users").doc(userId).get()

    if (!userDoc.exists) {
      console.log(`Usuário ${userId} não encontrado`)
      return
    }

    const userData = userDoc.data()
    const fcmToken = userData.fcmToken

    if (!fcmToken) {
      console.log(`Token FCM não encontrado para usuário ${userId}`)
      return
    }

    const message = {
      ...payload,
      token: fcmToken,
    }

    const response = await messaging.send(message)
    console.log(`Notificação enviada para usuário ${userId}:`, response)
  } catch (error) {
    console.error(`Erro ao enviar para usuário ${userId}:`, error)
  }
}

/**
 * Envia notificação para todos os usuários com token FCM válido
 */
async function enviarParaTodosUsuarios(payload) {
  try {
    // Buscar todos os usuários com token FCM
    const usersSnapshot = await db.collection("users").where("fcmToken", "!=", null).get()

    if (usersSnapshot.empty) {
      console.log("Nenhum usuário com token FCM encontrado")
      return
    }

    const messages = []
    const tokens = []

    usersSnapshot.forEach((doc) => {
      const userData = doc.data()
      const fcmToken = userData.fcmToken

      if (fcmToken && typeof fcmToken === "string" && fcmToken.trim() !== "") {
        tokens.push(fcmToken)
        messages.push({
          ...payload,
          token: fcmToken,
        })
      }
    })

    if (messages.length === 0) {
      console.log("Nenhum token FCM válido encontrado")
      return
    }

    console.log(`Enviando notificação para ${messages.length} usuários`)

    // Enviar em lotes (FCM permite até 500 mensagens por lote)
    const batchSize = 500
    const batches = []

    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push(messages.slice(i, i + batchSize))
    }

    let totalSuccess = 0
    let totalFailure = 0

    for (const batch of batches) {
      try {
        const response = await messaging.sendAll(batch)
        totalSuccess += response.successCount
        totalFailure += response.failureCount

        // Log de tokens inválidos para limpeza futura
        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              console.error(`Falha ao enviar para token ${batch[idx].token}:`, resp.error)
            }
          })
        }
      } catch (error) {
        console.error("Erro ao enviar lote:", error)
        totalFailure += batch.length
      }
    }

    console.log(`Notificação enviada: ${totalSuccess} sucessos, ${totalFailure} falhas`)
  } catch (error) {
    console.error("Erro ao enviar para todos os usuários:", error)
  }
}
