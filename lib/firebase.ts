import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCKAzOAdZD747sm2wTyzG7xCSmz8wdpM9c',
  authDomain: 'jokiin-1e40d.firebaseapp.com',
  projectId: 'jokiin-1e40d',
  storageBucket: 'jokiin-1e40d.firebasestorage.app',
  messagingSenderId: '957883368891',
  appId: '1:957883368891:web:381e211dbd8dcb445fb09e',
  measurementId: 'G-VMGS12SG0W',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
