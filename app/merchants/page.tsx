import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { backendRequest } from "@/lib/ride-backend";
import { MerchantKeys, type Merchant } from "./MerchantKeys";
import "../settings/settings.css";

export default async function MerchantsPage() {
  const actor = await requireAdmin();
  if (actor.role !== "owner") redirect("/");

  let merchants: Merchant[] | null = null;
  try {
    merchants = await backendRequest<Merchant[] | null>("/v1/admin/merchants");
    merchants?.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    // The backend may be unavailable or still running an older release.
  }

  return (
    <div className="settings-route max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Merchants</h1>
      {merchants ? <MerchantKeys merchants={merchants} /> : (
        <p role="alert" className="settings-feedback error !mx-0">
          Could not load merchant keys. Check that the ride backend is available and up to date.
        </p>
      )}
    </div>
  );
}
