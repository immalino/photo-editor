# PRD: Desktop Photo Text Editor (MVP)

**Penulis:** Faza Dandy · **Status:** Draft v0.1 · **Tanggal:** 24 Oktober 2026

## 1. Ringkasan

Aplikasi desktop Windows yang ringan untuk menambahkan teks ke foto. Pengguna membuka satu atau banyak foto, menyusun beberapa lapisan teks dengan gaya lengkap (font, outline, bayangan, background), lalu mengekspor hasilnya. Untuk pemakaian batch, teks yang sama diterapkan ke semua foto sekaligus.

## 2. Latar Belakang & Masalah

Menambahkan teks ke foto (watermark, caption, judul) sering dilakukan berulang. Editor besar seperti Photoshop terlalu berat untuk tugas ini, sedangkan editor online membatasi ukuran file, privasi, dan tidak praktis untuk banyak foto. Dibutuhkan alat kecil, cepat, offline, yang fokus pada satu hal.

## 3. Tujuan & Non-Tujuan

**Tujuan MVP**
- Menambahkan beberapa teks bergaya ke satu foto dengan pratinjau langsung.
- Menerapkan teks yang sama ke banyak foto sekaligus (batch) dan mengekspor semuanya.
- Berjalan offline, ringan, dan cepat dibuka.

**Non-Tujuan (di luar MVP)**
- Fitur edit foto lain: crop, filter, retouch, layer gambar, stiker.
- Akun pengguna, cloud sync, kolaborasi.
- Dukungan macOS/Linux.
- Distribusi publik/monetisasi (aplikasi untuk pemakaian internal/pribadi).

## 4. Pengguna

Pengguna tunggal: pemilik aplikasi (pemakaian pribadi/internal). Konsekuensi: UX boleh sederhana, tidak perlu onboarding, lisensi, atau sistem akun.

## 5. Skenario Utama (User Stories)

1. Sebagai pengguna, saya ingin membuka sebuah foto agar bisa menambahkan teks di atasnya.
2. Sebagai pengguna, saya ingin menambahkan beberapa teks dan mengatur masing-masing secara terpisah.
3. Sebagai pengguna, saya ingin menggeser teks langsung di atas foto agar penempatannya mudah.
4. Sebagai pengguna, saya ingin memberi outline, bayangan, dan background pada teks agar tetap terbaca di foto apa pun.
5. Sebagai pengguna, saya ingin memilih banyak foto dan menerapkan teks yang sama ke semuanya, lalu mengekspor sekaligus.
6. Sebagai pengguna, saya ingin menyimpan hasil tanpa merusak file asli.

## 6. Kebutuhan Fungsional

### 6.1 Manajemen Foto
- **F1** Buka foto lewat dialog file dan drag & drop. Format input: JPG, PNG, WebP.
- **F2** Buka banyak foto sekaligus (multi-select / drop beberapa file); daftar foto tampil sebagai thumbnail strip.
- **F3** File asli tidak pernah ditimpa; hasil selalu disimpan sebagai file baru.

### 6.2 Layer Teks
- **F4** Tambah teks baru (klik tombol "Tambah Teks"); tiap teks adalah layer sendiri.
- **F5** Teks dapat diedit isinya (double-click atau panel properti), dipindah (drag), dan dihapus.
- **F6** Daftar layer teks di panel samping: pilih, ubah urutan tumpukan (depan/belakang), tampil/sembunyi, hapus.
- **F7** Tidak ada batas jumlah teks yang ditetapkan secara eksplisit, tetapi aplikasi harus tetap responsif hingga minimal 20 layer.

### 6.3 Gaya Teks (lengkap)
- **F8** Font: pilih dari font terpasang di Windows; ukuran; bold/italic.
- **F9** Warna teks (color picker + input hex) dan opasitas.
- **F10** Rata teks (kiri/tengah/kanan) dan rotasi.
- **F11** **Outline/stroke:** warna dan ketebalan, bisa diaktifkan/dimatikan.
- **F12** **Bayangan:** warna, blur, offset X/Y, bisa diaktifkan/dimatikan.
- **F13** **Background teks:** warna, opasitas, padding, radius sudut, bisa diaktifkan/dimatikan.

### 6.4 Batch
- **F14** Set layer teks yang disusun di satu foto dapat diterapkan ke semua foto yang dimuat.
- **F15** Posisi disimpan secara relatif (persentase terhadap ukuran foto) agar teks tetap di tempat yang sama pada foto berukuran berbeda; ukuran font mengikuti skala lebar foto.
- **F16** Pengguna dapat menyesuaikan posisi/teks pada satu foto tertentu tanpa mengubah foto lain (override per foto).
- **F17** Ekspor batch ke folder tujuan dengan progress bar dan ringkasan hasil (berhasil/gagal).

### 6.5 Ekspor
- **F18** Format output: PNG dan JPG (kualitas dapat diatur), WebP opsional.
- **F19** Resolusi output sama dengan resolusi foto asli.
- **F20** Pola penamaan file hasil, misalnya `{nama-asli}_text.png`, dan pilihan folder output.

### 6.6 Pendukung
- **F21** Undo/redo untuk perubahan layer teks (minimal 50 langkah).
- **F22** Simpan/muat template teks (set layer + gaya) sebagai file JSON agar bisa dipakai ulang antar sesi.

> Catatan: F21 dan F22 diusulkan karena sangat berdampak pada kenyamanan, terutama untuk batch. Kalau ingin MVP lebih ramping, keduanya kandidat pertama untuk digeser ke versi berikutnya.

## 7. Kebutuhan Non-Fungsional

| Aspek | Target |
|---|---|
| Platform | Windows 10 dan 11 (64-bit) |
| Ukuran installer | Di bawah ±15 MB (keunggulan Tauri) |
| Waktu buka aplikasi | Di bawah 2 detik |
| Pratinjau | Terasa instan saat mengetik/menggeser teks (target ≥ 30 fps) |
| Foto besar | Mampu memproses foto hingga ±50 MP tanpa crash |
| Batch | 100 foto (12 MP) selesai dalam waktu wajar; proses tidak membekukan UI |
| Offline | Seluruh fitur berjalan tanpa internet |
| Privasi | Foto tidak pernah dikirim ke luar komputer |

## 8. Arsitektur & Teknologi (Usulan)

- **Shell:** Tauri 2 (Rust) untuk akses file, dialog, dan proses ekspor.
- **UI:** Web UI dengan TypeScript. Framework (React/Svelte/Vue) sesuai preferensi.
- **Kanvas pratinjau:** HTML Canvas atau library kanvas seperti Konva.js/Fabric.js untuk drag, seleksi, dan transformasi layer teks.
- **Rendering ekspor:** dua pilihan.
  - **A (disarankan untuk MVP):** render di frontend dengan canvas dengan resolusi penuh. Sederhana dan hasil identik dengan pratinjau.
  - **B:** render di Rust (crate `image` + `ab_glyph`/`cosmic-text`) agar batch lebih cepat. Lebih kompleks, dan risiko hasil berbeda dari pratinjau, terutama untuk bayangan dan background.
- **Penyimpanan template:** file JSON lokal.
- **Distribusi:** installer MSI/NSIS dari Tauri bundler.

## 9. Alur & Layout UI

- **Tengah:** kanvas foto aktif dengan teks yang bisa digeser.
- **Kiri/atas:** toolbar (Buka foto, Tambah teks, Undo/Redo, Ekspor).
- **Kanan:** panel properti teks terpilih (isi, font, warna, outline, bayangan, background) dan daftar layer.
- **Bawah:** thumbnail strip semua foto batch; foto aktif ditandai.
- **Dialog ekspor:** folder tujuan, format, kualitas, pola nama file, tombol "Ekspor semua".

## 10. Kriteria Penerimaan MVP

1. Pengguna dapat membuka foto JPG/PNG/WebP dan menambahkan minimal 5 teks, masing-masing dengan gaya berbeda.
2. Setiap teks dapat diedit, digeser, dan dihapus tanpa memengaruhi teks lain.
3. Outline, bayangan, dan background teks dapat diaktifkan terpisah dan tampil di hasil ekspor sama persis dengan pratinjau.
4. Pengguna dapat memuat 20+ foto berbeda ukuran, menerapkan set teks yang sama, dan mengekspor semuanya dengan posisi teks proporsional.
5. File asli tidak berubah setelah ekspor.
6. Aplikasi berjalan offline di Windows 10/11 tanpa instalasi runtime tambahan di luar installer.

## 11. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Hasil ekspor berbeda dari pratinjau (font, bayangan, background) | Tinggi | Render ekspor dengan engine yang sama dengan pratinjau (opsi A) |
| Scope teks "lengkap" + batch membesar | Sedang | Kerjakan bertahap: satu foto dulu, batch menyusul |
| Foto resolusi besar memakan memori | Sedang | Proses batch satu per satu, bukan paralel penuh |
| Font terpasang berbeda antar komputer | Rendah | Pemakaian pribadi di satu PC; abaikan di MVP |
| WebView2 belum terpasang di PC lama | Rendah | Installer Tauri dapat menyertakan bootstrapper WebView2 |

## 12. Rencana Rilis (Usulan)

- **Milestone 1:** buka foto, kanvas, satu layer teks dasar, ekspor PNG/JPG.
- **Milestone 2:** multi-layer teks, panel layer, gaya lengkap (outline, bayangan, background).
- **Milestone 3:** multi-foto, penerapan teks ke batch, ekspor batch.
- **Milestone 4:** undo/redo, template, polesan UI, installer.