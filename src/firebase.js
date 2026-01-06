import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCjov15N246JwygMGcokruydxQ460uWZ2M",
  authDomain: "founders-time-sheet.firebaseapp.com",
  projectId: "founders-time-sheet",
  storageBucket: "founders-time-sheet.appspot.com",
  messagingSenderId: "673630096472",
  appId: "1:673630096472:web:ba2b5c93c03a1e32d88e2d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use modern persistence API (replaces deprecated enableMultiTabIndexedDbPersistence)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
