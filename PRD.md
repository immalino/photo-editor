# PRD: Desktop Photo Text Editor

**Penulis:** Faza Dandy · **Status:** Aktif v0.2 · **Terakhir Diperbarui:** 25 Oktober 2026

## 1. Ringkasan

Aplikasi desktop Windows yang ringan untuk menambahkan teks ke foto. Pengguna membuka satu atau banyak foto, menyusun beberapa lapisan teks dengan gaya lengkap (font, outline, bayangan, background), lalu mengekspor hasilnya. Untuk pemakaian batch, teks yang sama diterapkan ke semua foto sekaligus dengan koordinat dan ukuran yang proporsional.

---

## 2. Riwayat Versi & Status Rilis

| Versi | Status | Tanggal | Catatan Utama |
|---|---|---|---|
| **v0.1 (MVP)** | **Selesai (Completed)** | 24 Okt 2026 | Milestone 1–4: Multi-foto, multi-layer teks, gaya lengkap (stroke, shadow, background), batch queue, export engine resolusi penuh, undo/redo, template JSON. |
| **v0.2 (Lanjutan)** | **Dalam Pengerjaan (In Progress)** | 25 Okt 2026 | Milestone 5–6: In-canvas direct inline editing, arrow nudging per pixel, dual units (pixel & persen width/height), canvas zoom & pan, internal app template storage, upload font kustom manual. |

---

## 3. Latar Belakang & Masalah

Menambahkan teks ke foto (watermark, caption, judul) sering dilakukan berulang. Editor besar seperti Photoshop terlalu berat untuk tugas ini, sedangkan editor online membatasi ukuran file, privasi, dan tidak praktis untuk banyak foto. Dibutuhkan alat kecil, cepat, offline, yang fokus pada satu hal.

Pada penggunaan lanjutan, pengguna membutuhkan presisi penempatan per pixel menggunakan keyboard, pengeditan teks langsung di atas kanvas tanpa pop-up browser, penyesuaian skala berbasis persentase dimensi foto agar tampilan seragam di berbagai resolusi, kebebasan menambah font kustom, serta kemudahan zoom dan pustaka template aplikasi.

---

## 4. Tujuan & Non-Tujuan

**Tujuan MVP & v0.2**
- Menambahkan beberapa teks bergaya ke satu foto dengan pratinjau langsung yang presisi.
- In-canvas inline text editing langsung di tempat tanpa modal alert/prompt.
- Mengatur ukuran dan penempatan objek tidak hanya dalam pixel, tetapi juga dalam persentase (%) berbasis lebar atau tinggi foto.
- Zoom in / zoom out dan pan kanvas untuk navigasi detail.
- Nudge posisi layer teks per 1 pixel menggunakan tombol panah keyboard.
- Menyimpan template langsung di dalam aplikasi (pustaka internal) selain ekspor/impor `.json`.
- Pengguna dapat mengunggah file font sendiri (`.ttf`, `.otf`, `.woff`, `.woff2`) secara offline.
- Menerapkan teks ke banyak foto sekaligus (batch) dan mengekspor semuanya dengan hasil identik.
- Berjalan offline, ringan, cepat dibuka di Windows desktop.

**Non-Tujuan (di luar scope saat ini)**
- Fitur retouch foto kompleks: crop, filter warna, layer gambar non-teks.
- Akun pengguna, cloud sync, kolaborasi multi-user.
- Distribusi publik/monetisasi.

---

## 5. Kebutuhan Fungsional

### 5.1 Manajemen Foto
- **F1** Buka foto lewat dialog file dan drag & drop. Format input: JPG, PNG, WebP.
- **F2** Buka banyak foto sekaligus; daftar foto tampil sebagai thumbnail strip di bagian bawah.
- **F3** File asli tidak pernah ditimpa; hasil selalu disimpan sebagai file baru.

### 5.2 Layer Teks & Interaksi Kanvas
- **F4** Tambah teks baru; tiap teks adalah layer sendiri dengan z-index terkelola.
- **F5** Teks dapat dipindah (drag), dirotasi, dan di-scale menggunakan handle transformer.
- **F6** Daftar layer teks di panel samping: pilih, ubah urutan tumpukan (depan/belakang), tampil/sembunyi, hapus.
- **F7** Performa responsif minimal hingga 20+ layer aktif.
- **F23 [v0.2] In-Canvas Inline Text Editing:** Double-click pada teks di kanvas langsung membuka inline text editor (textarea overlay di posisi kanvas) untuk mengedit isi teks tanpa menggunakan `window.prompt` atau modal alert.
- **F24 [v0.2] Per-Pixel Arrow Key Nudge:** Tombol panah keyboard (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`) menggeser layer terpilih per 1 pixel, dan `Shift + Arrow` menggeser per 10 pixel.
- **F26 [v0.2] Canvas Zoom & Pan:** Kanvas pratinjau mendukung zoom in/out (20% – 500%), tombol Fit to Viewport, mouse wheel zoom (`Ctrl + Wheel`), dan panning kanvas (drag dengan tombol Space atau klik tengah mouse).

### 5.3 Gaya Teks & Satuan Relatif (Dual Units)
- **F8** Pilihan font standar sistem + font kustom. Bold, italic, opacity, dan alignment (kiri/tengah/kanan).
- **F9** Warna teks (color picker + input hex) dan opasitas teks.
- **F10** Outline/stroke: warna dan ketebalan, bisa diaktifkan/dimatikan.
- **F11** Bayangan (shadow): warna, blur, offset X/Y, bisa diaktifkan/dimatikan.
- **F12** Background teks: warna, opasitas, padding, radius sudut, bisa diaktifkan/dimatikan.
- **F25 [v0.2] Pengaturan Relatif Persen (%) & Pixel (px):**
  - Ukuran font, penempatan objek (X/Y), ketebalan stroke, radius shadow, dan padding background dapat diatur dalam satuan `px` maupun `%`.
  - Pada mode `%`, pengguna dapat memilih dimensi acuan: **Lebar Foto (*Width*)** atau **Tinggi Foto (*Height*)**.
  - Tujuannya agar saat template diterapkan pada batch foto dengan dimensi dan rasio aspek yang berbeda-beda, ukuran dan penempatan teks tetap proporsional dan berada di lokasi visual yang sama persis.

### 5.4 Manajemen Template & Font Kustom
- **F21** Undo/redo untuk seluruh perubahan layer teks (minimal 50 langkah).
- **F22** Ekspor dan impor template sebagai file eksternal `.json`.
- **F27 [v0.2] Pustaka Template Internal Aplikasi:**
  - Template dapat disimpan langsung ke dalam penyimpanan internal aplikasi (IndexedDB / direktori aplikasi) dengan nama kustom.
  - Menyediakan daftar/pustaka template tersimpan untuk langsung dipilih dan diterapkan (mode Ganti atau Tambah).
  - Menyertakan starter templates bawaan (*Watermark Kanan Bawah*, *Caption Bawah*, *Judul Tengah*, *Stamp Sudut*).
- **F28 [v0.2] Upload Font Kustom Manual:**
  - Pengguna dapat mengunggah file font sendiri dalam format `.ttf`, `.otf`, `.woff`, `.woff2`.
  - Font disimpan persisten di storage aplikasi dan didaftarkan via Web `FontFace` API.
  - Font kustom otomatis muncul di daftar pemilih font dan didukung penuh pada preview kanvas maupun render ekspor resolusi tinggi.

### 5.5 Batch Processing & Ekspor
- **F14** Teks yang disusun di satu foto dapat diterapkan ke semua foto batch.
- **F15** Posisi dan ukuran relatif tetap konsisten antar foto berbeda ukuran.
- **F16** Pengguna dapat menyesuaikan posisi/teks pada satu foto tertentu tanpa merusak foto lain.
- **F17** Ekspor batch dengan antrean proses sekuensial, progress bar, dan dialog ringkasan.
- **F18** Format output: PNG, JPG (kualitas dapat diatur), dan WebP.
- **F19** Resolusi output 1:1 identik dengan resolusi foto asli.
- **F20** Penamaan fleksibel `{name}_edited` dan pemilihan folder tujuan.

---

## 6. Kebutuhan Non-Fungsional

| Aspek | Target |
|---|---|
| Platform | Windows 10 dan 11 (64-bit), kompatibel Web modern |
| Performa Kanvas | ≥ 60 fps saat zoom, pan, dan drag teks |
| Memori & Ekspor | Mampu merender resolusi tinggi tanpa kebocoran memori |
| Offline & Privasi | 100% offline, seluruh data font & template tersimpan lokal |
| Waktu Muat Font | Font kustom dimuat instan saat startup aplikasi |

---

## 7. Status Milestone & Rencana Rilis

### Milestone MVP (v0.1) — **SELESAI (Completed)**
- [x] **Milestone 1:** Buka foto, kanvas tunggal, satu layer teks, ekspor dasar.
- [x] **Milestone 2:** Multi-layer teks, panel daftar layer, styling lengkap (outline, shadow, background).
- [x] **Milestone 3:** Multi-foto, thumbnail strip, duplikasi ke batch, ekspor batch sekuensial.
- [x] **Milestone 4:** Undo/redo 50 langkah, ekspor/impor template JSON, integrasi desktop Tauri.

### Milestone Lanjutan (v0.2) — **DALAM PENGERJAAN (In Progress)**
- [ ] **Milestone 5 (Interaktivitas Kanvas & Layout Presisi):**
  - [ ] Direct in-canvas inline text editing (hapus `window.prompt`).
  - [ ] Arrow keys per-pixel nudging (1px dan Shift+Arrow 10px).
  - [ ] Dual units (`px` & `%` berbasis lebar/tinggi foto) pada font, posisi X/Y, shadow, stroke, background.
  - [ ] Zoom in, zoom out, fit to screen, dan canvas pan.
- [ ] **Milestone 6 (Pustaka Template & Font Kustom):**
  - [ ] Sistem penyimpanan template internal aplikasi + starter presets.
  - [ ] Modal Pustaka Template (pilih, terapkan, simpan, kelola).
  - [ ] Upload font kustom manual (.ttf, .otf, .woff, .woff2) dengan persistensi lokal.
  - [ ] Integrasi rendering custom font pada preview kanvas dan ekspor resolusi tinggi.
