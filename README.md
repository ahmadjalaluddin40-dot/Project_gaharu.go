# GAHARU Website

Situs organisasi GAHARU dalam Bahasa Indonesia dan Inggris. Dibangun dengan React, Vite, Tailwind CSS v4, Sanity CMS, dan Netlify Forms. Tanpa akun relawan atau donasi transaksional.

## Jalankan lokal

1. Install dependency dengan `npm install`.
2. Salin `.env.example` menjadi `.env.local`. Tanpa kredensial Sanity, situs tetap menampilkan konten awal dari `src/data/seed.json`.
3. Jalankan `npm run dev` dan buka `/id` atau `/en`.
4. Verifikasi produksi dengan `npm run build`.

## Hubungkan Sanity

1. Buat proyek dan dataset publik bernama `production` di Sanity. Sanity Studio versi saat ini membutuhkan Node.js 22.12 atau lebih baru.
2. Isi `VITE_SANITY_PROJECT_ID`, `VITE_SANITY_DATASET`, `SANITY_STUDIO_PROJECT_ID`, dan `SANITY_STUDIO_DATASET` di `.env.local`.
3. Tambahkan asal CORS situs produksi serta `http://localhost:5173` di pengaturan Sanity.
4. Buat token tulis terbatas untuk proses awal, isi `SANITY_API_WRITE_TOKEN`, lalu jalankan `node --env-file=.env.local scripts/seed-sanity.mjs`. Script hanya membuat dokumen yang belum ada sehingga perubahan editor tidak tertimpa.
5. Jalankan `npx sanity dev` untuk mengedit dokumen, kemudian `npx sanity deploy` jika ingin Studio dihosting oleh Sanity. Hanya anggota proyek Sanity yang bisa mengedit.
6. Hapus token tulis dari lingkungan frontend/deployment setelah impor awal. Jangan pernah memakai token rahasia dengan prefiks `VITE_`.

Untuk menyelaraskan dokumen Sanity yang sudah pernah dibuat dengan profil Tentang Kami dan kontak terbaru, setelah memperbarui schema jalankan `node --env-file=.env.local scripts/update-about.mjs`. Script memakai token tulis dan memperbarui ringkasan Tentang GAHARU, halaman Tentang Kami (termasuk gambar header halaman), SEO Tentang, serta alamat dan kontak. Foto lain, daftar tim, dokumen PDF, dan konten lain yang sudah diedit di Studio dipertahankan.

Seed kini mencantumkan sembilan rumpun kerja yang diberikan GAHARU. Studi kasus mangrove Muna Barat, kemitraan riset, dan advokasi pesisir tetap ada sebagai materi tambahan. Cakupan organisasi ditetapkan **Seluruh Indonesia / Nasional**; peta interaktif tetap menunjukkan satu contoh kegiatan terdokumentasi di Muna Barat.

Untuk menambahkan delapan rumpun program baru ke dataset Sanity dan memperbarui profil biogas serta teks halaman program, jalankan `node --env-file=.env.local scripts/update-programs.mjs`. Dokumen baru hanya dibuat jika belum ada. Pembaruan biogas tidak menimpa foto atau galeri yang sudah dikelola editor.

Setelah memperbarui schema Studio, kategori calon mitra baru dapat diselaraskan ke dokumen Sanity yang sudah ada dengan `node --env-file=.env.local scripts/update-partnerships.mjs`. Daftar mencakup lembaga donor, kementerian, program CSR, perguruan tinggi, dan BRGM. Kategori ini adalah peluang kolaborasi, bukan klaim bahwa setiap lembaga sudah menjadi mitra aktif.

Kategori artikel **Opini** memiliki empat naskah La Ode Muhammad Rabiali tanpa tanggal terbit karena tanggal asli belum diberikan. Schema artikel kini mengizinkan tanggal terbit kosong serta menyimpan nama/jabatan penulis, biografi, dan catatan editorial. Ringkasan bahasa Inggris bukan terjemahan penuh; naskah lengkap tersedia dalam Bahasa Indonesia. Sinkronkan opini ke dataset Sanity yang sudah ada dengan `node --env-file=.env.local scripts/update-opinion-articles.mjs`; dokumen yang sudah ada tidak ditimpa. Klaim, angka historis, dan dugaan tentang pihak tertentu dalam tulisan opini belum diverifikasi redaksi dan tidak merupakan penetapan hukum. Periksa sumber primer sebelum menerbitkan atau mengutipnya sebagai kondisi terkini.

Untuk menerapkan cakupan wilayah kerja **Seluruh Indonesia / Nasional** ke Sanity yang sudah ada, jalankan `node --env-file=.env.local scripts/update-work-area.mjs` setelah schema Studio diperbarui. Peta Muna Barat tetap dijelaskan sebagai satu contoh lokasi program terdokumentasi, bukan keseluruhan cakupan nasional.

Dokumen singleton **Pengaturan & halaman utama** mengelola teks, foto, angka dampak, alamat, dan SEO halaman utama. Dokumen **Program** dan **Artikel** mengelola detail masing-masing, termasuk field ID/EN. Foto yang diunggah ke Sanity didahulukan dari URL foto ilustrasi. Konten yang belum ada di CMS memakai fallback lokal agar situs tetap dapat dibuka.

## Database Supabase (formulir)

Formulir **Kontak** dan **Kemitraan** mengirim pesan ke tabel `public.contact_messages` di Supabase dengan `anon key`, lalu kembali memakai Netlify Forms sebagai cadangan bila insert gagal atau variabel Supabase belum diisi.

1. Jalankan `supabase/migrations/0001_contact_messages.sql` di **Supabase → SQL Editor → New query** (atau `supabase db push`). File tersebut membuat tabel `contact_messages` dan mengaktifkan RLS: publik (anon) hanya boleh insert; tidak ada kebijakan read/update/delete, sehingga isi formulir tidak bisa dibaca balik dari sisi klien.
2. Variabel `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sudah terisi di `.env.local` dan `.env.example` (anon key bersifat publik oleh desain). Nama tabel dapat diubah lewat `VITE_SUPABASE_MESSAGES_TABLE`.
3. Lihat pesan masuk di **Supabase → Table Editor → contact_messages** (baca memakai dashboard/admin, bukan anon key).

**Keamanan penting:**
- `service_role` secret TIDAK dipakai dan TIDAK boleh disimpan di frontend, variabel `VITE_`, atau file yang di-commit; Vite membakar semua nilai `VITE_` ke bundle publik sehingga secret apa pun akan bocor ke pengunjung.
- `service_role` secret yang dibagikan melalui chat/chat aplikasi sebaiknya **diorotasikan** (Supabase → Project Settings → API Keys → Rotate service_role) karena sudah terungkap dalam bentuk teks; rotasi tidak mengganggu integrasi situs ini karena secret tersebut tidak pernah dipakai kode.
- RLS wajib tetap aktif pada `contact_messages`; jangan menambah kebijakan SELECT untuk anon.

## Formulir dan deployment

- Deploy `dist/` ke Netlify. File `public/_redirects` menjaga semua URL halaman langsung tetap terbuka.
- Aktifkan form detection / Netlify Forms dan atur email notification ke alamat resmi tim di dashboard Netlify. Pada domain kustom, set `VITE_NETLIFY_FORMS_ENABLED=true` sebelum build. Subdomain `.netlify.app` dikenali otomatis. Alamat email tim belum diberikan, sehingga notifikasi email belum bisa dikonfigurasi di kode.
- Formulir kontak dan kemitraan mengirim ke Supabase (utama) lalu Netlify Forms (cadangan), dengan satu form bernama `gaharu-contact`, field subjek pembeda, validasi browser, dan honeypot.
- Isi `VITE_PUBLIC_SITE_URL` dengan domain final. `gaharu.org` di sitemap, robots.txt, dan Organization schema adalah domain yang direncanakan, **belum diverifikasi atau didaftarkan**. Perbarui ketiganya bila domain berubah.

## Materi sebelum go-live

- `src/assets/gaharu-logo.svg` adalah **rekonstruksi vektor**, bukan file logo asli pada lampiran. Mark dibundel langsung ke JavaScript supaya tidak lagi menjadi kotak kosong pada preview maupun halaman dengan URL bertingkat. Untuk menggantinya dengan gambar kedua yang persis, diperlukan file PNG/JPG/SVG aslinya di `public/` dan `VITE_GAHARU_LOGO_URL=/nama-berkas.png` (atau `.svg`); header, footer, dan favicon akan memakai file itu. Bila tautan file bermasalah, mark bawaan tetap terlihat sebagai cadangan.
- Foto lebar halaman Tentang Kami sekarang memakai `public/images/kunjungan-mangrove-gaharu.jpg`, rekonstruksi AI sementara berdasarkan foto referensi yang terlihat pada percakapan. File lampiran asli tidak tersedia di folder proyek, jadi visual ini **bukan salinan foto aslinya**. Jalankan `node --env-file=.env.local scripts/update-about.mjs` untuk memperbarui gambar halaman Tentang Kami pada dataset Sanity; unggah dan pilih foto asli di Sanity jika tersedia.
- `public/images/pendidikan-lingkungan.jpg` adalah ilustrasi AI sementara dengan komposisi persemaian dan pelatihan yang mengikuti gambar lampiran. File lampiran asli tidak tersedia pada folder proyek. Ganti URL gambar sampul program tersebut di Sanity setelah foto asli tersedia.
- Foto Pexels pada `src/data/seed.json` adalah **ilustrasi**, bukan dokumentasi lapangan GAHARU. Halaman kredit foto mengungkapkan sumbernya. Unggah foto penanaman, kondisi tanaman, dan tim dari laporan asli melalui Sanity sebelum peluncuran.
- Teks studi kasus disusun dari angka PRD: laporan WASLAI (2020) dan P1 (2021). Cocokkan kembali dengan PDF asli sebelum publikasi. Angka 2021 adalah rentang antarpetak, bukan rata-rata tunggal atau kenaikan setiap petak yang sudah dipasangkan.
- Bagian sejarah mencantumkan kritik yang diatribusikan kepada catatan pendirian GAHARU dan angka historis deforestasi/GNRHL yang Anda berikan. Cocokkan angka, redaksi, serta rujukan Laporan KLHK dan BPK RI 2008 dengan dokumen sumber organisasi sebelum go-live.
- Alamat jalan, kontak person, nomor telepon, dan email sudah diisi sesuai profil yang diberikan. Konfirmasikan kembali kebenaran alamat dan persetujuan publikasi kontak person sebelum go-live. Struktur tim, legalitas, laporan PDF, dan tautan sosial masih menunggu materi resmi.
- Artikel contoh dan tanggal terbit pada seed perlu ditinjau Ahmad Jalaluddin sebelum go-live. Empat artikel Opini tidak diberi tanggal terbit karena tanggal sumber tidak tersedia. Bagian opini menandai ringkasan English dan memuat catatan bahwa dugaan maupun angka yang disebutkan adalah tulisan penulis, bukan verifikasi atau penetapan hukum redaksi. Jadwalkan pelatihan singkat Sanity Studio untuk pengelola konten.
- Sitemap mencakup halaman program, empat rumpun kerja baru, serta empat opini tambahan. Tambahkan URL artikel atau program baru ketika kontennya dipublikasikan.
- Rumpun program baru disajikan sebagai ruang lingkup kerja, bukan bukti bahwa proyek tertentu telah dilaksanakan. Pastikan lokasi, mitra, periode, dan capaian diverifikasi sebelum memublikasikan detail proyek.
- Analitik Plausible belum diaktifkan karena membutuhkan akun dan snippet unik untuk domain yang telah didaftarkan. Pasang snippet dari dashboard Plausible setelah domain final aktif; skrip terbarunya dapat mengikuti navigasi SPA berbasis History API.

## Peta Google Maps

Beranda, Wilayah Kerja, dan Kontak sekarang menggunakan peta Google Maps yang dimuat saat diperlukan. Pada halaman Wilayah Kerja, pemilihan Lahaji, Umba, Lemoambo, atau Kasakamu mengganti pencarian desa pada peta dan tautan **Buka di Google Maps**. Pencarian nama desa **bukan** koordinat bibit, titik tanam presisi, atau batas area rehabilitasi; peta kontak juga hanya menunjukkan area Raha, bukan lokasi kantor persis.

Tanpa konfigurasi tambahan, iframe memakai URL embed publik Google Maps. Untuk integrasi produksi yang didukung resmi, aktifkan **Maps Embed API** di Google Cloud, siapkan akun billing dan browser API key dengan pembatasan HTTP referrer serta pembatasan hanya ke Maps Embed API, lalu isi `VITE_GOOGLE_MAPS_EMBED_KEY` sebelum build. Embed API bebas biaya untuk permintaan peta tetapi tetap memerlukan key. Jika iframe tidak dapat diakses di jaringan pengunjung, tautan eksternal di bawah peta tetap dapat digunakan.

## Catatan teknis

Gambar memakai ukuran responsif, lazy loading di luar hero, dan CDN foto. Situs menggunakan meta title/description, canonical, hreflang, Organization dan Article JSON-LD, serta sitemap. Karena frontend berupa SPA Vite sesuai lingkungan proyek, konten halaman detail dirender di browser; bila SEO berbasis HTML pra-render menjadi syarat ketat, tambahkan prerender/SSR pada tahap berikutnya. Skor Lighthouse, ukuran halaman akhir dengan foto asli, dan pengiriman email belum dapat diverifikasi tanpa deployment serta aset final.