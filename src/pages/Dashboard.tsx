import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Crosshair,
  Flag,
  KeyRound,
  LogOut,
  Play,
  Radar,
  Skull,
  Swords,
  Target,
  Timer,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const DIFF_STYLE: Record<string, string> = {
  MUDAH: "border-chart-4/40 text-chart-4 bg-chart-4/10",
  SEDANG: "border-chart-2/40 text-chart-2 bg-chart-2/10",
  SULIT: "border-chart-3/40 text-chart-3 bg-chart-3/10",
  LEGENDARY: "border-destructive/40 text-destructive bg-destructive/10",
};

type MissionView = {
  code: string;
  title: string;
  module: string;
  difficulty: string;
  brief: string;
  points: number;
  flagPreview: string;
  hint: string;
  /** Misi CTF Arena: diselesaikan di tab arena, bukan submit flag. */
  arenaOnly?: boolean;
};

type ToolView = {
  id: string;
  name: string;
  codename: string;
  desc: string;
  category: string;
  severity: string;
  avgSeconds: number;
};

type ScanResult = {
  status: "done" | "error";
  toolName?: string;
  durationMs?: number;
  summary?: string;
  findings?: string[];
  message?: string;
};

type CtfState =
  | { active: false }
  | {
      active: true;
      key: string;
      startedAt: number;
      expiresAt: number;
      ctf01Solved: boolean;
      ctf02Solved: boolean;
      data: { chainInput: string; stage1: string };
    };

const RANKS = [
  { min: 0, name: "Script Kiddie", emoji: "🐣" },
  { min: 200, name: "Byte Beginner", emoji: "🔧" },
  { min: 500, name: "Net Runner", emoji: "🛰️" },
  { min: 900, name: "Cipher Breaker", emoji: "🔐" },
  { min: 1400, name: "Shadow Coder", emoji: "🕶️" },
  { min: 2000, name: "Hacker Bocil Legendary", emoji: "👑" },
];

function rankFor(xp: number) {
  let current = RANKS[0];
  let next: (typeof RANKS)[number] | null = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].min) {
      current = RANKS[i];
      next = RANKS[i + 1] ?? null;
    }
  }
  const span = next ? next.min - current.min : 1;
  const pct = next ? Math.min(100, Math.round(((xp - current.min) / span) * 100)) : 100;
  return { current, next, pct };
}

type ConsoleLine = { text: string; tone: "ok" | "err" | "info" };

function useCountdown(expiresAt: number | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [expiresAt]);
  if (!expiresAt) return null;
  const remaining = Math.max(0, expiresAt - now);
  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);
  return { expired: remaining <= 0, label: `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}` };
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"misi" | "tools" | "ctf">("misi");

  const missions = useQuery(api.lab.missions);
  const progress = useQuery(api.lab.myProgress);
  const stats = useQuery(api.lab.labStats);
  const tools = useQuery(api.tools.listTools);
  const myScans = useQuery(api.tools.myScans);
  const ctfState = useQuery(api.ctf.sessionState);
  const submitFlag = useMutation(api.lab.submitFlag);
  const startScan = useMutation(api.tools.startScan);
  const startSession = useMutation(api.ctf.startSession);
  const solveCtf01 = useMutation(api.ctf.solveCtf01);
  const solveCtf02 = useMutation(api.ctf.solveCtf02);

  /* ------------------------------ misi state ------------------------------ */
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [flagValue, setFlagValue] = useState("");
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { status: string; message: string }>>({});
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([
    { tone: "ok", text: "konsol lab siap. pilih misi di papan sebelah." },
  ]);

  const solvedSet = useMemo(
    () => new Set(progress?.solvedCodes ?? []),
    [progress?.solvedCodes],
  );
  const xp = progress?.xp ?? 0;
  const total = missions?.length ?? 0;
  const solvedCount = progress?.totalSolved ?? 0;
  const { current: rank, next: nextRank, pct } = rankFor(xp);

  const pushConsole = (lines: ConsoleLine[]) =>
    setConsoleLines((prev) => [...prev.slice(-40), ...lines]);

  const handleSubmit = async (code: string) => {
    const flag = flagValue.trim();
    if (!flag) return;
    setBusyCode(code);
    try {
      const result = (await submitFlag({ code, flag })) as {
        status: string;
        message: string;
        hint?: string;
        echo?: string;
      };
      setResults((prev) => ({ ...prev, [code]: result }));
      if (result.status === "solved") {
        setFlagValue("");
        pushConsole([
          { tone: "ok", text: `[${code}] ${result.message}` },
          ...(result.echo
            ? [{ tone: "info" as const, text: `  ↳ ${result.echo}` }]
            : []),
        ]);
        toast.success(result.message);
        setOpenCode(null);
      } else if (result.status === "duplicate") {
        pushConsole([{ tone: "info", text: `[${code}] ${result.message}` }]);
      } else {
        pushConsole([
          { tone: "err", text: `[${code}] ${result.message}` },
          ...(result.hint
            ? [{ tone: "info" as const, text: `  ↳ hint: ${result.hint}` }]
            : []),
        ]);
      }
    } finally {
      setBusyCode(null);
    }
  };

  /* ------------------------------ tools state ----------------------------- */
  const [activeTool, setActiveTool] = useState<ToolView | null>(null);
  const [target, setTarget] = useState("sandbox.bocil-lab.local");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const runTool = async (tool: ToolView) => {
    setActiveTool(tool);
    setScanResult(null);
    if (!target.trim()) {
      toast.error("Isi target dulu, operative.");
      return;
    }
    setScanning(true);
    pushConsole([{ tone: "info", text: `[${tool.name}] running → ${target}` }]);
    try {
      const result = (await startScan({
        toolId: tool.id,
        target: target.trim(),
      })) as ScanResult;
      setScanResult(result);
      if (result.status === "done") {
        pushConsole([{ tone: "ok", text: `[${tool.name}] ${result.summary}` }]);
        toast.success(`${tool.name} selesai — ${result.summary}`);
      } else {
        pushConsole([{ tone: "err", text: `[${tool.name}] ${result.message}` }]);
      }
    } finally {
      setScanning(false);
    }
  };

  /* -------------------------------- ctf state ------------------------------ */
  const [answer01, setAnswer01] = useState("");
  const [answer02, setAnswer02] = useState("");
  const countdown = useCountdown(
    ctfState?.active ? ctfState.expiresAt : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  );

  const handleInitialize = async () => {
    const res = (await startSession({})) as { status: string; message?: string };
    if (res.status === "started") {
      toast.success("Sesi CTF dimulai — kunci baru digenerasi. 60 menit di hitung.");
    }
    setAnswer01("");
    setAnswer02("");
  };

  const handleSolve = async (
    which: "01" | "02",
    answer: string,
    reset: () => void,
  ) => {
    if (!answer.trim()) return;
    const mutation = which === "01" ? solveCtf01 : solveCtf02;
    const res = (await mutation({ answer })) as {
      status: string;
      message: string;
    };
    if (res.status === "solved") {
      toast.success(res.message);
      pushConsole([{ tone: "ok", text: `[CTF-${which}] ${res.message}` }]);
      reset();
    } else if (res.status === "duplicate") {
      toast.info(res.message);
    } else if (res.status === "wrong") {
      toast.error(res.message);
      pushConsole([{ tone: "err", text: `[CTF-${which}] ${res.message}` }]);
    } else {
      toast.error(res.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <main className="relative min-h-screen">
      <div className="circuit-bg pointer-events-none absolute inset-0 opacity-40" />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded border border-primary/40 bg-primary/10 text-primary">
              <Skull className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-sm font-extrabold tracking-widest glow-text">
                BOCIL<span className="text-primary">LAB</span>
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">konsol operative</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded border border-border bg-card/70 px-3 py-1.5 font-mono text-xs sm:flex">
              <Zap className="size-3.5 text-primary" />
              <span className="font-bold text-primary">{xp}</span>
              <span className="text-muted-foreground">XP</span>
              <span className="text-border">|</span>
              <span className="text-foreground">{rank.emoji} {rank.name}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-border font-mono"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-8">
        {/* Operative header */}
        <div className="hud-corners glow-box relative overflow-hidden rounded-lg border border-border bg-card/80 p-6">
          <div className="scan-beam absolute inset-0" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
                <Radar className="size-7" />
              </span>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  operative aktif
                </p>
                <h1 className="font-display text-2xl font-black tracking-wide glow-text">
                  {user?.name?.trim() || user?.email?.split("@")[0] || "Anon Bocil"}
                </h1>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {rank.emoji} {rank.name}
                  {nextRank && ` → ${nextRank.name} @ ${nextRank.min} XP`}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 font-mono lg:min-w-[340px]">
              <div>
                <p className="text-2xl font-bold text-primary glow-text-soft">{solvedCount}/{total}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">misi clear</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-chart-2 glow-text-soft">{xp}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">total xp</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats?.operatives ?? 1}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">operative</p>
              </div>
            </div>
          </div>
          <div className="relative mt-5">
            <Progress value={pct} className="h-2 bg-secondary" />
            <p className="mt-1.5 text-right font-mono text-[10px] text-muted-foreground">
              {nextRank
                ? `${nextRank.min - xp} XP menuju ${nextRank.name}`
                : "pangkat maksimal — kamu legendaris 🏆"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-lg border border-border bg-card/60 p-1 font-mono text-sm">
          {(
            [
              ["misi", "PAPAN MISI", Flag],
              ["tools", "TOOLBOX", Crosshair],
              ["ctf", "CTF ARENA", Swords],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 font-bold tracking-wider transition-colors ${
                tab === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* ------------------------------- TAB: MISI ------------------------------ */}
        {tab === "misi" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]"
          >
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="terminal-prompt font-mono text-sm font-bold tracking-wider text-primary">
                  papan misi
                </h2>
                <p className="font-mono text-xs text-muted-foreground">
                  klik misi untuk submit flag
                </p>
              </div>
              <div className="space-y-3">
                {!missions &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-card/60" />
                  ))}
                {missions?.map((m: MissionView) => {
                  const solved = solvedSet.has(m.code);
                  const open = openCode === m.code;
                  const result = results[m.code];
                  return (
                    <Card
                      key={m.code}
                      className={`overflow-hidden border-border/70 bg-card/80 transition-colors ${
                        solved ? "border-primary/40" : open ? "border-primary/50" : ""
                      }`}
                    >
                      <div
                        className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left"
                        onClick={() => {
                          if (m.arenaOnly === undefined) setOpenCode(open ? null : m.code);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setOpenCode(open ? null : m.code);
                        }}
                      >
                        <span
                          className={`flex size-10 shrink-0 items-center justify-center rounded border ${
                            solved
                              ? "border-primary/50 bg-primary/15 text-primary"
                              : "border-border bg-secondary/60 text-muted-foreground"
                          }`}
                        >
                          {solved ? (
                            <CheckCircle2 className="size-5" />
                          ) : (
                            <Flag className="size-5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">{m.code}</span>
                            <CardTitle className="font-mono text-sm font-bold tracking-wide">
                              {m.title}
                            </CardTitle>
                            {solved && (
                              <Badge variant="outline" className="border border-primary/40 bg-primary/10 text-primary">
                                CLEAR
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                            {m.module} • {m.arenaOnly !== undefined ? "diselesaikan di tab CTF ARENA" : m.brief}
                          </p>
                        </div>
                        <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                          <span className={`rounded border px-2 py-0.5 font-mono text-[11px] font-bold ${DIFF_STYLE[m.difficulty]}`}>
                            {m.difficulty}
                          </span>
                          <span className="font-mono text-xs text-chart-2">+{m.points} XP</span>
                        </div>
                        {m.arenaOnly === undefined && (
                          <ChevronRight
                            className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
                          />
                        )}
                      </div>

                      <AnimatePresence initial={false}>
                        {open && m.arenaOnly === undefined && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            <div className="border-t border-border/70 px-5 py-4">
                              <p className="font-mono text-sm leading-6 text-foreground">{m.brief}</p>
                              <p className="mt-2 font-mono text-xs text-muted-foreground">
                                format flag: {m.flagPreview}
                              </p>
                              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                <Input
                                  value={flagValue}
                                  onChange={(e) => setFlagValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !busyCode) handleSubmit(m.code);
                                  }}
                                  placeholder="bocil{...}"
                                  className="border-input bg-background/60 font-mono text-sm placeholder:text-muted-foreground/50"
                                  disabled={busyCode === m.code || solved}
                                  spellCheck={false}
                                />
                                <Button
                                  type="button"
                                  className="font-mono font-bold tracking-wide"
                                  disabled={busyCode === m.code || solved || !flagValue.trim()}
                                  onClick={() => handleSubmit(m.code)}
                                >
                                  <Target className="size-4" />
                                  {busyCode === m.code ? "VERIFY..." : "SUBMIT"}
                                </Button>
                              </div>
                              {result && result.status !== "solved" && (
                                <p className="mt-3 font-mono text-xs text-destructive">✗ {result.message}</p>
                              )}
                              {solved && (
                                <p className="mt-3 font-mono text-xs text-primary">
                                  ✓ misi ini sudah kamu taklukkan.
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="hud-corners scanlines glow-box relative overflow-hidden rounded-lg border border-border bg-card/90">
                <div className="flex items-center gap-2 border-b border-border/70 bg-secondary/60 px-4 py-2.5">
                  <CircleDot className="size-3.5 text-destructive" />
                  <CircleDot className="size-3.5 text-chart-2" />
                  <CircleDot className="size-3.5 text-primary" />
                  <span className="ml-2 font-mono text-xs text-muted-foreground">lab-console — live</span>
                </div>
                <div className="scan-beam relative h-72 space-y-1 overflow-y-auto p-4 font-mono text-[12.5px] leading-relaxed">
                  {consoleLines.map((l, i) => (
                    <p
                      key={i}
                      className={
                        l.tone === "ok"
                          ? "text-primary"
                          : l.tone === "err"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }
                    >
                      {l.text}
                    </p>
                  ))}
                  <p className="text-primary">
                    bocil@lab:~$ <span className="cursor-blink inline-block h-3.5 w-2 bg-primary align-middle" />
                  </p>
                </div>
              </div>

              <Card className="border-border/70 bg-card/80">
                <CardHeader className="pb-3">
                  <CardTitle className="font-mono text-sm font-bold tracking-wide text-primary">
                    🏆 PANGKAT OPERATIVE
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 font-mono text-xs">
                  {RANKS.map((r) => (
                    <div
                      key={r.name}
                      className={`flex items-center justify-between rounded border px-3 py-1.5 ${
                        xp >= r.min ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      }`}
                    >
                      <span>{r.emoji} {r.name}</span>
                      <span className="text-[10px]">{r.min}+ XP</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </aside>
          </motion.div>
        )}

        {/* ------------------------------ TAB: TOOLBOX ---------------------------- */}
        {tab === "tools" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]"
          >
            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="terminal-prompt font-mono text-sm font-bold tracking-wider text-primary">
                  toolbox otomatis
                </h2>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">target:</span>
                  <Input
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="h-8 w-52 border-input bg-background/60 font-mono text-xs sm:w-64"
                    spellCheck={false}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {!tools &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-32 animate-pulse rounded-lg border border-border bg-card/60" />
                  ))}
                {tools?.map((t: ToolView) => {
                  const isActive = activeTool?.id === t.id;
                  return (
                    <Card
                      key={t.id}
                      className={`hud-corners border-border/70 bg-card/80 transition-colors hover:border-primary/40 ${
                        isActive ? "border-primary/50" : ""
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="font-mono text-sm font-bold tracking-wide">
                            {t.name}
                          </CardTitle>
                          <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                            {t.category}
                          </Badge>
                        </div>
                        <p className="font-mono text-[11px] text-muted-foreground/70">
                          gaya {t.codename} • ~{t.avgSeconds}s
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs leading-5 text-muted-foreground">{t.desc}</p>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-3 w-full font-mono font-bold tracking-wider"
                          disabled={scanning}
                          onClick={() => runTool(t)}
                        >
                          <Play className="size-4" />
                          {scanning && isActive ? "RUNNING..." : "RUN"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Output panel */}
              {activeTool && (
                <div className="hud-corners scanlines glow-box mt-6 overflow-hidden rounded-lg border border-border bg-card/90">
                  <div className="flex items-center justify-between border-b border-border/70 bg-secondary/60 px-4 py-2.5 font-mono text-xs">
                    <span className="text-foreground">{activeTool.name} — output</span>
                    <span className="text-muted-foreground">target: {target}</span>
                  </div>
                  <div className="relative min-h-40 space-y-1 p-4 font-mono text-[12.5px] leading-relaxed">
                    {scanning && (
                      <p className="text-muted-foreground">
                        mengeksekusi modul... <span className="cursor-blink inline-block h-3 w-2 bg-primary align-middle" />
                      </p>
                    )}
                    {!scanning && scanResult?.status === "done" && (
                      <>
                        <p className="text-primary">[+] {scanResult.summary}</p>
                        {scanResult.findings?.map((f, i) => (
                          <p key={i} className="text-muted-foreground">{f}</p>
                        ))}
                        <p className="pt-2 text-[11px] text-muted-foreground/70">
                          durasi simulasi: {((scanResult.durationMs ?? 0) / 1000).toFixed(1)}s • sandbox • target sama = hasil sama
                        </p>
                      </>
                    )}
                    {!scanning && scanResult?.status === "error" && (
                      <p className="text-destructive">✗ {scanResult.message}</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <Card className="border-border/70 bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="font-mono text-sm font-bold tracking-wide text-primary">
                    RIWAYAT SCAN
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 font-mono text-xs">
                  {!myScans && <p className="text-muted-foreground">memuat…</p>}
                  {myScans && myScans.length === 0 && (
                    <p className="text-muted-foreground">
                      belum ada scan — jalankan tool pertamamu.
                    </p>
                  )}
                  {myScans?.slice(0, 8).map((s) => (
                    <div
                      key={s._id}
                      className="rounded border border-border bg-background/40 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-foreground">{s.toolId} → {s.target}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {s.durationMs ? `${(s.durationMs / 1000).toFixed(1)}s` : ""}
                        </span>
                      </div>
                      {s.summary && (
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{s.summary}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </aside>
          </motion.div>
        )}

        {/* ------------------------------ TAB: CTF ARENA -------------------------- */}
        {tab === "ctf" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]"
          >
            <section>
              {!ctfState?.active ? (
                <Card className="hud-corners glow-box border-border bg-card/80 p-10 text-center">
                  <Swords className="mx-auto size-10 text-primary" />
                  <h2 className="font-display mt-4 text-2xl font-bold tracking-wide">
                    CTF ARENA
                  </h2>
                  <p className="mx-auto mt-3 max-w-md font-mono text-sm leading-6 text-muted-foreground">
                    Tekan INITIALIZE SESSION — lab menghasilkan kunci acak yang hanya
                    kamu tahu. Decoding tanpa hafalan, 60 menit di hitung.
                  </p>
                  <Button
                    type="button"
                    size="lg"
                    className="mx-auto mt-6 font-mono font-bold tracking-wider"
                    onClick={handleInitialize}
                  >
                    <Timer className="size-5" /> INITIALIZE SESSION
                  </Button>
                  <p className="mt-4 font-mono text-[11px] text-muted-foreground/70">
                    kunci expired otomatis dalam 60 menit
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Session header */}
                  <div className="hud-corners glow-box flex flex-col gap-3 rounded-lg border border-border bg-card/80 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-mono text-sm">
                      <p className="text-muted-foreground">
                        SESSION KEY: <span className="text-foreground">{ctfState.key.slice(0, 6)}…{ctfState.key.slice(-2)}</span>
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        jawaban dihitung dari kunci ini — unik untuk sesimu
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded border px-3 py-1.5 font-mono text-lg font-bold ${
                          countdown?.expired ? "border-destructive/50 text-destructive" : "border-primary/50 text-primary"
                        }`}
                      >
                        {countdown?.label ?? "60:00"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border font-mono"
                        onClick={handleInitialize}
                      >
                        RESET
                      </Button>
                    </div>
                  </div>

                  {/* CTF-01 */}
                  <Card className={`border-border/70 bg-card/80 ${ctfState.ctf01Solved ? "border-primary/40" : ""}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-mono text-sm font-bold tracking-wide">
                          CTF-01 — SANDI BERGILIR
                        </CardTitle>
                        <Badge variant="outline" className={`font-mono text-[11px] font-bold ${DIFF_STYLE["SULIT"]}`}>
                          SULIT
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="font-mono text-sm">
                      <p className="text-muted-foreground">
                        Chain input (ROT13 → base64):
                      </p>
                      <p className="mt-1 break-all rounded border border-border bg-background/60 px-3 py-2 text-primary">
                        {ctfState.data.chainInput}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        decode base64 → rot13 balik → kirim codeword hasilnya
                      </p>
                      {ctfState.ctf01Solved ? (
                        <p className="mt-3 text-primary">✓ CLEARED — flag lama tidak berlaku; XP kamu sudah dicatat.</p>
                      ) : (
                        <div className="mt-3 flex gap-2">
                          <Input
                            value={answer01}
                            onChange={(e) => setAnswer01(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSolve("01", answer01, () => setAnswer01(""));
                            }}
                            placeholder="codeword..."
                            className="border-input bg-background/60 text-sm"
                            spellCheck={false}
                            disabled={!!countdown?.expired}
                          />
                          <Button
                            type="button"
                            className="font-mono font-bold tracking-wide"
                            disabled={!answer01.trim() || !!countdown?.expired}
                            onClick={() => handleSolve("01", answer01, () => setAnswer01(""))}
                          >
                            <KeyRound className="size-4" /> KIRIM
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* CTF-02 */}
                  <Card className={`border-border/70 bg-card/80 ${ctfState.ctf02Solved ? "border-primary/40" : ""}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-mono text-sm font-bold tracking-wide">
                          CTF-02 — OPERASI TENGAH MALAM
                        </CardTitle>
                        <Badge variant="outline" className={`font-mono text-[11px] font-bold ${DIFF_STYLE["LEGENDARY"]}`}>
                          LEGENDARY
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="font-mono text-sm">
                      <p className="text-muted-foreground">Stage-1 payload:</p>
                      <p className="mt-1 break-all rounded border border-border bg-background/60 px-3 py-2 text-primary">
                        {ctfState.data.stage1}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        dekode base64 → temukan SECRET_NUMBER → kirim angkanya. Selesai = misi legendarismu.
                      </p>
                      {ctfState.ctf02Solved ? (
                        <p className="mt-3 text-primary">✓ CLEARED — kamu resmi legendaris. 🏆</p>
                      ) : (
                        <div className="mt-3 flex gap-2">
                          <Input
                            value={answer02}
                            onChange={(e) => setAnswer02(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSolve("02", answer02, () => setAnswer02(""));
                            }}
                            placeholder="angka rahasia..."
                            className="border-input bg-background/60 text-sm"
                            spellCheck={false}
                            disabled={!!countdown?.expired}
                          />
                          <Button
                            type="button"
                            className="font-mono font-bold tracking-wide"
                            disabled={!answer02.trim() || !!countdown?.expired}
                            onClick={() => handleSolve("02", answer02, () => setAnswer02(""))}
                          >
                            <Target className="size-4" /> KIRIM
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {countdown?.expired && (
                    <p className="rounded border border-destructive/40 bg-destructive/10 px-4 py-3 text-center font-mono text-xs text-destructive">
                      ⏱ sesi expired — tekan RESET untuk kunci baru
                    </p>
                  )}
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <div className="hud-corners scanlines glow-box relative overflow-hidden rounded-lg border border-border bg-card/90">
                <div className="flex items-center gap-2 border-b border-border/70 bg-secondary/60 px-4 py-2.5">
                  <CircleDot className="size-3.5 text-destructive" />
                  <CircleDot className="size-3.5 text-chart-2" />
                  <CircleDot className="size-3.5 text-primary" />
                  <span className="ml-2 font-mono text-xs text-muted-foreground">lab-console — live</span>
                </div>
                <div className="scan-beam relative h-72 space-y-1 overflow-y-auto p-4 font-mono text-[12.5px] leading-relaxed">
                  {consoleLines.map((l, i) => (
                    <p
                      key={i}
                      className={
                        l.tone === "ok"
                          ? "text-primary"
                          : l.tone === "err"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }
                    >
                      {l.text}
                    </p>
                  ))}
                  <p className="text-primary">
                    bocil@lab:~$ <span className="cursor-blink inline-block h-3.5 w-2 bg-primary align-middle" />
                  </p>
                </div>
              </div>

              <Card className="border-border/70 bg-card/80">
                <CardHeader className="pb-3">
                  <CardTitle className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
                    Aturan Arena
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 font-mono text-xs leading-5 text-muted-foreground">
                  <p>› kunci baru tiap INITIALIZE — jawaban lama hangus</p>
                  <p>› sesi aktif 60 menit, lalu expired tanpa ampun</p>
                  <p>› CTF-01 +450 XP • CTF-02 +1000 XP (LEGENDARY)</p>
                  <p>› XP masuk otomatis ke papan misi saat solved</p>
                </CardContent>
              </Card>
            </aside>
          </motion.div>
        )}
      </div>
    </main>
  );
}
