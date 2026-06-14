# 🧬 LabView AI (Smart Ingestion)

## 📌 Ringkasan
LabView AI adalah aplikasi web modern berbasis React yang dirancang khusus untuk pengguna di Indonesia. Aplikasi ini berfungsi sebagai penerjemah hasil lab medis yang cerdas. Pengguna dapat mengunggah atau memotret laporan hasil lab medis mereka, kemudian aplikasi ini menggunakan Optical Character Recognition (OCR) yang dipadukan dengan kecerdasan buatan tingkat lanjut (Google Gemini) untuk secara otomatis mengekstrak metrik kesehatan utama dan memberikan interpretasi klinis yang komprehensif dan mudah dipahami.

## 🚀 Fitur Utama

*   **Pemindaian Dokumen Cerdas (OCR):** Memanfaatkan `Tesseract.js` untuk mengekstrak teks mentah secara mulus dari unggahan gambar atau dokumen PDF.
*   **Interpretasi Berbasis AI:** Mengintegrasikan `Google Generative AI` (Gemini 2.5 Flash) untuk memproses data OCR mentah, lalu mengubahnya menjadi metrik terstruktur berformat JSON (misal: Glukosa, Hemoglobin, Kolesterol, Asam Urat) disertai dengan narasi penjelasan klinis yang tertata.
*   **Dasbor Kesehatan Dinamis:** Antarmuka pengguna yang sangat memukau secara visual, yang menampilkan grafik indikator (gauge chart) dinamis untuk menghitung dan menampilkan "Skor Kesehatan Keseluruhan" (Overall Health Score) berdasarkan metrik numerik yang berhasil diekstrak.
*   **Riwayat Hasil Pemeriksaan yang Aman:** Terautentikasi melalui Firebase, pengguna memiliki akses privat ke riwayat pemindaian mereka sebelumnya. Hal ini memungkinkan pasien untuk melacak dan meninjau kembali interpretasi serta data rekam medis mereka kapan saja.
*   **Pola & Tren Kesehatan:** Memvisualisasikan historis metrik kesehatan dari waktu ke waktu dengan tampilan grafik interaktif menggunakan `Recharts`, sehingga pengguna dapat memantau perbaikan kondisi atau area yang perlu diwaspadai.
*   **Ekspor Laporan Offline:** Pengguna dapat mengunduh secara langsung hasil interpretasi AI mereka ke dalam format .PDF (didukung oleh modul `html2canvas` dan `jspdf`) untuk penyimpanan fisik atau untuk dibagikan kepada dokter.
*   **Lokalisasi Bahasa Indonesia:** Dikembangkan secara khusus menggunakan elemen UI serta struktur instruksi (prompt) berbasis bahasa lokal, yang memastikan bahwa model AI berkomunikasi dan menafsirkan data medis kepada pasien dengan sangat akurat dalam Bahasa Indonesia.

## 🛠 Teknologi yang Digunakan

### Frontend
*   **Framework:** React 19 dengan Vite untuk proses pengembangan yang cepat dan _build_ file yang optimal.
*   **Routing:** React Router v7 untuk navigasi Single Page Application (SPA) yang sangat mulus tanpa memuat ulang halaman.
*   **Styling:** TailwindCSS v4 untuk menghadirkan UI yang mutakhir, elegan, dan sangat responsif—lengkap dengan _color palette_ terbaik, animasi kustom yang mulus, serta estetika desain modern bersudut lengkung.
*   **Visualisasi Data:** Recharts untuk merender berbagai grafik matriks kesehatan yang interaktif.
*   **Ikon:** Lucide React untuk desain ikon SVG yang konsisten serta tajam.

### Pipeline Media & AI
*   **Generative AI:** SDK `@google/generative-ai` (Gemini), dikonfigurasi secara ketat untuk validasi skema JSON dan memberikan ulasan (insight) medis yang mendalam.
*   **Mesin OCR:** `Tesseract.js` (dengan kapabilitas bahasa `eng+ind`) yang beroperasi pada _client-side_ untuk mengekstrak teks sebelum dikirim ke AI.
*   **Tools Ekspor:** Kombinasi `jspdf` dan `html2canvas` guna me-_render_ UI React secara akurat dan mengubahnya menjadi dokumen PDF yang dapat diunduh.

### Backend & Layanan Awan (BaaS)
*   **Autentikasi:** Firebase Auth (menyediakan manajemen pendaftaran akun maupun sesi log masuk pengguna dengan aman).
*   **Database:** Firebase Firestore (Penyimpanan basis data tipe dokumen NoSQL untuk _tracking_ rekam diagnostik, log metrik pengguna, serta seluruh payload hasil interpretasi AI).

### Kesiapan Integrasi ke Aplikasi Mobile (Mobile-Ready)
*   **Capacitor:** Terintegrasi dengan kapabilitas mobile melalui `@capacitor/camera`, `@capacitor/filesystem`, serta `@capacitor/preferences`—berjalan bersama `@ionic/pwa-elements` untuk memastikan sistem web ini siap dikemas menjadi aplikasi _native_ untuk iOS / Android tanpa perlu mengubah struktur dan logika komponen inti penulisan kode.

## 🎨 Filosofi Desain
LabView AI bertumpu pada pondasi desain yang bersih dan memprioritaskan tampilan kebidangan medis ("medical-centric"). Desain ini mengadopsi _color palette_ hijau yang dinamis (kode hex dominan: `#48A878`) sebagai representasi kesehatan, kelangsungan hidup, dan keseimbangan. 

Pengalaman pengguna dirancang sangat dinamis dan memprioritaskan estetika visual premium melalui integrasi interaksi-mikro (micro-interactions) yang mulus, animasi denyut (pulse) saat AI memproses dokumen, panel bilah navigasi dengan efek _blur/glassmorphism_, hingga indikator ukur melengkung untuk Skor Kesehatan yang interaktif dan memanjakan mata. Konsep desain ini difokuskan penuh untuk menyembunyikan kompleksitas pipeline data AI ke dalam antarmuka yang ultra-minimalis, intuitif, dan sangat mudah digunakan bahkan bagi orang awam.
