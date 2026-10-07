import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Tools otomatis BOCIL LAB — semua "scan" adalah SIMULASI deterministik
 * (seeded PRNG + template per tool) yang berjalan di server Convex.
 * Tidak ada paket jaringan nyata yang dikirim — 100% aman untuk bocil.
 */

type ToolDef = {
  id: string;
  name: string;
  codename: string;
  desc: string;
  category: string;
  minMs: number;
  maxMs: number;
  severity: "info" | "low" | "medium" | "high" | "critical";
  build: (rand: () => number, target: string) => { summary: string; findings: string[] };
};

/** PRNG deterministik: hasil scan selalu sama untuk target yang sama. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  return h;
}

function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function int(rand: () => number, min: number, max: number) {
  return min + Math.floor(rand() * (max - min + 1));
}

const TOOLS: ToolDef[] = [
  {
    id: "recon",
    name: "BOCILSCAN Recon",
    codename: "nmap-style",
    desc: "Pindai port, servis, dan OS fingerprint dari target sandbox.",
    category: "RECON",
    minMs: 900,
    maxMs: 2200,
    severity: "info",
    build: (rand, target) => {
      const ports = [
        21, 22, 25, 80, 443, 1337, 3000, 3306, 5432, 6379, 8080, 8443, 9001,
      ];
      const chosen = [...new Set([80, 443, ...Array.from({ length: int(rand, 2, 5) }, () => pick(rand, ports))])].sort(
        (a, b) => a - b,
      );
      const services: Record<number, string> = {
        21: "ftp", 22: "ssh", 25: "smtp", 80: "http", 443: "https",
        1337: "lab-ctf", 3000: "node-app", 3306: "mysql", 5432: "postgres",
        6379: "redis", 8080: "http-proxy", 8443: "https-alt", 9001: "tor-orport",
      };
      const findings = [
        `Target: ${target} (sandbox) — OS: Linux 5.15 (simulasi)`,
        ...chosen.map((p) => `PORT ${p}/tcp OPEN — ${services[p] ?? "unknown"}`),
        `Engine version guessed: ${pick(rand, ["nginx/1.24.0", "Apache/2.4.57", "Caddy/2.7"])}`,
      ];
      return {
        summary: `${chosen.length} port terbuka pada ${target}`,
        findings,
      };
    },
  },
  {
    id: "vuln",
    name: "VULNPRISMA Scanner",
    codename: "nessus-style",
    desc: "Deteksi kerentanan web umum: injection, XSS, misconfig, TLS lemah.",
    category: "VULNERABILITY",
    minMs: 1400,
    maxMs: 3000,
    severity: "high",
    build: (rand, target) => {
      const vulns = [
        ["SQL Injection (error-based)", "high", "Parameter /product?id= menerima input tanpa sanitasi."],
        ["Reflected XSS", "medium", "Parameter q direfleksikan tanpa encoding."],
        ["Missing Security Headers", "low", "CSP, X-Frame-Options, dan HSTS tidak di-set."],
        ["Directory Listing", "medium", "/backup/ menampilkan isi direktori."],
        ["Weak TLS Cipher", "low", "TLS 1.0 masih menerima handshake."],
        ["IDOR pada /invoice", "high", "Akses objek tanpa validasi kepemilikan."],
        ["Outdated jQuery", "low", "jQuery 1.12 rentan XSS prototype pollution."],
        ["Open Redirect", "medium", "/logout?next= menerima domain eksternal."],
        ["Exposed .git", "high", "/.git/HEAD dapat diakses publik."],
        ["Default Credentials", "critical", "admin:admin diterima di halaman login."],
        ["Debug Endpoint Exposed", "medium", "/debug/vars memaparkan runtime metrics."],
      ] as const;
      const count = int(rand, 3, 6);
      const chosen = [...new Set(Array.from({ length: count }, () => int(rand, 0, vulns.length - 1)))].map(
        (i) => vulns[i],
      );
      const critical = chosen.filter(([, s]) => s === "critical").length;
      const high = chosen.filter(([, s]) => s === "high").length;
      return {
        summary: `${chosen.length} temuan: ${critical} critical, ${high} high, sisanya medium/low`,
        findings: chosen.map(
          ([name, sev, detail]) =>
            `[${sev.toUpperCase()}] ${name} — ${detail} (token: ${target.slice(0, 8)})`,
        ),
      };
    },
  },
  {
    id: "exploit",
    name: "EXPLOIT-KID Runner",
    codename: "metasploit-style",
    desc: "Jalankan exploit di sandbox: bukti konsep, LFI, SSTI, atau RCE simulator.",
    category: "EXPLOIT",
    minMs: 1200,
    maxMs: 2600,
    severity: "critical",
    build: (rand, target) => {
      const modules = [
        ["exploit/multi/http/lfi_to_rce", "LFI → RCE chain via log poisoning"],
        ["exploit/unix/webapp/ssti_jinja2", "SSTI di template engine sandbox"],
        ["exploit/linux/local/dirtycow", "Dirty COW privesc (simulasi)"],
        ["exploit/multi/http/deserialization", "Insecure deserialization gadget chain"],
        ["exploit/windows/smb/ms17_010", "EternalBlue (simulasi lab-only)"],
      ] as const;
      const [module, desc] = pick(rand, modules);
      const session = int(rand, 1, 8);
      const meterpreter = pick(rand, ["meterpreter x64/linux", "shell cmd/unix"]);
      return {
        summary: `${module} → sesi ${meterpreter} #${session} terbuka`,
        findings: [
          `[*] Menyiapkan payload untuk ${target}...`,
          `[*] Mengirim stage 1 (${int(rand, 512, 2048)} bytes)...`,
          `[+] Vulnerability confirmed: ${desc}`,
          `[+] Session ${session} opened (${meterpreter}) — SANDBOX`,
          `[*] sysinfo: lab-node-${int(rand, 1, 99)} | uptime ${int(rand, 1, 72)}h`,
          "[i] Bukti konsep tersimpan di arsip lab. Tidak ada sistem nyata yang disentuh.",
        ],
      };
    },
  },
  {
    id: "hash",
    name: "HASHMAU Cracker",
    codename: "hashcat-style",
    desc: "Crack hash lemah dengan kamus + aturan: MD5, SHA1, bcrypt (simulasi).",
    category: "CRYPTO",
    minMs: 1000,
    maxMs: 2400,
    severity: "medium",
    build: (rand) => {
      const cracked = [
        ["5f4dcc3b5aa765d61d8327deb882cf99", "password", "MD5"],
        ["7c4a8d09ca3762af61e59520943dc26494f8941b", "123456", "SHA1"],
        ["e10adc3949ba59abbe56e057f20f883e", "123456", "MD5"],
        ["25d55ad283aa400af464c76d713c07ad", "123456789", "MD5"],
        ["0192023a7bbd73250516f069df18b500", "admin123", "MD5"],
      ] as const;
      const [h, plain, algo] = pick(rand, cracked);
      const tries = int(rand, 1337, 999999);
      return {
        summary: `1 hash cracked (${algo}) — "${plain}" dalam ${tries} percobaan`,
        findings: [
          `Hash: ${h}`,
          `Algoritma terdeteksi: ${algo}`,
          `Mode: dictionary + best64.rule (GPU disimulasikan)`,
          `[+] Cracked: ${plain} — ${tries} attempts @ ${int(rand, 12, 980)} MH/s`,
          "[i] Pelajaran: sandi lemah mati dalam hitungan detik. Pakai passphrase panjang.",
        ],
      };
    },
  },
  {
    id: "decode",
    name: "DECYPHER Multidecoder",
    codename: "cyberchef-style",
    desc: "Identifikasi & dekode enkode otomatis: base64, hex, ROT13, URL, binary.",
    category: "CRYPTO",
    minMs: 600,
    maxMs: 1500,
    severity: "info",
    build: (rand, target) => {
      const layerCount = int(rand, 2, 4);
      const layers = ["base64", "hex", "ROT13", "URL-decode", "binary"].slice(0, layerCount);
      const payload = pick(rand, [
        "keep_your_flags_safe",
        "sandbox_is_home",
        "bocil_never_stops",
        "curiosity_wins",
      ]);
      const sample = "Zm9vYmFyIQ==";
      return {
        summary: `${layerCount} lapis enkode teridentifikasi & didekode`,
        findings: [
          `Input sample: ${sample} → "foobar!"`,
          `Deteksi rantai: ${layers.join(" → ")}`,
          `Konteks target: ${target.slice(0, 12)}`,
          `Payload rekonstruksi: "${payload}"`,
          "[i] Salin rantai ini ke misi CTF-mu yang terenkode.",
        ],
      };
    },
  },
] as ToolDef[];

export const listTools = query({
  args: {},
  handler: async () =>
    TOOLS.map((t) => ({
      id: t.id,
      name: t.name,
      codename: t.codename,
      desc: t.desc,
      category: t.category,
      severity: t.severity,
      avgSeconds: Math.round((t.minMs + t.maxMs) / 2000),
    })),
});

export const myScans = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return ctx.db
      .query("scanJobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

export const startScan = mutation({
  args: { toolId: v.string(), target: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { status: "error" as const, message: "Autentikasi dibutuhkan." };
    }
    const tool = TOOLS.find((t) => t.id === args.toolId);
    if (!tool) {
      return { status: "error" as const, message: `Tool tidak ditemukan: ${args.toolId}` };
    }
    const target = args.target.trim().slice(0, 80);
    if (!/^[a-zA-Z0-9.\-_/: ]+$/.test(target) || target.length < 3) {
      return {
        status: "error" as const,
        message: "Target hanya boleh berisi huruf, angka, titik, dash, dan slash.",
      };
    }
    const startedAt = Date.now();
    const durationMs = int(mulberry32(hashString(target + tool.id)), tool.minMs, tool.maxMs);
    const { summary, findings } = tool.build(
      mulberry32(hashString(target + tool.id)),
      target,
    );

    await ctx.db.insert("scanJobs", {
      userId,
      toolId: tool.id,
      target,
      status: "done",
      createdAt: startedAt,
      finishedAt: startedAt + durationMs,
      durationMs,
      findings,
      summary,
    });
    return {
      status: "done" as const,
      toolName: tool.name,
      durationMs,
      summary,
      findings,
      severity: tool.severity,
    };
  },
});
