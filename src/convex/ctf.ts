import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * CTF Arena — generator tantangan sesi (60 menit).
 * Setiap INITIALIZE menghasilkan kunci acak; jawaban dihitung dari kunci itu,
 * jadi tidak bisa dihafal dan tidak bisa dibagikan antar operative.
 */

const SESSION_TTL_MS = 60 * 60 * 1000;

const CODEWORDS = [
  "midnight", "shadow", "cipher", "phantom", "neon", "falcon",
  "onyx", "vortex", "quantum", "raven",
];

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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

function rot13(s: string) {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function newKey() {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Bangun data stage untuk sesi dari key acak. */
function buildStages(key: string) {
  const rand = mulberry32(hashString(key));
  const word = CODEWORDS[Math.floor(rand() * CODEWORDS.length)];
  const secretNumber = 1000 + Math.floor(rand() * 9000);

  // CTF-01: rantai ROT13 + base64 yang menyembunyikan codeword
  const chainInput = Buffer.from(rot13(word)).toString("base64");

  // CTF-02: stage-1 base64, stage-2 angka rahasia dari seed sesi
  const stage1 = Buffer.from(`SECRET_NUMBER=${secretNumber}`).toString("base64");

  return { word, secretNumber, chainInput, stage1 };
}

export const sessionState = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { active: false as const };
    }
    const rows = await ctx.db
      .query("ctfSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(5);
    const now = Date.now();
    const active = rows.find(
      (r) => !r.solved && now - r.startedAt < SESSION_TTL_MS,
    );
    if (!active) {
      return { active: false as const };
    }
    const stages = buildStages(active.key);
    return {
      active: true as const,
      key: active.key,
      startedAt: active.startedAt,
      expiresAt: active.startedAt + SESSION_TTL_MS,
      ctf01Solved: rows.some((r) => r.solved && r.missionCode === "CTF-01"),
      ctf02Solved: rows.some((r) => r.solved && r.missionCode === "CTF-02"),
      data: {
        chainInput: stages.chainInput,
        stage1: stages.stage1,
      },
    };
  },
});

export const startSession = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { status: "error" as const, message: "Autentikasi dibutuhkan." };
    }
    const key = newKey();
    await ctx.db.insert("ctfSessions", {
      userId,
      missionCode: "CTF",
      key,
      startedAt: Date.now(),
    });
    return { status: "started" as const, key };
  },
});

/** CTF-01: pemecah harus mengembalikan codeword hasil decode rantai. */
export const solveCtf01 = mutation({
  args: { answer: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { status: "error" as const, message: "Autentikasi dibutuhkan." };
    }
    const rows = await ctx.db
      .query("ctfSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(5);
    const session = rows.find(
      (r) => !r.solved && Date.now() - r.startedAt < SESSION_TTL_MS,
    );
    if (!session) {
      return {
        status: "error" as const,
        message: "Tidak ada sesi aktif — tekan INITIALIZE SESSION dulu.",
      };
    }
    const stages = buildStages(session.key);
    if (args.answer.trim().toLowerCase() !== stages.word) {
      return { status: "wrong" as const, message: "Jawaban salah — decode lagi." };
    }
    const solvedRows = await ctx.db
      .query("ctfSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (solvedRows.some((r) => r.solved && r.missionCode === "CTF-01")) {
      return { status: "duplicate" as const, message: "CTF-01 sudah pernah kamu selesaikan." };
    }
    await ctx.db.patch(session._id, { solved: true, missionCode: "CTF-01" });
    await ctx.db.insert("missionProgress", {
      userId,
      missionCode: "CTF-01",
      solvedAt: Date.now(),
    });
    return {
      status: "solved" as const,
      message: "CTF-01 CLEARED — +450 XP masuk ke papan misimu.",
    };
  },
});

/** CTF-02: pemecah harus mengembalikan angka rahasia dari stage base64. */
export const solveCtf02 = mutation({
  args: { answer: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { status: "error" as const, message: "Autentikasi dibutuhkan." };
    }
    const rows = await ctx.db
      .query("ctfSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(5);
    const session = rows.find(
      (r) => !r.solved && Date.now() - r.startedAt < SESSION_TTL_MS,
    );
    if (!session) {
      return {
        status: "error" as const,
        message: "Tidak ada sesi aktif — tekan INITIALIZE SESSION dulu.",
      };
    }
    const stages = buildStages(session.key);
    if (args.answer.trim() !== String(stages.secretNumber)) {
      return { status: "wrong" as const, message: "Angka salah — ekstrak ulang stage-1." };
    }
    const solvedRows = await ctx.db
      .query("ctfSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (solvedRows.some((r) => r.solved && r.missionCode === "CTF-02")) {
      return { status: "duplicate" as const, message: "CTF-02 sudah pernah kamu selesaikan." };
    }
    await ctx.db.patch(session._id, { solved: true, missionCode: "CTF-02" });
    await ctx.db.insert("missionProgress", {
      userId,
      missionCode: "CTF-02",
      solvedAt: Date.now(),
    });
    return {
      status: "solved" as const,
      message: "CTF-02 CLEARED — +1000 XP. Kamu resmi LEGENDARY. 🏆",
    };
  },
});
