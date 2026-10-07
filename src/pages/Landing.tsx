import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Skull,
  TerminalSquare,
  ChevronRight,
  Radar,
  Globe,
  KeyRound,
  FileSearch,
  Code2,
  Flag,
  CircleDot,
  Sparkles,
  Crosshair,
  Bug,
  Swords,
  Binary,
  Timer,
  Bomb,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ---------------------------------- data ---------------------------------- */

const BOOT_LINES = [
  "[ 0.000000] bocil-lab bios v5.0 — sinematik mode",
  "[ 0.113456] memuat toolbox: recon, vuln, exploit, hash, decoder",
  "[ 0.287001] ctf arena: siap — kunci bergilir tiap sesi",
  "[ 0.409220] sandbox terenkripsi: AKTIF",
  "[ 0.700455] mode bocil: ON — belajar dulu, ngehack kemudian",
  "[ 0.812399] welcome, operative. akses diberikan.",
];

const MODULES = [
  {
    icon: Radar,
    code: "MOD-01",
    name: "Recon & OSINT",
    desc: "Membaca jejak digital: log, metadata, dan informasi terbuka. Mata elang dulu, keyboard kemudian.",
  },
  {
    icon: Globe,
    code: "MOD-02",
    name: "Web Exploitation",
    desc: "Bedah cara kerja website dan cari celahnya di aplikasi latihan milik lab — aman dan legal.",
  },
  {
    icon: KeyRound,
    code: "MOD-03",
    name: "Kriptografi",
    desc: "ROT13, biner, hash, base64. Menyandikan, memecahkan, dan memahami kenapa enkripsi penting.",
  },
  {
    icon: FileSearch,
    code: "MOD-04",
    name: "Forensik Digital",
    desc: "Investigasi file rusak, magic bytes, dan paket jaringan. Detektif versi keyboard.",
  },
  {
    icon: Code2,
    code: "MOD-05",
    name: "Coding & Logic",
    desc: "Solver BFS, dictionary attack, dan puzzle algoritma yang bikin otot otak membesar.",
  },
];

const TOOL_ICONS: Record<string, typeof Radar> = {
  recon: Radar,
  vuln: Bug,
  exploit: Bomb,
  hash: KeyRound,
  decode: Binary,
};

const STEPS = [
  {
    no: "01",
    title: "Daftar masuk lab",
    desc: "Klik MASUK LAB, buat identitas operative-mu. Tanpa ribet, langsung dapat akses konsol.",
  },
  {
    no: "02",
    title: "Scan & exploit",
    desc: "Jalankan 5 tools otomatis di target sandbox: recon port, scanner kerentanan, exploit runner, cracker, decoder.",
  },
  {
    no: "03",
    title: "Panen flag",
    desc: "14 misi berflag dari 6 modul — termasuk CTF Arena berbatas waktu dengan kunci bergilir.",
  },
  {
    no: "04",
    title: "Naik pangkat",
    desc: "Kumpulkan XP sampai pangkat Hacker Bocil Legendary. Progress tersimpan di akunmu.",
  },
];

const FAQS = [
  {
    q: "Apakah tools di lab ini nyata?",
    a: "Toolsnya meniru cara kerja tools sungguhan (nmap, nessus, metasploit, hashcat, cyberchef) tapi seluruh scan adalah simulasi deterministik di server lab. Tidak ada paket jaringan yang dikirim ke sistem mana pun — 100% aman dan legal.",
  },
  {
    q: "Apa itu CTF Arena?",
    a: "Arena tantangan berbatas waktu 60 menit. Setiap sesi menghasilkan kunci acak baru, jadi jawaban tidak bisa dihafal atau dibagikan. Ada dua tantangan: decoding rantai dan operasi legendaris dua stage.",
  },
  {
    q: "Apakah BOCIL LAB legal dan aman?",
    a: "100% aman. Semua misi dan tools berjalan di sandbox buatan sendiri — tidak ada server nyata yang disentuh. Kamu melatih cara berpikir ethical hacking, bukan merusak milik orang lain.",
  },
  {
    q: "Umur berapa yang bisa ikut?",
    a: "Dibuat ramah untuk anak-anak dan remaja (8+), tapi semua umur boleh. Bahasa misi sengaja receh dan mudah dicerna.",
  },
  {
    q: "Kalau mentok gimana?",
    a: "Setiap misi punya petunjuk yang muncul kalau flag salah, dan semua tools bisa dipakai berkali-kali untuk menggali petunjuk. Gagal itu bagian dari debug.",
  },
];

const DIFF_STYLE: Record<string, string> = {
  MUDAH: "border-chart-4/40 text-chart-4 bg-chart-4/10",
  SEDANG: "border-chart-2/40 text-chart-2 bg-chart-2/10",
  SULIT: "border-chart-3/40 text-chart-3 bg-chart-3/10",
  LEGENDARY: "border-destructive/40 text-destructive bg-destructive/10",
};

/* --------------------------------- helpers -------------------------------- */

function useTypedLines(lines: string[], speed = 18, startDelay = 0) {
  const [doneCount, setDoneCount] = useState(0);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    let cancelled = false;
    let lineTimer: number | undefined;
    let charTimer: number | undefined;

    const typeLine = (index: number) => {
      if (cancelled) return;
      const line = lines[index] ?? "";
      let c = 0;
      charTimer = window.setInterval(() => {
        if (cancelled) return;
        c++;
        setCurrent(line.slice(0, c));
        if (c >= line.length) {
          window.clearInterval(charTimer);
          setDoneCount(index + 1);
          setCurrent("");
          if (index + 1 < lines.length) {
            lineTimer = window.setTimeout(() => typeLine(index + 1), 130);
          }
        }
      }, speed);
    };

    lineTimer = window.setTimeout(() => typeLine(0), startDelay);
    return () => {
      cancelled = true;
      window.clearTimeout(lineTimer);
      window.clearInterval(charTimer);
    };
  }, [lines, speed, startDelay]);

  return { doneCount, current, finished: doneCount >= lines.length };
}

function MatrixRain({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const chars = "アイウエオカキクケコサシスセソ0123456789$#@%&BOCIL";
    const fontSize = 14;
    let columns = 0;
    let drops: number[] = [];
    let raf = 0;
    let last = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth || 300;
      canvas.height = canvas.offsetHeight || 150;
      columns = Math.max(1, Math.floor(canvas.width / fontSize));
      drops = Array.from({ length: columns }, () => Math.random() * -60);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 66) return;
      last = t;
      // Jejak abu terang di atas latar gelap — bukan hijau neon
      ctx.fillStyle = "rgba(21, 20, 18, 0.16)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() < 0.03 ? "rgba(235, 165, 60, 0.85)" : "rgba(200, 195, 185, 0.5)";
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}

function BootIntro({ onDone }: { onDone: () => void }) {
  const { doneCount, current, finished } = useTypedLines(BOOT_LINES, 14, 200);

  useEffect(() => {
    if (finished) {
      const t = window.setTimeout(onDone, 650);
      return () => window.clearTimeout(t);
    }
  }, [finished, onDone]);

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6"
    >
      <MatrixRain className="absolute inset-0 h-full w-full opacity-20" />
      <div className="scanlines relative w-full max-w-2xl font-mono text-sm text-primary/90">
        <div className="space-y-1.5">
          {BOOT_LINES.slice(0, doneCount).map((line) => (
            <p key={line} className="glow-text-soft">
              {line}
            </p>
          ))}
          {!finished && current && (
            <p className="glow-text-soft">
              {current}
              <span className="cursor-blink ml-0.5 inline-block h-3.5 w-2 bg-primary align-middle" />
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDone}
          className="mt-8 text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          [ skip boot ]
        </button>
      </div>
    </motion.div>
  );
}

type TerminalLine = { kind: "cmd" | "out" | "warn" | "ok"; text: string };

const TERMINAL_HELP = [
  "perintah tersedia:",
  "  help        — lihat daftar perintah",
  "  ls          — lihat isi direktori lab",
  "  cat robots.txt — baca file robots",
  "  whoami      — cek identitasmu",
  "  scan        — pindai port lab",
  "  tools       — daftar tools otomatis",
  "  ctf         — info CTF Arena",
  "  flag        — info soal flag",
  "  clear       — bersihkan layar",
];

function LabTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { kind: "ok", text: "BOCIL LAB sandbox terminal v2.0 — ketik 'help' buat mulai." },
  ]);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    const echo: TerminalLine = { kind: "cmd", text: `bocil@lab:~$ ${cmd}` };
    const out: TerminalLine[] = [];
    const key = cmd.toLowerCase();

    if (key === "clear") {
      setLines([{ kind: "ok", text: "layar dibersihkan. konsol siap." }]);
      setValue("");
      return;
    }
    if (!key) {
      setValue("");
      return;
    }
    if (key === "help") {
      out.push(...TERMINAL_HELP.map((text) => ({ kind: "out" as const, text })));
    } else if (key === "ls") {
      out.push(
        { kind: "out", text: "tools/  misi/  log/  robots.txt  rahasia/" },
        { kind: "warn", text: "folder 'rahasia/' — permission denied (coba misi di dashboard)" },
      );
    } else if (key === "tools") {
      out.push(
        { kind: "out", text: "BOCILSCAN Recon      — pindai port & servis" },
        { kind: "out", text: "VULNPRISMA Scanner   — deteksi kerentanan web" },
        { kind: "out", text: "EXPLOIT-KID Runner   — simulasi exploit sandbox" },
        { kind: "out", text: "HASHMAU Cracker      — crack hash lemah" },
        { kind: "out", text: "DECYPHER Multidecoder — dekode semua lapisan" },
        { kind: "ok", text: "semua tools bisa dipakai di dashboard — gratis" },
      );
    } else if (key === "ctf") {
      out.push(
        { kind: "out", text: "CTF ARENA — tantangan 60 menit, kunci bergilir tiap sesi" },
        { kind: "warn", text: "sesi tidak bisa dihafal dan tidak bisa dibagikan" },
        { kind: "ok", text: "2 tantangan menunggu di dashboard — mulai kapan saja" },
      );
    } else if (key === "cat robots.txt") {
      out.push(
        { kind: "out", text: "User-agent: *" },
        { kind: "out", text: "Disallow: /rahasia" },
        { kind: "ok", text: "# bocil{d1sall0w_but_n0t_h1dden}" },
        { kind: "warn", text: "tunggu... itu flag! submit di dashboard misi WEB-01 🚩" },
      );
    } else if (key === "whoami") {
      out.push(
        { kind: "out", text: "bocil-anonymous" },
        { kind: "warn", text: "status: belum login — operative asli daftar via MASUK LAB" },
      );
    } else if (key === "scan") {
      out.push(
        { kind: "out", text: "memindai bocil-lab.local ..." },
        { kind: "out", text: "PORT    22   [SSH]    terbuka (sandbox)" },
        { kind: "out", text: "PORT    80   [HTTP]   terbuka (sandbox)" },
        { kind: "ok", text: "PORT  1337   [LAB]    TERDETEKSI — akses via /dashboard" },
      );
    } else if (key === "flag") {
      out.push(
        { kind: "out", text: "flag disimpan di server latihan lab." },
        { kind: "out", text: "selesaikan misi di dashboard untuk mengambilnya: bocil{...}" },
      );
    } else if (key.startsWith("sudo")) {
      out.push(
        { kind: "warn", text: "bocil is not in the sudoers file." },
        { kind: "warn", text: "insiden ini akan dilaporkan ke ibu guru. 😅" },
      );
    } else if (key.startsWith("rm")) {
      out.push({ kind: "warn", text: "ditolak. di lab bocil, yang kita hapus cuma keraguan." });
    } else {
      out.push(
        { kind: "warn", text: `perintah tidak dikenal: ${cmd} — ketik 'help'` },
      );
    }

    setLines((prev) => [...prev.slice(-80), echo, ...out]);
    setValue("");
  };

  return (
    <div className="hud-corners scanlines glow-box relative overflow-hidden rounded-lg border border-border bg-card/90">
      <div className="flex items-center gap-2 border-b border-border/70 bg-secondary/60 px-4 py-2.5">
        <CircleDot className="size-3.5 text-destructive" />
        <CircleDot className="size-3.5 text-chart-2" />
        <CircleDot className="size-3.5 text-primary" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          bocil-lab — /bin/sandbox — 80x24
        </span>
      </div>
      <div
        className="scan-beam relative h-64 cursor-text space-y-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed sm:h-72"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, i) => (
          <p
            key={i}
            className={
              line.kind === "cmd"
                ? "text-foreground"
                : line.kind === "ok"
                  ? "text-primary glow-text-soft"
                  : line.kind === "warn"
                    ? "text-chart-2/90"
                    : "text-muted-foreground"
            }
          >
            {line.text}
          </p>
        ))}
        <div className="flex items-center gap-2 text-foreground">
          <span className="shrink-0 text-primary">bocil@lab:~$</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(value);
            }}
            className="w-full bg-transparent font-mono text-[13px] text-foreground caret-transparent outline-none"
            aria-label="Terminal input"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="cursor-blink -ml-2 h-4 w-2 shrink-0 bg-primary" />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

/* --------------------------------- sections -------------------------------- */

function SectionHeading({
  prompt,
  title,
  desc,
}: {
  prompt: string;
  title: string;
  desc?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55 }}
      className="mx-auto max-w-2xl text-center"
    >
      <p className="terminal-prompt font-mono text-sm text-primary glow-text-soft">
        {prompt}
      </p>
      <h2 className="font-display mt-3 text-3xl font-bold tracking-wide sm:text-4xl">
        {title}
      </h2>
      {desc && (
        <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
          {desc}
        </p>
      )}
    </motion.div>
  );
}

function Nav({ labStats }: { labStats: { operatives: number; flagsCaptured: number } }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded border border-primary/40 bg-primary/10 text-primary">
            <Skull className="size-5" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-widest glow-text">
            BOCIL<span className="text-primary">LAB</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 font-mono text-sm text-muted-foreground md:flex">
          <a href="#modul" className="transition-colors hover:text-primary">./modul</a>
          <a href="#tools" className="transition-colors hover:text-primary">./tools</a>
          <a href="#ctf" className="transition-colors hover:text-primary">./ctf-arena</a>
          <a href="#faq" className="transition-colors hover:text-primary">./faq</a>
          <span className="hidden text-xs lg:inline text-primary/70">
            online: {labStats.operatives} | flag: {labStats.flagsCaptured}
          </span>
        </nav>
        <Button
          asChild
          size="sm"
          className="font-mono font-bold tracking-wide"
        >
          <Link to="/auth?returnTo=%2Fdashboard">
            MASUK LAB <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}

function Hero({
  stats,
}: {
  stats: { operatives: number; flagsCaptured: number; totalXp: number } | undefined;
}) {
  return (
    <section className="vignette relative overflow-hidden pt-16">
      <MatrixRain className="absolute inset-0 h-full w-full opacity-[0.1]" />
      <div className="circuit-bg absolute inset-0 opacity-50" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 font-mono text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            sandbox 100% aman • simulasi legal
          </div>
          <h1 className="font-display mt-6 text-4xl font-black leading-tight tracking-wide sm:text-5xl lg:text-6xl">
            <span className="glitch glow-text" data-text="BOCIL LAB">
              BOCIL LAB
            </span>
            <br />
            <span className="text-muted-foreground">laboratorium</span>{" "}
            <span className="text-primary glow-text">hacker</span>{" "}
            <span className="text-muted-foreground">bocil</span>
          </h1>
          <p className="mt-6 max-w-xl font-mono text-sm leading-7 text-muted-foreground sm:text-base">
            Tools otomatis untuk scan kerentanan, exploit simulator, dan CTF Arena
            berkunci bergilir — semua dalam satu lab sinematik yang aman. Kumpulkan
            flag, naikkan XP, jadi{" "}
            <span className="text-primary">Hacker Bocil Legendary</span>.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="font-mono font-bold tracking-wider">
              <Link to="/auth?returnTo=%2Fdashboard">
                <TerminalSquare className="size-5" /> MULAI HACKING — GRATIS
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-border font-mono font-bold tracking-wider hover:bg-secondary hover:text-foreground"
            >
              <a href="#tools">
                <Crosshair className="size-5" /> LIHAT TOOLBOX
              </a>
            </Button>
          </div>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-3 font-mono">
            {[
              { label: "operative", value: stats?.operatives ?? 0 },
              { label: "flag didapat", value: stats?.flagsCaptured ?? 0 },
              { label: "total XP lab", value: stats?.totalXp ?? 0 },
            ].map((s) => (
              <div
                key={s.label}
                className="hud-corners rounded border border-border bg-card/70 px-3 py-2.5"
              >
                <p className="text-lg font-bold text-primary glow-text-soft">
                  {s.value}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <LabTerminal />
          <p className="mt-3 text-center font-mono text-xs text-muted-foreground">
            ↑ terminal beneran bisa diketik — coba <span className="text-primary">help</span>,{" "}
            <span className="text-primary">tools</span>, atau{" "}
            <span className="text-primary">sudo hack</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Modules() {
  return (
    <section id="modul" className="circuit-bg relative border-y border-border/60 py-24">
      <div className="mx-auto w-full max-w-6xl px-4">
        <SectionHeading
          prompt="./kurikulum --list"
          title="6 MODUL LATIHAN"
          desc="Dari mengintip jejak sampai menulis solver — semua disajikan sebagai misi yang bisa dimainkan, termasuk CTF Arena berbatas waktu."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => (
            <motion.div
              key={m.code}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group hud-corners relative rounded-lg border border-border bg-card/80 p-6 transition-all hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded border border-border bg-secondary/60 text-primary transition-colors group-hover:border-primary/40">
                  <m.icon className="size-5" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">{m.code}</span>
              </div>
              <h3 className="font-display mt-5 text-lg font-bold tracking-wide">{m.name}</h3>
              <p className="mt-2.5 text-sm leading-6 text-muted-foreground">{m.desc}</p>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col justify-between rounded-lg border border-primary/30 bg-primary/5 p-6"
          >
            <div>
              <span className="flex size-11 items-center justify-center rounded border border-primary/30 bg-primary/10 text-primary">
                <Swords className="size-5" />
              </span>
              <h3 className="font-display mt-5 text-lg font-bold tracking-wide">CTF Arena</h3>
              <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                Tantangan 60 menit dengan kunci yang berganti tiap sesi. Hafalan tidak berguna — hanya skill.
              </p>
            </div>
            <Button asChild className="mt-6 w-full font-mono font-bold tracking-wide">
              <Link to="/auth?returnTo=%2Fdashboard">AMBIL AKSES</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Toolbox() {
  const tools = useQuery(api.tools.listTools);
  return (
    <section id="tools" className="py-24">
      <div className="mx-auto w-full max-w-6xl px-4">
        <SectionHeading
          prompt="./toolbox --run"
          title="5 TOOLS OTOMATIS"
          desc="Antarmuka ala Kali Linux — pilih tool, arahkan ke target sandbox, baca hasilnya. Semua simulasi deterministik: target sama, hasil sama."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(tools ?? []).map((t, i) => {
            const Icon = TOOL_ICONS[t.id] ?? Crosshair;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group hud-corners rounded-lg border border-border bg-card/80 p-6 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded border border-border bg-secondary/60 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="rounded border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t.category}
                  </span>
                </div>
                <h3 className="font-display mt-5 text-base font-bold tracking-wide">{t.name}</h3>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground/70">
                  gaya {t.codename} • ~{t.avgSeconds}s
                </p>
                <p className="mt-2.5 text-sm leading-6 text-muted-foreground">{t.desc}</p>
              </motion.div>
            );
          })}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col justify-between rounded-lg border border-dashed border-border bg-transparent p-6"
          >
            <div>
              <span className="flex size-11 items-center justify-center rounded border border-border bg-secondary/60 text-muted-foreground">
                <Sparkles className="size-5" />
              </span>
              <h3 className="font-display mt-5 text-base font-bold tracking-wide text-muted-foreground">
                Wireshark-nya bocil
              </h3>
              <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                Analisis paket interaktif masih digarap. Sambil menunggu, coba misi FOR-02.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="mt-6 w-full border-border font-mono font-bold tracking-wide"
            >
              <Link to="/auth?returnTo=%2Fdashboard">BUKA TOOLBOX</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CtfArena() {
  return (
    <section id="ctf" className="relative overflow-hidden border-y border-border/60 bg-card/40 py-24">
      <MatrixRain className="absolute inset-0 h-full w-full opacity-[0.06]" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 lg:grid-cols-[1fr_1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
        >
          <p className="terminal-prompt font-mono text-sm text-primary glow-text-soft">
            ./ctf-arena --live
          </p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-wide sm:text-4xl">
            CTF ARENA — 60 MENIT
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
            Tekan INITIALIZE SESSION, lab menghasilkan kunci acak untukmu saja.
            Decode rantainya sebelum waktu habis. Selesai = XP langsung masuk —
            termasuk misi <span className="text-primary">LEGENDARY</span> dua stage.
          </p>
          <ul className="mt-6 space-y-3 font-mono text-sm text-muted-foreground">
            <li className="flex items-center gap-3">
              <Timer className="size-4 shrink-0 text-primary" /> kunci expired dalam 60 menit — tekan ulang untuk sesi baru
            </li>
            <li className="flex items-center gap-3">
              <Binary className="size-4 shrink-0 text-primary" /> rantai ROT13 + base64 + ekstraksi payload
            </li>
            <li className="flex items-center gap-3">
              <Swords className="size-4 shrink-0 text-primary" /> kunci tidak bisa dihafal atau dibagikan — jawabanmu unik
            </li>
          </ul>
          <div className="mt-8">
            <Button asChild size="lg" className="font-mono font-bold tracking-wider">
              <Link to="/auth?returnTo=%2Fdashboard">
                <Flag className="size-5" /> MASUK ARENA
              </Link>
            </Button>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="hud-corners scanlines glow-box rounded-lg border border-border bg-card/90 p-6 font-mono text-sm"
        >
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">contoh sesi</span>
            <span className="text-xs text-primary">59:41</span>
          </div>
          <div className="mt-4 space-y-2.5 text-[13px] leading-relaxed">
            <p className="text-muted-foreground">SESSION KEY: <span className="text-foreground">a3f19c…e2</span></p>
            <p className="text-muted-foreground">CHAIN INPUT:</p>
            <p className="text-primary glow-text-soft break-all">b2Jwdnl7bnlyZWNvfQ==</p>
            <p className="text-muted-foreground">TASK: decode rantai → kirim codeword</p>
            <p className="text-chart-4">[+] solved in 04:12 — +450 XP</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Arsenal() {
  const missions = useQuery(api.lab.missions);
  return (
    <section id="arsenal" className="py-24">
      <div className="mx-auto w-full max-w-6xl px-4">
        <SectionHeading
          prompt="./arsenal --misi"
          title="14 MISI BERFLAG"
          desc="Dari MUDAH sampai LEGENDARY — 12 misi berflag + 2 tantangan CTF Arena yang diselesaikan langsung di arenanya."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {(missions ?? []).map((m, i) => (
            <motion.div
              key={m.code}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 2) * 0.08 }}
              className="group flex items-start justify-between gap-4 rounded-lg border border-border bg-card/80 p-5 transition-colors hover:border-primary/40"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-primary">{m.code}</span>
                  <h3 className="font-mono text-sm font-bold tracking-wide">{m.title}</h3>
                </div>
                <p className="mt-1.5 truncate font-mono text-xs text-muted-foreground">
                  {m.module} — {m.flagPreview}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span
                  className={`rounded border px-2 py-0.5 font-mono text-[11px] font-bold ${DIFF_STYLE[m.difficulty]}`}
                >
                  {m.difficulty}
                </span>
                <span className="font-mono text-xs text-chart-2">+{m.points} XP</span>
              </div>
            </motion.div>
          ))}
          {!missions && (
            <div className="col-span-full space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-card/60" />
              ))}
            </div>
          )}
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg" variant="outline" className="border-border font-mono font-bold tracking-wider hover:bg-secondary hover:text-foreground">
            <Link to="/auth?returnTo=%2Fdashboard">
              BUKA PAPAN MISI <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="cara" className="border-y border-border/60 bg-card/40 py-24">
      <div className="mx-auto w-full max-w-6xl px-4">
        <SectionHeading
          prompt="./cara-kerja --run"
          title="EMPAT LANGKAH JADI HACKER"
        />
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.no}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative border-l-2 border-primary/30 pl-5"
            >
              <span className="absolute -left-[9px] top-0 size-4 rounded-full border-2 border-primary bg-background" />
              <p className="font-mono text-xs text-primary">STEP_{s.no}</p>
              <h3 className="font-display mt-2 text-base font-bold tracking-wide">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="border-t border-border/60 py-24">
      <div className="mx-auto w-full max-w-3xl px-4">
        <SectionHeading prompt="./faq --tanya" title="PERTANYAAN OPERATIVE" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12"
        >
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border/70">
                <AccordionTrigger className="text-left font-mono text-sm font-bold tracking-wide hover:text-primary hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="vignette relative overflow-hidden border-t border-border/60 py-24">
      <MatrixRain className="absolute inset-0 h-full w-full opacity-[0.07]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="relative mx-auto max-w-3xl px-4 text-center"
      >
        <Flag className="mx-auto size-8 text-primary/70" />
        <h2 className="font-display mt-5 text-3xl font-black tracking-wide sm:text-4xl">
          SIAP MASUK <span className="glitch glow-text" data-text="BOCIL LAB">BOCIL LAB</span>?
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-mono text-sm leading-7 text-muted-foreground">
          Daftar cuma butuh email (atau mode tamu). Kurang dari 30 detik kamu sudah
          berdiri di depan toolbox dan papan misi.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg" className="font-mono font-bold tracking-wider">
            <Link to="/auth?returnTo=%2Fdashboard">
              <TerminalSquare className="size-5" /> EXECUTE: MASUK LAB
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded border border-primary/40 bg-primary/10 text-primary">
            <Skull className="size-4" />
          </span>
          <div>
            <p className="font-display text-sm font-bold tracking-widest">
              BOCIL<span className="text-primary">LAB</span>
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              © 2026 — hack yang baik, baik hati.
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-6 font-mono text-xs text-muted-foreground">
          <a href="#tools" className="hover:text-primary">tools</a>
          <a href="#ctf" className="hover:text-primary">ctf arena</a>
          <a href="#faq" className="hover:text-primary">faq</a>
          <Link to="/auth?returnTo=%2Fdashboard" className="text-primary hover:underline">
            masuk lab
          </Link>
        </nav>
      </div>
    </footer>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default function Landing() {
  const [booted, setBooted] = useState(false);
  const stats = useQuery(api.lab.labStats);

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {!booted && <BootIntro onDone={() => setBooted(true)} />}
      </AnimatePresence>

      <Nav
        labStats={{
          operatives: stats?.operatives ?? 0,
          flagsCaptured: stats?.flagsCaptured ?? 0,
        }}
      />

      <main>
        <Hero stats={stats} />
        <Modules />
        <Toolbox />
        <CtfArena />
        <Arsenal />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
