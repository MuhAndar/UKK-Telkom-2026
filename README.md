# Aplikasi Penilaian UKK RPL - Tenaga Ahli (Mobile-First / POCO F7)

Aplikasi web mobile-first modern, cepat, dan ringan yang dirancang khusus untuk mempermudah **Tenaga Ahli Penguji** dalam menilai Uji Kompetensi Keahlian (UKK) Rekayasa Perangkat Lunak (SMK Telkom). 

Dioptimalkan secara ergonomis untuk layar HP **POCO F7** (dan smartphone modern lainnya) dengan rasio tinggi 20:9, refresh rate tinggi, dan layar AMOLED.

---

## ✨ Fitur Utama

1. **Mobile Ergonomic & AMOLED Dark Mode**:
   - Tampilan ramah jempol (*thumb-friendly*): tombol simpan dan navigasi berada di bagian bawah (*sticky bottom bar*).
   - Dilengkapi **Haptic Vibration** (getaran sentuhan halus) saat menekan tombol nilai di HP.
   - Tema gelap pekat (*AMOLED true black*) hemat daya baterai saat pengujian seharian di lab.

2. **Alur Kerja Sesuai Arahan**:
   - **Pilih Hari Ujian**: Menampilkan jadwal **Selasa, Rabu, dan Kamis** (jadwal Senin otomatis dilewati).
   - **Pilih Nama Peserta**: Dilengkapi pencarian cepat (nama/NIS) serta tab filter (*Semua, Belum Dinilai, Draft, Selesai*).
   - **Input Nilai 16 Indikator (0 - 100)**:
     - 2 Indikator duplikat bawaan template telah dibersihkan sehingga menjadi 16 kriteria unik yang akurat.
     - **⚡ Fitur Urutan Alur Waktu Ujian**: Anda dapat mengurutkan kriteria dari yang bisa dinilai diawal (K3, metode, perancangan database, pemodelan ERD, local server) hingga kriteria yang mewajibkan projek selesai (demo live & dokumen laporan).
     - **📑 Tombol Tukar Urutan**: Terdapat tombol untuk berpindah fleksibel antara *Alur Waktu Ujian* dan *Urutan Standar Dokumen (Elemen Utama & Pendukung)* kapan saja tanpa merusak nilai yang sudah diinput.
   - **Fleksibel**: Indikator **bebas dikosongkan** dan disimpan sebagai *Draft*. Nilai yang sudah diisi akan tetap tersimpan saat dibuka kembali sehingga Anda bisa melanjutkan kriteria yang masih kosong.
   - **Perhitungan Rata-Rata Otomatis**: Nilai rata-rata dan predikat kompetensi dihitung secara langsung (*real-time*).

3. **Fitur Praktis untuk Penguji**:
   - **Quick Score Presets**: Tombol cepat `[75]`, `[80]`, `[85]`, `[90]`, `[95]` untuk setiap indikator (tanpa perlu repot mengetik keyboard di HP).
   - **Batch Fill (Isi Cepat)**: Tombol *Set Semua: 80 / 85 / 90* untuk memberi nilai dasar ke 16 indikator sekaligus, lalu Anda cukup menyesuaikan 1-2 indikator yang menonjol.
   - **Navigasi Cepat Antar Siswa**: Tombol *Sebelumnya* dan *Berikutnya* langsung di lembar penilaian.

4. **Database & Penyimpanan Fleksibel**:
   - **Penyimpanan Lokal (Offline-first)**: Data otomatis tersimpan di HP/Browser (*LocalStorage*), tidak akan hilang meski HP mati atau browser ditutup.
   - **Ekspor Excel (.xlsx) Standar Panitia**: Sekali klik langsung mengunduh file `.xlsx` dengan format dan kolom yang persis dengan template panitia (`PENGUJI KOMDIGI 2`).
   - **Sinkronisasi Google Spreadsheet**: Terhubung ke Google Sheets sekolah/pribadi melalui Google Apps Script Webhook gratis.
   - **Backup & Restore JSON**: Cadangkan dan pulihkan data kapan saja.
   - **PWA Ready**: Dapat di-*install* langsung ke layar utama HP (*Add to Home Screen*) dan bekerja 100% tanpa internet.

---

## 🌐 Cara Hosting Gratis Selamanya di GitHub Pages

GitHub Pages **100% Gratis Selamanya**, tidak menggunakan sistem kuota kredit/billing seperti Netlify, dan sangat stabil.

### Langkah 1: Push Project ke GitHub
Buka terminal / PowerShell di folder ini, lalu jalankan perintah:

```bash
git init
git add .
git commit -m "feat: website penilaian UKK mobile"
git branch -M main
git remote add origin https://github.com/MuhAndar/UKK-Telkom-2026.git
git push -u origin main
```

---

### Langkah 2: Aktifkan GitHub Pages (Pilih Salah Satu Cara)

#### Cara A: Otomatis via GitHub Actions (Sangat Direkomendasikan)
Di dalam folder ini sudah disertakan file [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml).
1. Buka repository Anda di GitHub melalui browser: `https://github.com/MuhAndar/UKK-Telkom-2026`
2. Klik tab **Settings** (Pengaturan repo) ➔ di menu sebelah kiri pilih **Pages**.
3. Di bagian **Build and deployment** ➔ **Source**:
   - Ubah dari *Deploy from a branch* menjadi **GitHub Actions**.
4. Selesai! GitHub Actions akan otomatis melakukan build dan deploy setiap kali Anda melakukan push.
5. Website Anda langsung aktif di:
   ```
   https://muhandar.github.io/UKK-Telkom-2026/
   ```

#### Cara B: Menggunakan Branch Langsung
1. Buka repo Anda di GitHub ➔ **Settings** ➔ **Pages**.
2. Pada bagian **Source**, pilih **Deploy from a branch**.
3. Pilih branch: `main` (atau `master`) dan folder: `/ (root)`.
4. Klik **Save**.
5. Tunggu sekitar 1 menit, link website publik akan muncul di bagian atas halaman tersebut.

---

## 📱 Cara Memasang Sebagai Aplikasi di HP POCO F7

1. Buka link GitHub Pages Anda di browser **Google Chrome** pada HP POCO F7.
2. Ketuk ikon titik tiga (⋮) di pojok kanan atas browser.
3. Pilih menu **"Tambahkan ke Layar Utama"** (*Add to Home Screen*) atau **"Instal Aplikasi"**.
4. Ikon aplikasi **Penilaian UKK** akan langsung muncul di layar utama HP Anda.
5. Saat dibuka, aplikasi akan berjalan layar penuh (*fullscreen*) tanpa bilah URL browser, persis seperti aplikasi Android native, dan dapat digunakan secara offline di dalam ruang lab!

---

## 📊 Cara Menghubungkan ke Google Spreadsheet (Opsional)

Jika Anda ingin nilai yang diinput di HP langsung masuk ke Google Spreadsheet secara online:

1. Buat Google Spreadsheet baru (atau buka spreadsheet referensi).
2. Di Google Sheets, klik menu **Ekstensi** (*Extensions*) -> **Apps Script**.
3. Buka file [`google-apps-script.js`](file:///google-apps-script.js) yang ada di proyek ini, salin seluruh kodenya, dan tempel di editor Apps Script Google.
4. Klik **Terapkan** (*Deploy*) -> **Penerapan baru** (*New deployment*).
5. Pilih jenis **Aplikasi web** (*Web app*).
   - Jalankan sebagai: **Saya** (*Me*).
   - Siapa yang memiliki akses: **Siapa saja** (*Anyone*).
6. Salin link Web App yang berakhiran `/exec`.
7. Di aplikasi HP Anda:
   - Klik ikon **Cloud / Sync** (di pojok kanan atas header).
   - Tempel URL tersebut pada input **Google Apps Script Webhook URL** -> klik **Simpan URL**.
   - Kapan saja Anda ingin mengirim data ke Google Sheets, cukup klik **Sync Sekarang**!
