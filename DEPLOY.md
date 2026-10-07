# Panduan Hosting BOCIL LAB di Vercel

BOCIL LAB terdiri dari 2 bagian:

| Bagian | Di-hosting di | Status |
|---|---|---|
| Frontend (React + Vite) | **Vercel** | ← yang mau kita setup |
| Database + Auth (Convex) | **Convex Cloud** | ✅ **SUDAH JALAN** — `https://honorable-kingfisher-591.convex.cloud` |

**Jadi database tidak perlu disiapkan lagi.** Semua data (misi, progress, XP,
akun) sudah tersimpan di Convex Cloud. Vercel hanya meng-host tampilannya, lalu
browser pengunjung terhubung langsung ke Convex.

---

## Langkah 1 — Push kode ke GitHub

Environment Freebuff tidak bisa menjalankan git (dikelola platform), jadi
download dulu source code proyek ini, lalu:

```bash
# di komputermu, setelah source ter-download
git init
git add .
git commit -m "BOCIL LAB — initial release"
git branch -M main
git remote add origin https://github.com/<username>/<nama-repo>.git
git push -u origin main
```

> ⚠️ Sebelum push, hapus `vly-toolbar-readonly.tsx` dari root (khusus preview
> Freebuff) lalu ganti importnya di `src/main.tsx`:
>
> ```tsx
> // hapus dua baris ini:
> // import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
> // <VlyToolbar />  (dan pembungkus ToolbarErrorBoundary-nya)
> ```
>
> Ini opsional tapi disarankan — toolbar tersebut hanya berguna di dalam
> editor Freebuff.

## Langkah 2 — Import proyek di Vercel

1. Buka [vercel.com/new](https://vercel.com/new) dan login (pakai GitHub).
2. Klik **Import** pada repo BOCIL LAB.
3. Vercel akan mendeteksi **Vite** otomatis. File `vercel.json` di repo sudah
   mengatur build (`npm run build`) dan SPA rewrite supaya `/dashboard` tidak
   404 saat di-refresh.

## Langkah 3 — Set Environment Variable (PENTING)

Sebelum klik Deploy, buka bagian **Environment Variables** di Vercel dan
tambahkan:

| Name | Value |
|---|---|
| `VITE_CONVEX_URL` | `https://honorable-kingfisher-591.convex.cloud` |

Tanpa variabel ini, halaman akan blank karena frontend tidak tahu ke mana
harus terhubung.

## Langkah 4 — Deploy 🚀

Klik **Deploy**. Build sudah diverifikasi sukses (`npm run build` ≈ 10 detik).
Setelah selesai, buka URL Vercel-mu — landing page, boot sequence, dan misi
harus jalan normal.

## Langkah 5 (sekali saja) — Izinkan domain Vercel di Convex Auth

Agar login (email OTP / guest) bekerja di domain Vercel, daftarkan URL
produksimu sebagai `CONVEX_SITE_URL`:

```bash
npx convex env set CONVEX_SITE_URL https://<proyekmu>.vercel.app
```

(Perintah di atas dijalankan di komputermu setelah `npm install`, atau set
melalui dashboard Convex → Settings → Environment Variables.)

> Ganti nilai ini juga jika kamu memakai custom domain.

---

## Ringkasan checklist

- [ ] Kode ter-push ke GitHub
- [ ] `VITE_CONVEX_URL` terisi di Vercel
- [ ] Deploy sukses, landing page tampil
- [ ] `CONVEX_SITE_URL` di Convex = domain Vercel
- [ ] Tes login guest → dashboard → submit flag ✅

## Biaya

Semua di atas **gratis** untuk skala kecil-menengah:

- **Vercel Hobby** — gratis, bandwidth cukup untuk ribuan kunjungan
- **Convex Free tier** — gratis, termasuk fungsi + database; cocok untuk
  ribuan misi terselesaikan

## Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| Halaman blank putih | `VITE_CONVEX_URL` belum diset | Tambahkan env var, redeploy |
| `/dashboard` 404 saat refresh | SPA rewrite hilang | Pastikan `vercel.json` ikut ter-push |
| Login tidak masuk / loop ke `/auth` | `CONVEX_SITE_URL` belum diganti ke domain produksi | Jalankan Langkah 5 |
| Data misi tidak muncul | Deployment Convex berbeda | Pastikan URL Convex sama dengan yang di-push |
