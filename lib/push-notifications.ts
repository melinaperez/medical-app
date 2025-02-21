import { db } from "@/lib/firebase"
import { collection, addDoc, deleteDoc, query, where, getDocs } from "firebase/firestore"

const convertSubscriptionToJSON = (subscription: PushSubscription) => {
  return JSON.parse(JSON.stringify(subscription))
}

export async function saveSubscription(userId: string, subscription: PushSubscription) {
  const subscriptionJSON = convertSubscriptionToJSON(subscription)

  // Verificar si ya existe una suscripción similar
  const subscriptionsRef = collection(db, "push_subscriptions")
  const q = query(subscriptionsRef, where("userId", "==", userId), where("endpoint", "==", subscriptionJSON.endpoint))

  const querySnapshot = await getDocs(q)

  // Si no existe, guardar la nueva suscripción
  if (querySnapshot.empty) {
    await addDoc(subscriptionsRef, {
      userId,
      ...subscriptionJSON,
      createdAt: new Date(),
    })
  }
}

export async function removeSubscription(userId: string, subscription: PushSubscription) {
  const subscriptionJSON = convertSubscriptionToJSON(subscription)

  const subscriptionsRef = collection(db, "push_subscriptions")
  const q = query(subscriptionsRef, where("userId", "==", userId), where("endpoint", "==", subscriptionJSON.endpoint))

  const querySnapshot = await getDocs(q)

  // Eliminar todas las suscripciones que coincidan
  const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref))
  await Promise.all(deletePromises)
}

export async function getUserSubscriptions(userId: string) {
  const subscriptionsRef = collection(db, "push_subscriptions")
  const q = query(subscriptionsRef, where("userId", "==", userId))
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

