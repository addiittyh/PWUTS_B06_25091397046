# RuangKita — Sistem Booking Ruang Kelas

## Identitas
- Mahasiswa: Adityah Candra Pratama
- NIM: 25091397046
- Bagian UTS: 2.a Homepage, 2.b Konten, 2.c Form transaksi

## Teknologi
- HTML5 untuk struktur halaman.
- CSS3 untuk desain dan tampilan responsif.
- JavaScript dan jQuery untuk interaksi.
- Template HTML di `index.html` digunakan untuk berganti tampilan tanpa AJAX atau server.

## Fitur
### 2.a — Homepage
Dashboard mahasiswa dengan statistik ruang, jadwal hari ini, pencarian cepat, dan ringkasan ruang favorit.

### 2.b — Ketersediaan Ruang
Katalog simulasi berisi 1.000 kode ruangan dari `K1.01.01` sampai `K10.10.10`. Fitur meliputi pencarian, filter tanggal/waktu, gedung, kapasitas, dan status; pagination; detail ruang; favorit; reset filter; serta ekspor CSV.

### 2.c — Form Booking
Form pemesanan satu kali dengan pilihan ruangan, tanggal, waktu, tujuan, jumlah peserta, ringkasan langsung, penghitung karakter catatan, dan validasi JavaScript.

## Cara menjalankan tanpa server
1. Ekstrak folder proyek.
2. Buka folder `PWUTS_K6_25091397046`.
3. Klik dua kali `index.html` agar terbuka di browser.
4. Gunakan menu Dashboard, Ketersediaan Ruang, dan Ajukan Booking. Konten halaman dimuat dari template di `index.html`; tidak perlu menjalankan XAMPP atau server lokal.

**Catatan:** koneksi internet diperlukan untuk memuat jQuery dan Google Fonts dari CDN. Jangan membuka `pages/ruangan.html` atau `pages/booking.html` secara langsung; buka `index.html` sebagai halaman utama.

## Pengujian manual
1. Cari kode ruang dari dashboard, misalnya `K1.01.01`.
2. Buka Ketersediaan Ruang dan uji pencarian, filter, pagination, tombol Detail, favorit, dan ekspor CSV.
3. Pilih ruang yang tersedia lalu pilih Ajukan Booking.
4. Isi form dengan data benar dan salah untuk melihat validasi.
5. Periksa ringkasan booking serta penghitung karakter catatan.

## Batasan prototipe
- Ruang, kapasitas, fasilitas, status, statistik, dan jadwal merupakan data simulasi.
- Hasil booking hanya ditampilkan sebagai simulasi di browser, belum disimpan ke database.
- Favorit disimpan secara lokal di browser dan tidak otomatis tersinkron ke perangkat lain.
