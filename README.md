# 🔬 LabView AI - AI-Powered Lab Result Analyzer

LabView AI adalah aplikasi analisis hasil laboratorium medis berbasis AI yang dirancang untuk membantu pengguna membaca, memahami, dan memantau parameter kesehatan mereka secara real-time. Aplikasi ini dibangun menggunakan **React**, **Vite**, **TailwindCSS**, **Firebase**, dan **Capacitor** untuk konversi ke perangkat mobile (Android/iOS).

---

## ✨ Fitur Utama

### 📊 1. Dasbor Kesehatan Dinamis
* **System Health Index**: Skor kesehatan (0-100) yang dihitung secara dinamis berdasarkan hasil lab terbaru.
* **Medication Schedule & Alarm**: Alarm pengingat minum obat secara lokal dengan dukungan suara (*alarm audio*) dan getaran (*vibrate*).
* **Language Switcher (ID/EN)**: Akses sekali ketuk untuk menerjemahkan seluruh aplikasi dari Bahasa Indonesia ke Bahasa Inggris langsung di bagian header sebelah notifikasi.
* **Notification Drawer**: Pusat informasi cepat jika ada parameter hasil lab yang membutuhkan perhatian khusus.

### 📸 2. Pemindaian Hasil Lab (Scan OCR)
* Unggah berkas dokumen laboratorium atau ambil gambar langsung menggunakan kamera ponsel.
* **Auto-Redaction Notice**: Melindungi privasi data pribadi sensitif sebelum data diproses oleh sistem AI.
* Ekstraksi metrik hasil lab otomatis secara cepat.

### 🔍 3. Detail Analisis & Chatbot AI
* Penjelasan rinci parameter klinis (Glukosa, Hemoglobin, Kolesterol, dsb) lengkap dengan indikator batas aman (*optimal/warning/alert*).
* **Asisten Chatbot AI**: Berdiskusi langsung dengan model AI mengenai hasil lab untuk mendapatkan rekomendasi kesehatan yang dipersonalisasi.

### 📈 4. Tren Perkembangan Kesehatan (Trends)
* Visualisasi grafik naik-turun parameter kesehatan secara berkala.
* **Analisis Khusus Lansia**: Rekomendasi ramah lansia dengan bahasa yang sederhana dan ukuran teks yang mudah dibaca.

### 📅 5. Riwayat Pemeriksaan (History)
* *Timeline tracker* dari semua hasil pemindaian sebelumnya.
* Dilengkapi dengan fitur pencarian dan filter cepat.

### 🪪 6. Profil & Digital Health ID Card
* **Digital Passport**: ID unik dan kode QR khusus pengguna.
* Integrasi institusi pendidikan (**ULBI - Universitas Logistik dan Bisnis Internasional**) lengkap dengan informasi NPM.

---

## 🛠️ Stack Teknologi

* **Frontend**: React (JS), Vite, TailwindCSS, Framer Motion (untuk animasi transisi premium)
* **Backend & Database**: Firebase Auth, Firestore Database
* **Mobile Engine**: `@capacitor/core`, `@capacitor/cli`
* **Local Actions**: `@capacitor/local-notifications` (untuk notifikasi pengingat obat di latar belakang)
* **Translation Hook**: Custom context translation provider (`LanguageContext`) dengan persistensi `localStorage`.

---

# 🔬 LabView AI - Comprehensive AI-Powered Lab Result Analyzer

[![Vite](https://img.shields.io/badge/Vite-B736FF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)

LabView AI adalah platform aplikasi kesehatan pintar (Web & Mobile) yang ditenagai oleh kecerdasan buatan (AI) untuk melakukan pemindaian (*scanning*), ekstraksi data klinis (OCR & NLP), serta interpretasi cerdas terhadap dokumen hasil laboratorium medis. Aplikasi ini dikembangkan secara khusus dengan antarmuka premium, ramah lansia, mendukung dwibahasa (**Indonesian & English**), serta memiliki sistem alarm pengingat medis terintegrasi.

---

## 📂 Struktur Direktori Proyek

Berikut adalah peta struktur berkas utama di dalam direktori `labview_ai/`:

```text
labview_ai/
├── android/                    # Source code native untuk platform Android (Capacitor)
├── ios/                        # Source code native untuk platform iOS (Capacitor)
├── public/                     # Aset publik (ikon aplikasi, favicon)
├── src/
│   ├── assets/                 # Aset gambar & logo internal
│   ├── pages/                  # Halaman utama aplikasi (Screens)
│   │   ├── Login.jsx           # Autentikasi masuk pengguna
│   │   ├── Register.jsx        # Pendaftaran akun baru & kuesioner medis awal
│   │   ├── Dashboard.jsx       # Dasbor utama (Health Index, jadwal obat, alarm)
│   │   ├── Scan.jsx            # Kamera OCR & pengunggah hasil laboratorium
│   │   ├── Detail.jsx          # Laporan analisis lab terperinci & Asisten Chatbot AI
│   │   ├── History.jsx         # Riwayat semua hasil pemindaian sebelumnya
│   │   ├── Trends.jsx          # Grafik tren parameter klinis & analisis lansia
│   │   └── Profile.jsx         # Informasi pengguna, Digital Passport ID, & setelan tema
│   ├── services/
│   │   └── openrouter.js       # Integrasi API LLM (OpenRouter/Gemini) untuk Chatbot & interpretasi
│   ├── App.css                 # Gaya global tambahan
│   ├── App.jsx                 # Routing aplikasi menggunakan react-router-dom
│   ├── firebase.js             # Inisialisasi & konfigurasi Firebase SDK
│   ├── index.css               # Desain dasar Tailwind CSS & variabel tema gelap
│   ├── LanguageContext.jsx     # Logika State Translate (ID/EN) & kamus kamus teks lokalisasi
│   └── main.jsx                # Entrypoint aplikasi React
├── capacitor.config.json       # Konfigurasi Capacitor untuk Build Mobile
├── tailwind.config.js          # Konfigurasi kustomisasi tema Tailwind
└── package.json                # Daftar dependensi & script proyek

🛠️ Arsitektur & Logika Fitur Utama
1. Sistem Multi-Bahasa Dinamis (LanguageContext.jsx)
Aplikasi ini mendukung penuh perpindahan bahasa secara instan tanpa perlu memuat ulang (refresh) halaman:

Menggunakan React Context API untuk mendistribusikan preferensi bahasa (id atau en) secara global.
Seluruh data statis (heading, sub-heading, tombol, peringatan, panduan tutorial) dipetakan ke dalam objek kamus (dictionary).
Pilihan bahasa disimpan secara persisten di dalam localStorage menggunakan kunci app_lang.
Dashboard Quick-Toggle: Diletakkan secara eksklusif di bar atas dasbor (sebelah kiri tombol notifikasi) untuk akses sekali ketuk yang cepat.
2. Sistem Alarm & Notifikasi Lokal Pengingat Obat (Dashboard.jsx)
Trigger Mekanis: Aplikasi melakukan pengecekan waktu setiap detik menggunakan setInterval terhadap jadwal pengobatan aktif milik user yang belum ditandai selesai (!isTaken).
Audio & Vibrate: Ketika waktu menunjukkan waktu minum obat, alarm darurat berlatar belakang merah akan muncul, audio alarm diputar secara berulang (loop), dan perangkat mobile akan bergetar menggunakan API getar bawaan browser/Capacitor.
Background Push Notifications: Mengintegrasikan @capacitor/local-notifications. Setiap jadwal obat baru akan didaftarkan secara otomatis sebagai notifikasi lokal tingkat sistem pada perangkat seluler, sehingga pengingat tetap aktif walaupun aplikasi sedang ditutup.
3. Asisten Chatbot Hasil Lab Medis (Detail.jsx & openrouter.js)
Setelah data lab diekstrak, pengguna dapat membuka panel chatbot mengambang (floating chatbot drawer).
Chatbot mengirimkan konteks hasil laboratorium terenkripsi sebagai instruksi sistem (system prompt) ke API OpenRouter (misal: menggunakan model Gemini / Claude). Ini memastikan bahwa AI memberikan jawaban medis yang relevan secara kontekstual dengan hasil darah asli pengguna.
4. Pencegahan Auto-Zoom Seluler (index.html)
Untuk mengatasi masalah kenyamanan pengguna ponsel di mana layar otomatis ber-zoom (zoom out / zoom in) ketika mengetik di chatbot, form input chat ditingkatkan ukurannya menjadi minimal 16px (text-[16px]), dikombinasikan dengan pembatasan skala viewport:
html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
📊 Skema Database Firestore
LabView AI menggunakan Google Cloud Firestore sebagai database NoSQL. Berikut struktur koleksi utama:

Koleksi: lab_results
Menyimpan semua data medis yang diekstrak dari gambar dokumen hasil laboratorium.

typescript
interface LabResult {
  id: string;          // Auto-generated ID dari Firestore
  userId: string;      // Relasi UID ke otentikasi user Firebase
  createdAt: Timestamp;// Tanggal pengunggahan
  glucose: number;     // Nilai gula darah (mg/dL)
  hemoglobin: number;  // Nilai hemoglobin (g/dL)
  cholesterol: number; // Nilai kolesterol (mg/dL)
  interpretation: string; // Teks analisis/interpretasi klinis dari AI
}
Koleksi: reminders
Menyimpan jadwal obat yang diatur oleh pengguna.

typescript
interface Reminder {
  id: string;          // Auto-generated ID dari Firestore
  userId: string;      // Relasi UID ke otentikasi user Firebase
  medicineName: string;// Nama obat
  time: string;        // Format waktu 24 jam (misal: "08:00")
  isTaken: boolean;    // Status apakah obat sudah dikonsumsi hari ini
  createdAt: Timestamp;// Tanggal pembuatan jadwal
}
🚀 Panduan Instalasi & Konfigurasi
1. Kloning Proyek
bash
git clone https://github.com/Aqsa55312/Labview.git
cd Labview/labview_ai
2. Konfigurasi Variabel Lingkungan (.env)
Buat file bernama .env di dalam folder root proyek (c:\Aqsa\labview_ai\labview_ai\.env) dan isi sesuai konfigurasi Firebase Console & API Key OpenRouter Anda:

env
VITE_FIREBASE_API_KEY=AIzaSyA12345...
VITE_FIREBASE_AUTH_DOMAIN=labview-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=labview-ai
VITE_FIREBASE_STORAGE_BUCKET=labview-ai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=9876543210
VITE_FIREBASE_APP_ID=1:9876543210:web:abcdef123456
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxxx...
3. Instal Dependensi Node
bash
npm install
4. Jalankan Server Pengembangan Lokal
bash
npm run dev -- --host
Menggunakan flag --host agar server dapat diakses oleh perangkat seluler (Android/iOS) yang terhubung pada jaringan Wi-Fi lokal yang sama.

5. Membangun Bundel Produksi Web
bash
npm run build
Hasil build web akan diletakkan di direktori /dist dan siap untuk disinkronkan ke mobile app wrapper.

📱 Alur Deploy ke Aplikasi Mobile (Capacitor)
Capacitor membungkus aplikasi web buatan Vite ke dalam proyek native Android dan iOS.

Langkah 1: Sinkronisasi Aset Web
Pastikan Anda sudah menjalankan npm run build, kemudian lakukan sinkronisasi:

bash
npx cap sync
Langkah 2: Membuka Proyek Native
🤖 Platform Android (Memerlukan Android Studio)
bash
npx cap open android
Di Android Studio, klik tombol Run untuk menjalankannya di Emulator atau perangkat fisik yang tersambung via USB Debugging.
🍎 Platform iOS (Memerlukan Xcode & macOS)
bash
npx cap open ios
Di Xcode, atur signing certificate proyek, lalu klik tombol Play/Run untuk menjalankan aplikasi di iPhone Simulator atau ponsel iOS fisik.
🔧 Panduan Troubleshooting & Solusi
1. Masalah Izin Kamera atau Notifikasi di Mobile
Gejala: Kamera tidak terbuka saat tombol Scan ditekan, atau alarm obat tidak berbunyi ketika aplikasi tertutup.
Solusi:
Pastikan Anda sudah memberikan izin notifikasi dalam menu pengaturan ponsel Anda.
Pada Android, pastikan izin kamera terdaftar di berkas AndroidManifest.xml:
xml
<uses-permission android:name="android.permission.CAMERA" />
Pada iOS, tambahkan teks deskripsi izin di file Info.plist:
xml
<key>NSCameraUsageDescription</key>
<string>LabView AI membutuhkan akses kamera untuk memindai dokumen hasil laboratorium Anda.</string>
2. Perubahan Mode Gelap Tidak Sinkron
Gejala: Warna teks atau latar belakang halaman tidak berubah saat menekan tombol Sun/Moon.
Solusi: Kelas dark disematkan langsung pada elemen root HTML (document.documentElement). Pastikan konfigurasi Tailwind (tailwind.config.js) Anda memiliki opsi darkMode: 'class':
javascript
module.exports = {
  darkMode: 'class',
  // ...
}
3. Masalah Autoplay Audio Alarm pada Browser Seluler
Gejala: Suara alarm pengingat obat tidak berbunyi saat waktu alarm tiba di browser seluler.
Solusi: Kebanyakan browser mobile (seperti Chrome/Safari Mobile) memblokir pemutaran audio secara otomatis sebelum ada interaksi pertama dari pengguna pada halaman (user interaction rule). Aplikasi LabView AI menangani ini dengan menangkap kesalahan pemutaran (.catch()) dan memunculkan modal persetujuan interaktif bagi pengguna untuk menekan tombol "Saya Sudah Meminumnya" untuk mereset audio player.
