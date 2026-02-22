"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

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

  const submittedHash = crypto.createHash("sha256").update(password, "utf8").digest();
  const expectedHash = crypto.createHash("sha256").update(expected, "utf8").digest();
  if (submittedHash.length !== expectedHash.length || !crypto.timingSafeEqual(submittedHash, expectedHash)) {
    return { error: "Invalid password." };
  }

  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("base64url");
  const value = `${timestamp}.${signature}`;

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
