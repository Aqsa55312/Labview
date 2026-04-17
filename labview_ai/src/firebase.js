import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Tambahkan GoogleAuthProvider di sini
import { getFirestore } from "firebase/firestore";

// Konfigurasi Firebase LabView AI
const firebaseConfig = {
    apiKey: "AIzaSyAyuReiTW9cFDevJyhC6bYce_GSAsUnRsk",
    authDomain: "labview-86dbd.firebaseapp.com",
    projectId: "labview-86dbd",
    storageBucket: "labview-86dbd.firebasestorage.app",
    messagingSenderId: "253168865000",
    appId: "1:253168865000:web:2f42f0d7650cb4f293035d"
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