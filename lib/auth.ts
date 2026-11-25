import "server-only";

import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "ael_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return secret;
}

function signSessionId(sessionId: string): string {
  const sig = createHmac("sha256", getSessionSecret())
    .update(sessionId)
    .digest("base64url");
  return `${sessionId}.${sig}`;
}

function unsignSessionCookie(value: string): string | null {
  const idx = value.lastIndexOf(".");
  if (idx <= 0) return null;
  const sessionId = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expected = createHmac("sha256", getSessionSecret())
    .update(sessionId)
    .digest("base64url");

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }
  return sessionId;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signSessionId(session.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return session.id;
}

export async function destroySession(sessionId?: string | null): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const id = sessionId ?? (raw ? unsignSessionCookie(raw) : null);

  if (id) {
    await prisma.session.deleteMany({ where: { id } });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const sessionId = unsignSessionCookie(raw);
  if (!sessionId) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  if (!session.user.isActive) {
    await destroySession(session.id);
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    isAdmin: session.user.isAdmin,
    isActive: session.user.isActive,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isAdmin) {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}
