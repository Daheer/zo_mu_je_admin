"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { adminAuth } from "@/lib/admin-auth";

const COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const password = formData.get("password");
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_COOKIE_SECRET;

  if (!expected || !secret) {
    return { error: "Server configuration error." };
  }

  if (typeof password !== "string" || password.length === 0) {
    return { error: "Please enter the password." };
  }

  const email = String(formData.get("email") || "").trim();
  let uid = "owner", label = "Owner", version: string | undefined;
  if (email) {
    try {
      const emulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;
      const endpoint = emulator ? `http://${emulator}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword` : "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";
      const response = await fetch(`${endpoint}?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "emulator"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }), cache: "no-store" });
      if (!response.ok) return { error: "Invalid email or password." };
      const data = await response.json();
      const user = await adminAuth().getUser(data.localId);
      if (user.disabled || !["operator", "viewer"].includes(user.customClaims?.adminRole)) return { error: "This account does not have admin access." };
      uid = user.uid; label = user.email || email; version = user.customClaims?.adminSessionVersion || "";
    } catch { return { error: "Could not log in. Please try again." }; }
  } else {
    const submittedHash = crypto.createHash("sha256").update(password, "utf8").digest();
    const expectedHash = crypto.createHash("sha256").update(expected, "utf8").digest();
    if (!crypto.timingSafeEqual(submittedHash, expectedHash)) return { error: "Invalid password." };
  }
  const payload = Buffer.from(JSON.stringify({ uid, label, issuedAt: Date.now(), version })).toString("base64url");
  const value = `${payload}.${crypto.createHmac("sha256", secret).update(payload).digest("base64url")}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  redirect("/");
}

// Form action receives FormData; we don't use it
export async function logoutAction(formData?: FormData) {
  void formData;
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
