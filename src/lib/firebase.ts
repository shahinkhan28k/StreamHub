import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const storage = getStorage(app);

// Connection test
async function testConnection() {
  try {
    const testDoc = await getDocFromServer(doc(db, 'test', 'connection'));
    if (testDoc.exists()) {
      console.log("Firebase connected successfully.");
    }
  } catch (error) {
    // Only log real errors, ignore missing doc
    if (error instanceof Error && !error.message.includes('not-found')) {
      console.warn("Firebase connection status:", error.message);
    }
  }
}
testConnection();
