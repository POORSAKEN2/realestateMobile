import { apiClient } from "./client";
import {
  createLessee,
  fetchLessees,
  type Lessee,
} from "./propertyDetails";
import { fetchProperties } from "./properties";

type ApiEnvelope<T> = {
  data?: T;
};

type PaginatedApiData<T> = {
  data?: T[];
};

export type TransientBookingStatus = "Booked" | "Cancelled";

export type TransientBooking = {
  id: string;
  propertyId: string;
  roomNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  startDate: string;
  checkInTime: string;
  endDate: string;
  checkOutTime: string;
  dailyRate: number;
  status: TransientBookingStatus;
  notes?: string;
};

export type TransientBookingPayload = Omit<TransientBooking, "id">;

export const DEFAULT_CHECK_IN_TIME = "14:00";
export const DEFAULT_CHECK_OUT_TIME = "11:00";

function authHeaders(accessToken?: string) {
  return {
    Accept: "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function unwrapData<T>(response: ApiEnvelope<T> | T): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    response.data !== undefined
  ) {
    return response.data;
  }

  return response as T;
}

function normalizeCollection<T>(
  payload: ApiEnvelope<T[]> | ApiEnvelope<PaginatedApiData<T>> | T[],
): T[] {
  const data =
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "data" in payload
      ? payload.data
      : payload;

  if (Array.isArray(data)) {
    return data;
  }

  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as PaginatedApiData<T>).data)
  ) {
    return (data as PaginatedApiData<T>).data ?? [];
  }

  return [];
}

function normalizeBooking(lease: Record<string, any>): TransientBooking {
  const lessee = lease?.lessee ?? {};

  return {
    id: String(lease?.id ?? ""),
    propertyId: String(lease?.propertyId ?? lease?.property_id ?? ""),
    roomNumber: String(lease?.roomNumber ?? lease?.room_number ?? ""),
    guestName: String(lessee?.name ?? lease?.guestName ?? "Unknown"),
    guestEmail: String(
      lessee?.contactEmail ??
        lessee?.contact_email ??
        lease?.guestEmail ??
        "",
    ),
    guestPhone: String(lessee?.phone ?? lease?.guestPhone ?? ""),
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
  lesseeId: string,
) {
  return {
    property_id: payload.propertyId,
    lessee_id: lesseeId,
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
  roomNumber,
  startDate,
  checkInTime,
  endDate,
  checkOutTime,
  ignoreBookingId,
}: {
  bookings: TransientBooking[];
  propertyId: string;
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
      booking.roomNumber === roomNumber &&
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
  >("/leases?type=Transient", { headers: authHeaders(accessToken) });

  return normalizeCollection(response).map(normalizeBooking);
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
  const lessees = await fetchLessees(accessToken);
  const existingLessee = trimmedEmail
    ? lessees.find(
        (lessee: Lessee) =>
          lessee.contactEmail.trim().toLowerCase() === trimmedEmail,
      )
    : undefined;
  const lessee =
    existingLessee ??
    (await createLessee(
      {
        name: payload.guestName,
        contactEmail: payload.guestEmail,
        phone: payload.guestPhone,
      },
      accessToken,
    ));

  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >("/leases", toBookingApiPayload(payload, lessee.id), {
    headers: authHeaders(accessToken),
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
      room_number: payload.roomNumber,
      start_date: payload.startDate,
      check_in_time: payload.checkInTime,
      end_date: payload.endDate,
      check_out_time: payload.checkOutTime,
      daily_rate: payload.dailyRate,
      notes: payload.notes,
      _method: "PUT",
    },
    { headers: authHeaders(accessToken) },
  );

  return normalizeBooking(unwrapData(response));
}

export async function cancelTransientBooking(
  id: string,
  accessToken?: string,
) {
  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >(
    `/leases/${id}?_method=PUT`,
    { status: "Terminated", _method: "PUT" },
    { headers: authHeaders(accessToken) },
  );

  return normalizeBooking(unwrapData(response));
}
