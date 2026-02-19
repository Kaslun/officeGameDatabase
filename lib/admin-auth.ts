import { cookies } from "next/headers";
import { createHmac } from "crypto";

const ADMIN_COOKIE_NAME = "admin_session";
const DEFAULT_SALT = "attensi_game_hub_admin";

function getSalt(): string {
  return process.env.ADMIN_SESSION_SALT?.trim() || DEFAULT_SALT;
}

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret?.length) return "";
  return secret;
}

export function isAdminConfigured(): boolean {
  return getSecret().length > 0;
}

export function createAdminToken(): string {
  const secret = getSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(getSalt()).digest("hex");
}

export function verifyAdminToken(token: string): boolean {
  if (!token) return false;
  const expected = createAdminToken();
  if (!expected) return false;
  return token === expected && token.length > 0;
}

export async function setAdminCookie(): Promise<void> {
  const token = createAdminToken();
  if (!token) return;
  const c = await cookies();
  c.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearAdminCookie(): Promise<void> {
  const c = await cookies();
  c.delete(ADMIN_COOKIE_NAME);
}

export async function getAdminCookie(): Promise<string | undefined> {
  const c = await cookies();
  return c.get(ADMIN_COOKIE_NAME)?.value;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = await getAdminCookie();
  return verifyAdminToken(token ?? "");
}

export function checkPassword(password: string): boolean {
  const secret = getSecret();
  if (!secret) return false;
  return password === secret;
}
