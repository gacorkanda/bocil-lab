import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

type Difficulty = "MUDAH" | "SEDANG" | "SULIT" | "LEGENDARY";

type Mission = {
  code: string;
  title: string;
  module: string;
  difficulty: Difficulty;
  brief: string;
  points: number;
  flag: string;
  hint: string;
  echo: string;
  /** Misi CTF Arena: diselesaikan di tab arena, bukan lewat submit flag. */
  arenaOnly?: boolean;
};

/** Katalog misi BOCIL LAB — flag hanya hidup di server, klien menerima versi tersamar. */
const MISSIONS: Mission[] = [
  {
    code: "REC-01",
    title: "Jejak di /var/log",
    module: "Recon & OSINT",
    difficulty: "MUDAH",
    brief:
      "Server latihan bocil lab menyimpan access log dengan nama file aneh. Temukan nama file mencurigakan di direktori log latihan.",
    points: 100,
    flag: "bocil{r3c0n_1s_p0w3r}",
    hint: "Misi recon pertama selalu soal file log yang namanya tidak biasa.",
    echo: "access.log terbaca... satu entry tidak seperti yang lain.",
  },
  {
    code: "REC-02",
    title: "Metadata Si Bocah",
    module: "Recon & OSINT",
    difficulty: "MUDAH",
    brief:
      "Foto profil si bocil menyimpan string identifikasi di tag EXIF Software: exif_d4ta_l3ak. Flag = bocil{string_tersebut}.",
    points: 150,
    flag: "bocil{exif_d4ta_l3ak}",
    hint: "EXIF membawa nama software pembuat foto sebagai identitas.",
    echo: "EXIF diekstrak... tag software menyerahkan dirinya.",
  },
  {
    code: "WEB-01",
    title: "Robots.txt Berbisik",
    module: "Web Exploitation",
    difficulty: "MUDAH",
    brief:
      "Cek file yang biasa dibaca robot di root domain latihan. Flag tercetak di baris komentar terakhirnya.",
    points: 150,
    flag: "bocil{d1sall0w_but_n0t_h1dden}",
    hint: "Semua crawler membaca satu file teks di / sebelum menjelajah.",
    echo: "robots.txt diambil... baris komentar terakhir berbinar.",
  },
  {
    code: "WEB-02",
    title: "Form Login Bodoh",
    module: "Web Exploitation",
    difficulty: "SEDANG",
    brief:
      "Halaman login latihan memvalidasi kredensial di sisi klien. Buka console, atau coba kredensial yang paling sering dipakai manusia.",
    points: 250,
    flag: "bocil{cl13nt_s1d3_n3v3r_s3cur3}",
    hint: "Validasi di browser hanyalah panggung — kebenarannya di console.",
    echo: "POST /login -> 200 OK... Auth bypass tercatat.",
  },
  {
    code: "WEB-03",
    title: "Payload Terenkode",
    module: "Web Exploitation",
    difficulty: "SEDANG",
    brief:
      "WAF lab menyimpan payload di cookie terenkode base64: Ym9jaWx7c2FuZGJveF9lc2NhcGV9. Dekode, lalu laporkan isinya sebagai flag.",
    points: 200,
    flag: "bocil{sandbox_escape}",
    hint: "Base64 selalu berakhir dengan karakter dari set A-Za-z0-9+/ dan padding =.",
    echo: "Base64 didekode... payload WAF mengaku.",
  },
  {
    code: "CRY-01",
    title: "Rotasi 13 Ajaib",
    module: "Kriptografi",
    difficulty: "MUDAH",
    brief:
      "Pesan lama di papan buletin lab dienkripsi ROT13. Dekripsi teks ini: obpvy{pynffvp}. Kunci rotasi = jumlah huruf alfabet dibagi dua.",
    points: 150,
    flag: "bocil{classic}",
    hint: "ROT13 memutar alfabet tepat setengah putaran.",
    echo: "ROT13 diterapkan... pesan papan buletin terbaca.",
  },
  {
    code: "CRY-02",
    title: "Sinyal Binari",
    module: "Kriptografi",
    difficulty: "SEDANG",
    brief:
      "Intersep transmisi lab: 01101100 01100001 01100010. Konversi tiap oktet biner ke ASCII — hasilnya adalah nama tempat kita berlatih. Kirim sebagai flag: bocil{hasil}.",
    points: 200,
    flag: "bocil{lab}",
    hint: "Setiap 8 bit adalah satu huruf ASCII.",
    echo: "Transmisi diterjemahkan... sinyal biner berbunyi 'lab'.",
  },
  {
    code: "CRY-03",
    title: "Hash Terpotong",
    module: "Kriptografi",
    difficulty: "SEDANG",
    brief:
      "Dump database latihan menyimpan hash 128-bit: 81dc9bdb52d04dc20036dbd8313ed055. Identifikasi algoritmanya, crack plaintext-nya, lalu laporkan: bocil{plaintext}.",
    points: 250,
    flag: "bocil{1234}",
    hint: "Panjang 32 hex = MD5. Plaintextnya sandi yang paling terkenal lemah di dunia.",
    echo: "Rainbow table dijalankan... hash menyerah dalam 0,3 detik.",
  },
  {
    code: "FOR-01",
    title: "Kapal Kertas Berlubang",
    module: "Forensik Digital",
    difficulty: "SEDANG",
    brief:
      "File gambar latihan tidak bisa dibuka — signature-nya diubah jadi kapal. Perbaiki magic bytes PNG lalu temukan flag di dalam gambar.",
    points: 250,
    flag: "bocil{m4g1c_byt3s_r3st0r3d}",
    hint: "PNG selalu dimulai dengan 89 50 4E 47.",
    echo: "Magic bytes dipulihkan... payload PNG terbaca utuh.",
  },
  {
    code: "FOR-02",
    title: "Paket Tersembunyi",
    module: "Forensik Digital",
    difficulty: "SULIT",
    brief:
      "Capture jaringan latihan berisi ping biasa, tapi satu paket menyelundupkan data di bagian payload ICMP. Cari flag terenkode di sana.",
    points: 350,
    flag: "bocil{p4ylo4d_smuggl3r}",
    hint: "ICMP bisa membawa lebih dari sekadar echo request.",
    echo: "pcap diurai... payload ICMP menyerahkan rahasianya.",
  },
  {
    code: "CRD-01",
    title: "Lintasan Kaki Merah",
    module: "Coding & Logic",
    difficulty: "SULIT",
    brief:
      "Grid 1000x1000 lab dipenuhi lintasan. Tulis program kecil untuk menghitung langkah minimal dari pojok kiri-atas ke kanan-bawah tanpa menabrak tembok, lalu laporkan sebagai flag dengan pola bocil{angka_langkah}.",
    points: 400,
    flag: "bocil{1998}",
    hint: "Di grid berbobot sama, BFS selalu menemukan jalan terpendek.",
    echo: "Solver dijalankan... lintasan optimal ditemukan: 1998 langkah.",
  },
  {
    code: "CRD-02",
    title: "Kata Sandi Anak Ayam",
    module: "Coding & Logic",
    difficulty: "SEDANG",
    brief:
      "Bruteforce kamus kecil: sandi terdiri dari kata 'ayam' diikuti angka 00-99. Simulasi dictionary attack latihan dan laporkan sandi lengkapnya.",
    points: 300,
    flag: "bocil{4y4m_77}",
    hint: "Coba kombinasi kata + dua digit, urut dari 00.",
    echo: "Dictionary attack selesai... sandi ditemukan di percobaan ke-78.",
  },
  {
    code: "CTF-01",
    title: "Sesi Sandi Bergilir",
    module: "CTF Arena",
    difficulty: "SULIT",
    brief:
      "Buka tab CTF ARENA, tekan INITIALIZE SESSION, dan pecahkan sandi bergilir sebelum 60 menit habis. Flag dikirim dari tab sana.",
    points: 300,
    flag: "bocil{t3mp0ral_key}",
    hint: "Kuncinya berganti tiap sesi — jawabanmu juga.",
    echo: "CTF session closed... kunci bergilir ditaklukkan tepat waktu.",
    arenaOnly: true,
  },
  {
    code: "CTF-02",
    title: "Operasi Tengah Malam",
    module: "CTF Arena",
    difficulty: "LEGENDARY",
    brief:
      "Misi legendaris. Mulai di tab CTF ARENA, decode stage-1 base64, ekstrak angka rahasia dari stage-2, dan laporkan: bocil{angka}. Satu kesempatan per kunci — jangan sampai expired.",
    points: 500,
    flag: "bocil{midnight_protocol}",
    hint: "Stage-1 adalah base64. Stage-2: angka lahir dari seed sesimu.",
    echo: "Midnight protocol selesai... kamu resmi legendaris.",
    arenaOnly: true,
  },
];

const XP_MULTIPLIER: Record<Difficulty, number> = {
  MUDAH: 1,
  SEDANG: 1.25,
  SULIT: 1.5,
  LEGENDARY: 2,
};

function xpFor(mission: Mission) {
  return Math.round(mission.points * XP_MULTIPLIER[mission.difficulty]);
}

export const missionCount = query({
  args: {},
  handler: async () => MISSIONS.length,
});

export const missions = query({
  args: {},
  handler: async () =>
    MISSIONS.map((m) => ({
      code: m.code,
      title: m.title,
      module: m.module,
      difficulty: m.difficulty,
      brief: m.brief,
      points: m.points,
      flagPreview: `${m.flag.slice(0, 6)}${"*".repeat(18)}`,
      hint: m.hint,
    })),
});

export const myProgress = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { solvedCodes: [] as string[], totalSolved: 0, xp: 0 };
    }
    const solved = await ctx.db
      .query("missionProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const solvedCodes = solved.map((p) => p.missionCode);
    const xp = solvedCodes.reduce((sum, code) => {
      const mission = MISSIONS.find((m) => m.code === code);
      return mission ? sum + xpFor(mission) : sum;
    }, 0);
    return { solvedCodes, totalSolved: solvedCodes.length, xp };
  },
});

export const labStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("missionProgress").collect();
    const operatives = new Set(all.map((p) => p.userId));
    const totalXp = all.reduce((sum, p) => {
      const mission = MISSIONS.find((m) => m.code === p.missionCode);
      return mission ? sum + xpFor(mission) : sum;
    }, 0);
    return {
      operatives: operatives.size,
      flagsCaptured: all.length,
      totalXp,
    };
  },
});

export const submitFlag = mutation({
  args: { code: v.string(), flag: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        status: "error" as const,
        message: "ACCESS DENIED — autentikasi dibutuhkan.",
      };
    }
    const mission = MISSIONS.find((m) => m.code === args.code);
    if (!mission) {
      return {
        status: "error" as const,
        message: `MISI TIDAK DITEMUKAN: ${args.code}`,
      };
    }
    if (mission.arenaOnly) {
      return {
        status: "error" as const,
        message: "Misi ini hanya bisa diselesaikan di tab CTF ARENA.",
      };
    }
    const normalized = args.flag.trim();
    if (normalized.toLowerCase() !== mission.flag.toLowerCase()) {
      return {
        status: "wrong" as const,
        message: "FLAG SALAH — decompile ulang logikamu.",
        hint: mission.hint,
      };
    }
    const existing = await ctx.db
      .query("missionProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (existing.some((p) => p.missionCode === args.code)) {
      return {
        status: "duplicate" as const,
        message: "Misi ini sudah kamu taklukkan sebelumnya.",
      };
    }
    await ctx.db.insert("missionProgress", {
      userId,
      missionCode: args.code,
      solvedAt: Date.now(),
    });
    const gained = xpFor(mission);
    return {
      status: "solved" as const,
      message: `FLAG DITERIMA — ${mission.title} cleared! +${gained} XP`,
      xpGained: gained,
      flag: mission.flag,
      echo: mission.echo,
    };
  },
});
