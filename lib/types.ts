export interface VehicleDetails {
  vehicle_model?: string;
  vehicle_number?: string;
  vehicle_color?: string;
  vehicle_type?: string;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  token?: string;
  status?: string;
  createdAt?: number;
}

export interface Rider {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  token?: string;
  status?: string;
  vehicle_details?: VehicleDetails;
  ratings?: string;
  earnings?: string;
  tripsHistory?: Record<string, boolean>;
  newRideStatus?: string;
  createdAt?: number;
}

export interface RideRequest {
  id: string;
  origin?: { latitude: string; longitude: string };
  destination?: { latitude: string; longitude: string };
  originAddress?: string;
  destinationAddress?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  rideType?: string;
  riderId?: string;
  time?: string;
  token?: string;
  estimatedFare?: string;
  fareAmount?: string;
  status?: string;
  riderLocation?: { latitude: string; longitude: string; rotation?: string };
  rider_name?: string;
  rider_phone?: string;
  ratings?: string;
  vehicle_details?: string;
  vehicle_type?: string;
}

export type RideStatus =
  | "waiting"
  | "accepted"
  | "arrived"
  | "ontrip"
  | "ended"
  | "cancelled";

export type ReportStatus = "open" | "under_review" | "resolved" | "dismissed";

export interface Report {
  id: string;
  type?: string;
  reporterId?: string;
  reporterName?: string;
  reporterRole?: "customer" | "rider";
  rideRequestId?: string;
  category?: string;
  description?: string;
  status?: ReportStatus;
  createdAt?: string | number;
  resolvedAt?: string | number;
  adminNotes?: string;
}
