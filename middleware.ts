import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a[i] ^ b[i];
  return out === 0;
}

async function verifyCookie(cookieValue: string, secret: string): Promise<boolean> {
  const dot = cookieValue.indexOf(".");
  if (dot === -1) return false;
  const timestamp = cookieValue.slice(0, dot);
  const signatureB64 = cookieValue.slice(dot + 1);
  if (!timestamp || !signatureB64) return false;

  const ts = parseInt(timestamp, 10);
  if (Number.isNaN(ts) || ts * 1000 < Date.now() - MAX_AGE_SECONDS * 1000) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(timestamp)
  );
  const expectedSig = new Uint8Array(sig);
  const decodedStored = base64UrlDecode(signatureB64);
  if (decodedStored.length !== expectedSig.length) return false;
  return timingSafeEqual(decodedStored, expectedSig);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login") return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname.includes(".")) return NextResponse.next();

  const secret = process.env.ADMIN_COOKIE_SECRET;
  if (!secret) return NextResponse.redirect(new URL("/login", request.url));

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return NextResponse.redirect(new URL("/login", request.url));

  const valid = await verifyCookie(cookie, secret);
  if (!valid) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-transparent.png).*)"],
};
