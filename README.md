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

## 🚀 Cara Menjalankan Project

### 1. Prasyarat (*Prerequisites*)
Pastikan Anda sudah menginstal:
* [Node.js](https://nodejs.org/) (versi 18 ke atas disarankan)
* [Git](https://git-scm.com/)

### 2. Kloning Repository
```bash
git clone https://github.com/Aqsa55312/Labview.git
cd Labview/labview_ai
