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
