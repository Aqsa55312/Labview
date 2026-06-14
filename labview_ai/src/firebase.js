import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Tambahkan GoogleAuthProvider di sini
import { getFirestore } from "firebase/firestore";

// Konfigurasi Firebase LabView AI
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};


// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Auth dan Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// SETUP GOOGLE PROVIDER
// Ini yang tadi kurang sehingga menyebabkan error 'googleProvider' not found
export const googleProvider = new GoogleAuthProvider();

// Opsional: Memaksa Google menampilkan pilihan akun (agar user bisa ganti email)
googleProvider.setCustomParameters({
    prompt: 'select_account'
});