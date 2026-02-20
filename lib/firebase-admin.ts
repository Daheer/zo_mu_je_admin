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
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!json) return null;
  try {
    return JSON.parse(json) as object;
  } catch {
    return null;
  }
}

function getAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0] as App;
  }
  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    return null;
  }
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
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
