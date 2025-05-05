import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Inisialisasi Firebase Admin
admin.initializeApp();

// Error handling global
process.on("unhandledRejection", (reason, promise) => {
  functions.logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

interface ToggleUserStatusRequest {
  userId: string;
  setActive: boolean;
}

export const toggleUserStatus = functions.https.onCall(async (data: ToggleUserStatusRequest, context) => {
  // Validasi autentikasi
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }

  // Validasi input
  if (typeof data.userId !== "string" || typeof data.setActive !== "boolean") {
    throw new functions.https.HttpsError("invalid-argument", "Invalid parameters");
  }

  const {userId, setActive} = data;

  try {
    // Verifikasi role admin
    const callerRef = admin.firestore().collection("users").doc(context.auth.uid);
    const userRef = admin.firestore().collection("users").doc(userId);

    const [callerSnap, userSnap] = await Promise.all([
      callerRef.get(),
      userRef.get(),
    ]);

    if (!callerSnap.exists || callerSnap.data()?.role !== "admin") {
      throw new functions.https.HttpsError("permission-denied", "Admin privileges required");
    }

    if (!userSnap.exists) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    // Atomic update
    const batch = admin.firestore().batch();
    batch.update(userRef, {isActive: setActive});
    
    await Promise.all([
      batch.commit(),
      admin.auth().updateUser(userId, {disabled: !setActive}),
    ]);

    return {success: true};
  } catch (error) {
    functions.logger.error("Error in toggleUserStatus:", error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError("internal", (error as Error).message);
  }
});