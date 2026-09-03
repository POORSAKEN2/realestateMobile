import { apiClient, authHeaders, unwrapCollection, unwrapData } from "./client";
import { createClient, fetchClients } from "./propertyDetails";
import { fetchProperties } from "./properties";
import type {
  ApiEnvelope,
  Lessee,
  TransientBooking,
  TransientBookingPayload,
} from "../types";

export type {
  TransientBooking,
  TransientBookingPayload,
  TransientBookingStatus,
} from "../types";

export const DEFAULT_CHECK_IN_TIME = "14:00";
export const DEFAULT_CHECK_OUT_TIME = "11:00";

function normalizeBooking(lease: Record<string, any>): TransientBooking {
  const client = lease?.client ?? lease?.lessee ?? {};

  return {
    id: String(lease?.id ?? ""),
    propertyId: String(lease?.propertyId ?? lease?.property_id ?? ""),
    roomId: String(lease?.roomId ?? lease?.room_id ?? lease?.room?.id ?? ""),
    roomNumber: String(lease?.roomNumber ?? lease?.room_number ?? ""),
    guestName: String(client?.name ?? lease?.guestName ?? "Unknown"),
    guestEmail: String(
      client?.contactEmail ?? client?.contact_email ?? lease?.guestEmail ?? "",
    ),
    guestPhone: String(client?.phone ?? lease?.guestPhone ?? ""),
    startDate: String(lease?.startDate ?? lease?.start_date ?? "").slice(0, 10),
    checkInTime: String(
      lease?.checkInTime ?? lease?.check_in_time ?? DEFAULT_CHECK_IN_TIME,
    ).slice(0, 5),
    endDate: String(lease?.endDate ?? lease?.end_date ?? "").slice(0, 10),
    checkOutTime: String(
      lease?.checkOutTime ?? lease?.check_out_time ?? DEFAULT_CHECK_OUT_TIME,
    ).slice(0, 5),
    dailyRate: Number(lease?.dailyRate ?? lease?.daily_rate ?? 0),
    status: lease?.status === "Terminated" ? "Cancelled" : "Booked",
    notes: lease?.notes ?? "",
  };
}

function toBookingApiPayload(
  payload: TransientBookingPayload,
  clientId: string,
) {
  return {
    property_id: payload.propertyId,
    client_id: clientId,
    room_id: payload.roomId,
    room_number: payload.roomNumber,
    type: "Transient",
    start_date: payload.startDate,
    check_in_time: payload.checkInTime || DEFAULT_CHECK_IN_TIME,
    end_date: payload.endDate,
    check_out_time: payload.checkOutTime || DEFAULT_CHECK_OUT_TIME,
    daily_rate: payload.dailyRate,
    status: "Active",
    payment_strategy: "Upfront",
    notes: payload.notes,
  };
}

export function toBookingDateTime(date: string, time: string) {
  return `${date}T${time || "00:00"}`;
}

export function isBookingRangeValid({
  startDate,
  checkInTime,
  endDate,
  checkOutTime,
}: {
  startDate: string;
  checkInTime: string;
  endDate: string;
  checkOutTime: string;
}) {
  return (
    toBookingDateTime(startDate, checkInTime) <
    toBookingDateTime(endDate, checkOutTime)
  );
}

export function rangesOverlap(
  firstStartDateTime: string,
  firstEndDateTime: string,
  secondStartDateTime: string,
  secondEndDateTime: string,
) {
  return (
    firstStartDateTime < secondEndDateTime &&
    secondStartDateTime < firstEndDateTime
  );
}

export function findTransientBookingConflict({
  bookings,
  propertyId,
  roomId,
  roomNumber,
  startDate,
  checkInTime,
  endDate,
  checkOutTime,
  ignoreBookingId,
}: {
  bookings: TransientBooking[];
  propertyId: string;
  roomId: string;
  roomNumber: string;
  startDate: string;
  checkInTime: string;
  endDate: string;
  checkOutTime: string;
  ignoreBookingId?: string;
}) {
  const startDateTime = toBookingDateTime(startDate, checkInTime);
  const endDateTime = toBookingDateTime(endDate, checkOutTime);

  return bookings.find(
    (booking) =>
      booking.propertyId === propertyId &&
      (booking.roomId && roomId
        ? booking.roomId === roomId
        : booking.roomNumber === roomNumber) &&
      booking.status === "Booked" &&
      booking.id !== ignoreBookingId &&
      rangesOverlap(
        startDateTime,
        endDateTime,
        toBookingDateTime(booking.startDate, booking.checkInTime),
        toBookingDateTime(booking.endDate, booking.checkOutTime),
      ),
  );
}

export async function fetchTransientBookings(accessToken?: string) {
  const response = await apiClient.get<
    ApiEnvelope<Record<string, any>[]> | Record<string, any>[]
  >("/leases?type=Transient", { headers: authHeaders(accessToken), access: { permission: "bookings.viewAny" } });

  return unwrapCollection(response).map(normalizeBooking);
}

export async function fetchTransientBookablePropertyIds(accessToken?: string) {
  const properties = await fetchProperties(accessToken);

  return properties
    .filter((property) => property.isTransientBookable)
    .map((property) => property.id);
}

export async function createTransientBooking(
  payload: TransientBookingPayload,
  accessToken?: string,
) {
  const trimmedEmail = payload.guestEmail.trim().toLowerCase();
  const clients = await fetchClients(accessToken);
  const existingClient = trimmedEmail
    ? clients.find(
        (client: Lessee) =>
          client.contactEmail.trim().toLowerCase() === trimmedEmail,
      )
    : undefined;
  const client =
    existingClient ??
    (await createClient(
      {
        name: payload.guestName,
        contactEmail: payload.guestEmail,
        phone: payload.guestPhone,
      },
      accessToken,
    ));

  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >("/leases", toBookingApiPayload(payload, client.id), {
    headers: authHeaders(accessToken),
    access: { permission: "bookings.create", propertyId: payload.propertyId },
  });

  return normalizeBooking(unwrapData(response));
}

export async function updateTransientBooking(
  id: string,
  payload: TransientBookingPayload,
  accessToken?: string,
) {
  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >(
    `/leases/${id}?_method=PUT`,
    {
      property_id: payload.propertyId,
      room_id: payload.roomId,
      room_number: payload.roomNumber,
      start_date: payload.startDate,
      check_in_time: payload.checkInTime,
      end_date: payload.endDate,
      check_out_time: payload.checkOutTime,
      daily_rate: payload.dailyRate,
      notes: payload.notes,
      _method: "PUT",
    },
    { headers: authHeaders(accessToken), access: { permission: "bookings.update" } },
  );

  return normalizeBooking(unwrapData(response));
}

export async function cancelTransientBooking(id: string, accessToken?: string) {
  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >(
    `/leases/${id}?_method=PUT`,
    { status: "Terminated", _method: "PUT" },
    { headers: authHeaders(accessToken), access: { permission: "bookings.update" } },
  );

  return normalizeBooking(unwrapData(response));
}
