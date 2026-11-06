import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import * as fs from "fs";
import * as path from "path";

let adminApp: App;

function loadServiceAccount(): object | null {
  // Prefer file path: no .env quoting/escaping issues
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
  if (keyPath) {
    const resolved = path.isAbsolute(keyPath)
      ? keyPath
      : path.resolve(process.cwd(), keyPath);
    try {
      const raw = fs.readFileSync(resolved, "utf8");
      return JSON.parse(raw) as object;
    } catch (e) {
      console.error("Failed to read service account file:", e);
      return null;
    }
  }
  let json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (!json) return null;
  // Some .env loaders leave outer quotes and escape inner ones as \"
  if (json.length >= 2 && json.startsWith('"') && json.endsWith('"')) {
    json = json.slice(1, -1).replace(/\\"/g, '"');
  }
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    // Env often stores private_key with literal \n (backslash-n) instead of newlines
    if (parsed.private_key && typeof parsed.private_key === "string") {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return parsed as object;
  } catch (e) {
    console.error("Firebase Admin: failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    return null;
  }
}

function getAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0] as App;
  }
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
    const local = /^(127\.0\.0\.1|localhost):\d+$/;
    if (process.env.GCLOUD_PROJECT !== "demo-zo-rides" || !local.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || "") || !local.test(process.env.FIREBASE_DATABASE_EMULATOR_HOST || "")) throw new Error("Use the isolated demo project and local Firebase emulators together.");
    return initializeApp({ projectId: "demo-zo-rides", databaseURL: `http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST}?ns=demo-zo-rides-default-rtdb`, credential: { getAccessToken: async () => ({ access_token: "owner", expires_in: 3600 }) } });
  }
  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    return null;
  }
  const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!databaseURL) {
    console.error(
      "Firebase Admin: NEXT_PUBLIC_FIREBASE_DATABASE_URL is not set. Add it in Vercel Environment Variables."
    );
  }
  adminApp = initializeApp({
    projectId: process.env.GCLOUD_PROJECT || undefined,
    credential: cert(serviceAccount),
    databaseURL: databaseURL || undefined,
  });
  return adminApp;
}

export function getAdminDb() {
  const app = getAdminApp();
  if (!app) {
    throw new Error(
      "Firebase Admin not configured: set FIREBASE_SERVICE_ACCOUNT_KEY_PATH (path to JSON file) or FIREBASE_SERVICE_ACCOUNT_KEY (JSON string)"
    );
  }
  return getDatabase();
}
