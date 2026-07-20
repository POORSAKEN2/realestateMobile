import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  cancelTransientBooking,
  createTransientBooking,
  DEFAULT_CHECK_IN_TIME,
  DEFAULT_CHECK_OUT_TIME,
  findTransientBookingConflict,
  isBookingRangeValid,
  updateTransientBooking,
} from "../../api/bookings";
import type {
  Lessee,
  Property,
  TransientBooking,
  TransientBookingPayload,
} from "../../types";
import {
  dateKey,
  emptyForm,
  getDateRangeLabel,
  parseMoney,
  type BookingFormMode,
  type BookingFormState,
  type BookingFormUpdater,
} from "../../utils/bookings/bookingCalendar";

type UseBookingFormOptions = {
  accessToken?: string;
  bookings: TransientBooking[];
  buildings: Property[];
  guests: Lessee[];
  onSaved: (booking: TransientBookingPayload) => void;
};

export function useBookingForm({
  accessToken,
  bookings,
  buildings,
  guests,
  onSaved,
}: UseBookingFormOptions) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<BookingFormMode>("create");
  const [editingBooking, setEditingBooking] = useState<TransientBooking | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<BookingFormState>(() => emptyForm());
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [isAddingGuest, setIsAddingGuest] = useState(false);

  const selectedBuilding = buildings.find(
    (building) => building.id === form.propertyId,
  );
  const conflict = useMemo(() => {
    if (
      !form.propertyId ||
      !form.roomNumber ||
      !form.startDate ||
      !form.endDate ||
      !isBookingRangeValid({
        startDate: form.startDate,
        checkInTime: form.checkInTime,
        endDate: form.endDate,
        checkOutTime: form.checkOutTime,
      })
    ) {
      return undefined;
    }

    return findTransientBookingConflict({
      bookings,
      propertyId: form.propertyId,
      roomNumber: form.roomNumber,
      startDate: form.startDate,
      checkInTime: form.checkInTime,
      endDate: form.endDate,
      checkOutTime: form.checkOutTime,
      ignoreBookingId: editingBooking?.id,
    });
  }, [bookings, editingBooking?.id, form]);

  function close() {
    setIsOpen(false);
    setEditingBooking(null);
    setMessage("");
    setSelectedGuestId("");
    setIsAddingGuest(false);
  }

  const saveMutation = useMutation({
    mutationFn: (payload: TransientBookingPayload) =>
      mode === "create"
        ? createTransientBooking(payload, accessToken)
        : editingBooking
          ? updateTransientBooking(editingBooking.id, payload, accessToken)
          : Promise.reject(new Error("No booking selected.")),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: ["transientBookings"] });
      await queryClient.invalidateQueries({ queryKey: ["leases"] });
      await queryClient.invalidateQueries({ queryKey: ["lessees"] });
      onSaved(payload);
      close();
    },
    onError: (error) => {
      setMessage(
        error instanceof Error ? error.message : "Failed to save booking.",
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) =>
      cancelTransientBooking(bookingId, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["transientBookings"] });
      await queryClient.invalidateQueries({ queryKey: ["leases"] });
      close();
    },
    onError: (error) => {
      setMessage(
        error instanceof Error ? error.message : "Failed to cancel booking.",
      );
    },
  });

  const updateForm: BookingFormUpdater = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  function openCreate(propertyId: string, date = dateKey(new Date())) {
    setMode("create");
    setEditingBooking(null);
    setForm(emptyForm(propertyId, date));
    setMessage("");
    setSelectedGuestId("");
    setIsAddingGuest(false);
    setIsOpen(true);
  }

  function openEdit(booking: TransientBooking) {
    setMode("edit");
    setEditingBooking(booking);
    setForm({
      propertyId: booking.propertyId,
      roomNumber: booking.roomNumber,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      startDate: booking.startDate,
      checkInTime: booking.checkInTime,
      endDate: booking.endDate,
      checkOutTime: booking.checkOutTime,
      dailyRate: booking.dailyRate ? String(booking.dailyRate) : "",
      notes: booking.notes ?? "",
    });
    setMessage("");
    const matchedGuest = guests.find(
      (guest) =>
        guest.contactEmail.toLowerCase() === booking.guestEmail.toLowerCase(),
    );
    setSelectedGuestId(matchedGuest?.id ?? "");
    setIsAddingGuest(!matchedGuest);
    setIsOpen(true);
  }

  function selectBuilding(propertyId: string) {
    setForm((current) => ({ ...current, propertyId, roomNumber: "" }));
  }

  function selectGuest(guestId: string) {
    const guest = guests.find((item) => item.id === guestId);
    if (!guest) return;

    setSelectedGuestId(guestId);
    setIsAddingGuest(false);
    setForm((current) => ({
      ...current,
      guestName: guest.name,
      guestEmail: guest.contactEmail,
      guestPhone: guest.phone,
    }));
  }

  function toggleAddingGuest() {
    const nextValue = !isAddingGuest;
    setIsAddingGuest(nextValue);
    setSelectedGuestId("");
    if (nextValue) {
      setForm((current) => ({
        ...current,
        guestName: "",
        guestEmail: "",
        guestPhone: "",
      }));
    }
  }

  function submit() {
    setMessage("");

    if (!form.propertyId) return setMessage("Please select a building.");
    if (!form.roomNumber.trim())
      return setMessage("Please enter a room number.");
    if (!isAddingGuest && !selectedGuestId) {
      return setMessage("Please select an existing guest or add a new guest.");
    }
    if (!form.guestName.trim())
      return setMessage("Please enter the guest name.");
    if (!form.guestEmail.trim())
      return setMessage("Please enter the guest email.");
    if (!form.startDate || !form.endDate) {
      return setMessage("Please enter check-in and check-out dates.");
    }
    if (
      !isBookingRangeValid({
        startDate: form.startDate,
        checkInTime: form.checkInTime,
        endDate: form.endDate,
        checkOutTime: form.checkOutTime,
      })
    ) {
      return setMessage("Check-out must be after check-in.");
    }

    const dailyRate = parseMoney(form.dailyRate);
    if (dailyRate === undefined || dailyRate <= 0) {
      return setMessage("Please enter a valid daily rate greater than 0.");
    }
    if (conflict) {
      return setMessage(
        `This room is already booked for ${getDateRangeLabel(conflict)}.`,
      );
    }

    saveMutation.mutate({
      propertyId: form.propertyId,
      roomNumber: form.roomNumber.trim(),
      guestName: form.guestName.trim(),
      guestEmail: form.guestEmail.trim(),
      guestPhone: form.guestPhone.trim(),
      startDate: form.startDate,
      checkInTime: form.checkInTime || DEFAULT_CHECK_IN_TIME,
      endDate: form.endDate,
      checkOutTime: form.checkOutTime || DEFAULT_CHECK_OUT_TIME,
      dailyRate,
      notes: form.notes.trim(),
      status: "Booked",
    });
  }

  function cancel() {
    if (editingBooking) cancelMutation.mutate(editingBooking.id);
  }

  return {
    cancel,
    conflict,
    editingBooking,
    form,
    isAddingGuest,
    isCancelling: cancelMutation.isPending,
    isOpen,
    isSaving: saveMutation.isPending,
    message,
    mode,
    openCreate,
    openEdit,
    close,
    selectBuilding,
    selectedBuilding,
    selectedGuestId,
    selectGuest,
    submit,
    toggleAddingGuest,
    updateForm,
  };
}
