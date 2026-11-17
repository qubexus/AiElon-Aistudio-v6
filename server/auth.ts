/**
 * Accounts, sessions and the admin API for Ask Elon.
 *
 * - Passwords: scrypt with a per-user salt (never stored or logged in plain text).
 * - Sessions: HS256 tokens signed with JWT_SECRET, revocable through `tokenVersion`.
 * - Admin role: derived at request time from ADMIN_EMAILS, never stored in the database.
 * - Storage: one JSON file in DATA_DIR. It needs a persistent disk on the host.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { Express, NextFunction, Request, Response } from "express";

/* --------------------------------- config --------------------------------- */

const DATA_DIR = path.resolve(process.env.DATA_DIR || "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SESSION_DAYS = clampInt(process.env.SESSION_DAYS, 30, 1, 365);
const FREE_DAILY_QUESTIONS = clampInt(process.env.FREE_DAILY_QUESTIONS, 10, 0, 100000);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().has(email.trim().toLowerCase());
}

/* ---------------------------------- store --------------------------------- */

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  isPro: boolean;
  disabled: boolean;
  tokenVersion: number;
  usage: { day: string; today: number; total: number };
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

interface Db {
  users: UserRecord[];
  announcements: Announcement[];
}

let db: Db = { users: [], announcements: [] };
let writeChain: Promise<void> = Promise.resolve();

function loadDb(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(DB_FILE)) return;
  // A corrupt file must stop the server: starting empty would silently drop every account.
  const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Partial<Db>;
  db = {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
  };
}

/** Serialised, atomic write (temp file + rename) so a crash cannot leave a half-written file. */
function saveDb(): Promise<void> {
  const snapshot = JSON.stringify(db, null, 2);
  writeChain = writeChain
    .catch(() => undefined)
    .then(async () => {
      const tmp = `${DB_FILE}.${process.pid}.tmp`;
      await fs.promises.writeFile(tmp, snapshot, { mode: 0o600 });
      await fs.promises.rename(tmp, DB_FILE);
    });
  return writeChain;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function questionsToday(user: UserRecord): number {
  return user.usage.day === today() ? user.usage.today : 0;
}

/* ------------------------------ crypto helpers ----------------------------- */

function scrypt(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function safeEqualText(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

async function verifyPassword(user: UserRecord, password: string): Promise<boolean> {
  const candidate = await scrypt(password, user.salt);
  return safeEqual(candidate, Buffer.from(user.passwordHash, "hex"));
}

async function setPassword(user: UserRecord, password: string): Promise<void> {
  user.salt = crypto.randomBytes(16).toString("hex");
  user.passwordHash = (await scrypt(password, user.salt)).toString("hex");
  user.tokenVersion += 1; // signs out every existing session
}

let jwtSecret = "";

function resolveJwtSecret(): string {
  const fromEnv = (process.env.JWT_SECRET || "").trim();
  if (fromEnv.length >= 32) return fromEnv;
  if (IS_PRODUCTION) {
    throw new Error(
      "JWT_SECRET is missing or shorter than 32 characters. Set a long random value before starting in production."
    );
  }
  // Development only: keep a generated secret on disk so sessions survive restarts.
  const file = path.join(DATA_DIR, ".jwt");
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
  const generated = crypto.randomBytes(48).toString("hex");
  fs.writeFileSync(file, generated, { mode: 0o600 });
  return generated;
}

const b64url = (input: Buffer | string) => Buffer.from(input).toString("base64url");

function signToken(user: UserRecord): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({ sub: user.id, tv: user.tokenVersion, iat: now, exp: now + SESSION_DAYS * 86400 })
  );
  const signature = crypto.createHmac("sha256", jwtSecret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function userFromToken(token: string): UserRecord | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = crypto.createHmac("sha256", jwtSecret).update(`${header}.${payload}`).digest();
  if (!safeEqual(expected, Buffer.from(signature, "base64url"))) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: string;
      tv?: number;
      exp?: number;
    };
    if (!claims.sub || typeof claims.exp !== "number" || claims.exp * 1000 < Date.now()) return null;
    const user = db.users.find((u) => u.id === claims.sub);
    if (!user || user.disabled || user.tokenVersion !== claims.tv) return null;
    return user;
  } catch {
    return null;
  }
}

/* ------------------------- admin setup / recovery code --------------------- */

let adminSetupCode = "";

function initAdminSetupCode(): void {
  const fromEnv = (process.env.ADMIN_SETUP_CODE || "").trim();
  adminSetupCode = fromEnv || crypto.randomBytes(9).toString("base64url");
  if (adminEmails().size === 0) {
    console.warn("[auth] ADMIN_EMAILS is empty: nobody can open the admin panel.");
    return;
  }
  if (!fromEnv) {
    // Printed to the server log only. Whoever can read the host's logs owns the server anyway.
    console.log(
      `[auth] Admin setup code (needed to register or recover an ADMIN_EMAILS account, changes on restart): ${adminSetupCode}`
    );
  }
}

/* ------------------------------- rate limiting ----------------------------- */

const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}, 60_000).unref();

/* --------------------------------- helpers -------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

function passwordProblem(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8 || password.length > 200) return "weak_password";
  return null;
}

function publicUser(user: UserRecord) {
  const admin = isAdminEmail(user.email);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: admin,
    isPro: user.isPro || admin,
    createdAt: user.createdAt,
    questionsToday: questionsToday(user),
    dailyLimit: user.isPro || admin ? null : FREE_DAILY_QUESTIONS,
  };
}

function adminUserView(user: UserRecord) {
  return {
    ...publicUser(user),
    proGranted: user.isPro,
    disabled: user.disabled,
    lastLoginAt: user.lastLoginAt,
    lastActiveAt: user.lastActiveAt,
    questionsTotal: user.usage.total,
  };
}

function fail(res: Response, status: number, code: string): void {
  res.status(status).json({ error: code });
}

function bearer(req: Request): string | null {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

type AuthedRequest = Request & { user?: UserRecord };

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = bearer(req);
  const user = token ? userFromToken(token) : null;
  if (!user) return fail(res, 401, "unauthorized");
  (req as AuthedRequest).user = user;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const user = (req as AuthedRequest).user!;
    if (!isAdminEmail(user.email)) return fail(res, 403, "forbidden");
    next();
  });
}

/**
 * Guards the AI endpoints. A signed-in caller is held to the free daily limit, and with
 * `count` the delivered answer is added to their usage.
 * Anonymous callers are only rejected when REQUIRE_AUTH_FOR_AI=true, because the existing
 * web app has no server login and would otherwise stop working.
 */
export function aiGate(count: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = bearer(req);
    const user = token ? userFromToken(token) : null;

    if (!user) {
      if (token || process.env.REQUIRE_AUTH_FOR_AI === "true") return fail(res, 401, "unauthorized");
      return next();
    }

    const unlimited = user.isPro || isAdminEmail(user.email);
    if (count && !unlimited && questionsToday(user) >= FREE_DAILY_QUESTIONS) {
      return fail(res, 429, "daily_limit_reached");
    }

    if (count) {
      // Count only answers that were actually delivered, not failed calls.
      res.on("finish", () => {
        if (res.statusCode >= 400) return;
        const day = today();
        if (user.usage.day !== day) user.usage = { day, today: 0, total: user.usage.total };
        user.usage.today += 1;
        user.usage.total += 1;
        user.lastActiveAt = new Date().toISOString();
        saveDb().catch((err) => console.error("[auth] Failed to save usage:", err));
      });
    }
    next();
  };
}

/** Deletes the account after checking the password. Shared by the app and the public web form. */
export async function deleteAccountWithPassword(
  email: string,
  password: string
): Promise<"deleted" | "invalid_credentials"> {
  const user = db.users.find((u) => u.email === normEmail(email));
  if (!user || typeof password !== "string" || !(await verifyPassword(user, password))) {
    return "invalid_credentials";
  }
  db.users = db.users.filter((u) => u.id !== user.id);
  await saveDb();
  return "deleted";
}

export function attemptsExceeded(req: Request, scope: string, max: number, windowMs: number): boolean {
  return rateLimited(`${scope}:${req.ip}`, max, windowMs);
}

/* ---------------------------------- routes --------------------------------- */

export function registerAuthRoutes(app: Express): void {
  loadDb();
  jwtSecret = resolveJwtSecret();
  initAdminSetupCode();

  app.post("/api/auth/register", async (req, res) => {
    if (rateLimited(`register:${req.ip}`, 10, 60 * 60_000)) return fail(res, 429, "rate_limited");

    const { password, adminCode, acceptedTerms } = req.body || {};
    const email = normEmail(req.body?.email);
    const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 80) : "";

    if (!EMAIL_RE.test(email) || email.length > 200) return fail(res, 400, "invalid_email");
    if (!name) return fail(res, 400, "name_required");
    const problem = passwordProblem(password);
    if (problem) return fail(res, 400, problem);
    if (acceptedTerms !== true) return fail(res, 400, "terms_required");

    // Without e-mail verification anyone could claim an admin address first, so it needs the code.
    if (isAdminEmail(email)) {
      if (typeof adminCode !== "string" || !adminCode.trim()) return fail(res, 403, "admin_code_required");
      if (!safeEqualText(adminCode.trim(), adminSetupCode)) return fail(res, 403, "admin_code_invalid");
    }
    if (db.users.some((u) => u.email === email)) return fail(res, 409, "email_taken");

    const now = new Date().toISOString();
    const user: UserRecord = {
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash: "",
      salt: "",
      createdAt: now,
      lastLoginAt: now,
      lastActiveAt: now,
      isPro: false,
      disabled: false,
      tokenVersion: 0,
      usage: { day: today(), today: 0, total: 0 },
    };
    await setPassword(user, password);
    db.users.push(user);
    await saveDb();
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  });

  app.post("/api/auth/login", async (req, res) => {
    const email = normEmail(req.body?.email);
    const password = req.body?.password;
    if (rateLimited(`login:${req.ip}:${email}`, 10, 15 * 60_000) || rateLimited(`login-ip:${req.ip}`, 60, 15 * 60_000)) {
      return fail(res, 429, "rate_limited");
    }

    const user = db.users.find((u) => u.email === email);
    // Same answer for "no such account" and "wrong password" so accounts cannot be enumerated.
    if (!user || typeof password !== "string" || !(await verifyPassword(user, password))) {
      return fail(res, 401, "invalid_credentials");
    }
    if (user.disabled) return fail(res, 403, "account_disabled");

    user.lastLoginAt = new Date().toISOString();
    user.lastActiveAt = user.lastLoginAt;
    await saveDb();
    res.json({ token: signToken(user), user: publicUser(user) });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json({ user: publicUser((req as AuthedRequest).user!) });
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    const user = (req as AuthedRequest).user!;
    const { currentPassword, newPassword } = req.body || {};
    if (rateLimited(`pw:${user.id}`, 10, 15 * 60_000)) return fail(res, 429, "rate_limited");
    if (typeof currentPassword !== "string" || !(await verifyPassword(user, currentPassword))) {
      return fail(res, 401, "invalid_credentials");
    }
    const problem = passwordProblem(newPassword);
    if (problem) return fail(res, 400, problem);
    await setPassword(user, newPassword);
    await saveDb();
    res.json({ token: signToken(user), user: publicUser(user) });
  });

  /** Lets an ADMIN_EMAILS owner set a new password using the setup code from the server log. */
  app.post("/api/auth/admin-recover", async (req, res) => {
    if (rateLimited(`recover:${req.ip}`, 5, 60 * 60_000)) return fail(res, 429, "rate_limited");
    const email = normEmail(req.body?.email);
    const { adminCode, newPassword } = req.body || {};
    const user = db.users.find((u) => u.email === email);
    if (!isAdminEmail(email) || !user || typeof adminCode !== "string" || !safeEqualText(adminCode.trim(), adminSetupCode)) {
      return fail(res, 403, "admin_code_invalid");
    }
    const problem = passwordProblem(newPassword);
    if (problem) return fail(res, 400, problem);
    await setPassword(user, newPassword);
    await saveDb();
    res.json({ token: signToken(user), user: publicUser(user) });
  });

  app.delete("/api/auth/account", requireAuth, async (req, res) => {
    const user = (req as AuthedRequest).user!;
    if (rateLimited(`delete:${user.id}`, 10, 15 * 60_000)) return fail(res, 429, "rate_limited");
    const result = await deleteAccountWithPassword(user.email, req.body?.password);
    if (result !== "deleted") return fail(res, 401, result);
    res.json({ deleted: true });
  });

  app.get("/api/announcements", requireAuth, (_req, res) => {
    res.json({ announcements: db.announcements });
  });

  /* ---------------------------------- admin --------------------------------- */

  app.get("/api/admin/stats", requireAdmin, (_req, res) => {
    const weekAgo = Date.now() - 7 * 86400_000;
    const since = (iso: string | null) => (iso ? new Date(iso).getTime() >= weekAgo : false);
    res.json({
      usersTotal: db.users.length,
      usersPro: db.users.filter((u) => u.isPro).length,
      usersDisabled: db.users.filter((u) => u.disabled).length,
      newLast7Days: db.users.filter((u) => since(u.createdAt)).length,
      activeLast7Days: db.users.filter((u) => since(u.lastActiveAt)).length,
      questionsToday: db.users.reduce((sum, u) => sum + questionsToday(u), 0),
      questionsTotal: db.users.reduce((sum, u) => sum + u.usage.total, 0),
      freeDailyLimit: FREE_DAILY_QUESTIONS,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.get("/api/admin/users", requireAdmin, (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
    const users = db.users
      .filter((u) => !query || u.email.includes(query) || u.name.toLowerCase().includes(query))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 500)
      .map(adminUserView);
    res.json({ users });
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) return fail(res, 404, "not_found");
    const { isPro, disabled } = req.body || {};
    if (typeof isPro === "boolean") target.isPro = isPro;
    if (typeof disabled === "boolean") {
      if (disabled && isAdminEmail(target.email)) return fail(res, 400, "cannot_modify_admin");
      target.disabled = disabled;
      if (disabled) target.tokenVersion += 1; // signs the account out immediately
    }
    await saveDb();
    res.json({ user: adminUserView(target) });
  });

  /** No e-mail is sent anywhere, so the admin hands the one-time password over personally. */
  app.post("/api/admin/users/:id/temp-password", requireAdmin, async (req, res) => {
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) return fail(res, 404, "not_found");
    if (isAdminEmail(target.email)) return fail(res, 400, "cannot_modify_admin");
    const tempPassword = crypto.randomBytes(9).toString("base64url");
    await setPassword(target, tempPassword);
    await saveDb();
    res.json({ tempPassword });
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) return fail(res, 404, "not_found");
    if (isAdminEmail(target.email)) return fail(res, 400, "cannot_modify_admin");
    db.users = db.users.filter((u) => u.id !== target.id);
    await saveDb();
    res.json({ deleted: true });
  });

  app.post("/api/admin/announcements", requireAdmin, async (req, res) => {
    const title = typeof req.body?.title === "string" ? req.body.title.trim().slice(0, 120) : "";
    const body = typeof req.body?.body === "string" ? req.body.body.trim().slice(0, 2000) : "";
    if (!title || !body) return fail(res, 400, "title_and_body_required");
    const announcement: Announcement = {
      id: crypto.randomUUID(),
      title,
      body,
      createdAt: new Date().toISOString(),
    };
    db.announcements = [announcement, ...db.announcements].slice(0, 100);
    await saveDb();
    res.status(201).json({ announcement });
  });

  app.delete("/api/admin/announcements/:id", requireAdmin, async (req, res) => {
    const before = db.announcements.length;
    db.announcements = db.announcements.filter((a) => a.id !== req.params.id);
    if (db.announcements.length === before) return fail(res, 404, "not_found");
    await saveDb();
    res.json({ deleted: true });
  });
}
