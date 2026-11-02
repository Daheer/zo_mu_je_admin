export const DEFAULT_SETTINGS = {
  pricing: {
    Tricycle: { perKm: 145, perMinute: 145, minimumFare: 500 },
    Motorcycle: { perKm: 116, perMinute: 116, minimumFare: 400 },
  },
  matching: { requestTimeoutSeconds: 45, searchRadiusKm: 5, maxRetries: 0, retryIntervalSeconds: 10 },
  service: { maxTripDistanceKm: 30, hoursEnabled: false, opensAt: "00:00", closesAt: "23:59", daysOfWeek: [1, 2, 3, 4, 5, 6, 7], zones: [] as ServiceZone[] },
  verification: { requireVehicleDetails: false, requireIdPhoto: false, allowedVehicleTypes: ["Tricycle", "Motorcycle"] },
  rewards: { enabled: true, inviterAmount: 500, welcomeAmount: 500, maxVoucherPercent: 100, maxVoucherAmount: 0 },
  operations: { bookingsEnabled: true, maintenanceMode: false, maintenanceMessage: "Bookings are temporarily unavailable. Please try again later.", supportPhone: "", supportEmail: "" },
};

export interface ServiceZone { name: string; latitude: number; longitude: number; radiusKm: number }
export type PlatformSettings = typeof DEFAULT_SETTINGS;
export interface SettingsVersion { schemaVersion: 1; revision: number; values: PlatformSettings; updatedAt: number; updatedBy: string }
export interface SettingsChange { revision: number; at: number; actor: string; reason: string; changes: { path: string; before: string; after: string }[] }

function object(value: unknown, keys: string[], name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join() !== keys.sort().join()) throw new Error(`Invalid ${name} fields. Reload settings and try again.`);
  return value as Record<string, unknown>;
}
function number(value: unknown, min: number, max: number, name: string, integer = false) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new Error(`${name} must be ${integer ? "a whole number " : ""}between ${min} and ${max}.`);
}

export function validateSettings(value: unknown): PlatformSettings {
  const root = object(value, Object.keys(DEFAULT_SETTINGS), "settings");
  for (const [section, defaults] of Object.entries(DEFAULT_SETTINGS)) object(root[section], Object.keys(defaults), section);
  const s = root as PlatformSettings;
  for (const type of ["Tricycle", "Motorcycle"] as const) {
    object(s.pricing[type], ["perKm", "perMinute", "minimumFare"], `${type} pricing`);
    number(s.pricing[type].perKm, 0, 10000, `${type} price per kilometre`);
    number(s.pricing[type].perMinute, 0, 10000, `${type} price per minute`);
    number(s.pricing[type].minimumFare, 1, 100000, `${type} minimum fare`);
  }
  number(s.matching.requestTimeoutSeconds, 15, 300, "Request timeout", true);
  number(s.matching.searchRadiusKm, 0.5, 50, "Search radius");
  number(s.matching.maxRetries, 0, 5, "Search retries", true);
  number(s.matching.retryIntervalSeconds, 5, 120, "Retry interval", true);
  if (s.matching.maxRetries * s.matching.retryIntervalSeconds >= s.matching.requestTimeoutSeconds) throw new Error("All search retries must fit within the request timeout.");
  number(s.service.maxTripDistanceKm, 1, 500, "Maximum trip distance");
  for (const value of [s.service.hoursEnabled, s.verification.requireVehicleDetails, s.verification.requireIdPhoto, s.rewards.enabled, s.operations.bookingsEnabled, s.operations.maintenanceMode]) if (typeof value !== "boolean") throw new Error("Switches must be true or false.");
  for (const time of [s.service.opensAt, s.service.closesAt]) if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Enter valid opening and closing times.");
  if (s.service.hoursEnabled && s.service.opensAt === s.service.closesAt) throw new Error("Opening and closing times must differ, or turn operating hours off.");
  if (!Array.isArray(s.service.daysOfWeek) || !s.service.daysOfWeek.length || new Set(s.service.daysOfWeek).size !== s.service.daysOfWeek.length || s.service.daysOfWeek.some(d => !Number.isInteger(d) || d < 1 || d > 7)) throw new Error("Choose at least one operating day.");
  if (!Array.isArray(s.service.zones) || s.service.zones.length > 20) throw new Error("Use at most 20 service areas.");
  for (const z of s.service.zones) {
    object(z, ["name", "latitude", "longitude", "radiusKm"], "service area");
    if (typeof z.name !== "string" || !z.name.trim() || z.name.length > 80) throw new Error("Each service area needs a name of 1–80 characters.");
    number(z.latitude, -90, 90, "Area latitude"); number(z.longitude, -180, 180, "Area longitude"); number(z.radiusKm, 0.5, 100, "Area radius");
  }
  if (!Array.isArray(s.verification.allowedVehicleTypes) || !s.verification.allowedVehicleTypes.length || new Set(s.verification.allowedVehicleTypes).size !== s.verification.allowedVehicleTypes.length || s.verification.allowedVehicleTypes.some(t => !["Tricycle", "Motorcycle"].includes(t))) throw new Error("Choose at least one supported vehicle type.");
  number(s.rewards.inviterAmount, 0, 100000, "Inviter reward"); number(s.rewards.welcomeAmount, 0, 100000, "Welcome voucher");
  number(s.rewards.maxVoucherPercent, 0, 100, "Voucher percentage"); number(s.rewards.maxVoucherAmount, 0, 100000, "Voucher cap");
  for (const [key, text] of Object.entries(s.operations)) if (typeof DEFAULT_SETTINGS.operations[key as keyof typeof DEFAULT_SETTINGS.operations] === "string" && (typeof text !== "string" || text.length > 300)) throw new Error("Contact details and messages must be at most 300 characters.");
  if (!s.operations.maintenanceMessage.trim()) throw new Error("Enter a message to show when bookings are unavailable.");
  if (s.operations.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.operations.supportEmail)) throw new Error("Enter a valid support email.");
  if (s.operations.supportPhone && !/^\+?[\d ()-]{7,30}$/.test(s.operations.supportPhone)) throw new Error("Enter a valid support phone number.");
  return structuredClone(s);
}

export function changedSettings(before: PlatformSettings, after: PlatformSettings, prefix = ""): Record<string, { before: unknown; after: unknown }> {
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  const walk = (a: unknown, b: unknown, path: string) => {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
      for (const key of Object.keys(b)) walk((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], path ? `${path}.${key}` : key);
    } else changes[path] = { before: a, after: b };
  };
  walk(before, after, prefix);
  return changes;
}

export function riderVerificationError(rider: { status?: string; idPhotoUrl?: string; vehicle_details?: Record<string, unknown> }, settings: PlatformSettings): string | null {
  const v = rider.vehicle_details;
  if (!settings.verification.allowedVehicleTypes.includes(String(v?.vehicle_type))) return "The rider needs an allowed vehicle type before activation.";
  if (settings.verification.requireVehicleDetails && ["vehicle_model", "vehicle_number", "vehicle_color"].some(k => !String(v?.[k] ?? "").trim())) return "Complete the rider’s vehicle model, number and colour before activation.";
  if (settings.verification.requireIdPhoto && !rider.idPhotoUrl) return "The rider needs an ID photo before activation.";
  return null;
}
