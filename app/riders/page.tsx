import { getRiders, hasFirebaseEnv } from "@/lib/db";
import { RidersTableWithSearch } from "./RidersTableWithSearch";

export default async function RidersPage() {
  const isConfigured = hasFirebaseEnv();
  let riders: Awaited<ReturnType<typeof getRiders>> = [];
  if (isConfigured) {
    try {
      riders = await getRiders();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#2C3E50]">Riders</h1>
      {!isConfigured && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-medium">Firebase Admin is not configured.</p>
          <p className="mt-1 text-red-700">
            Set <code className="font-mono">FIREBASE_SERVICE_ACCOUNT_KEY_PATH</code> or{" "}
            <code className="font-mono">FIREBASE_SERVICE_ACCOUNT_KEY</code> in your
            <code className="font-mono">.env.local</code> file so the admin dashboard can
            load rider data from Firebase.
          </p>
        </div>
      )}
      <RidersTableWithSearch riders={riders} />
    </div>
  );
}
