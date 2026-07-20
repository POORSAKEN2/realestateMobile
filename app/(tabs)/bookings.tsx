import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  cancelTransientBooking,
  createTransientBooking,
  DEFAULT_CHECK_IN_TIME,
  DEFAULT_CHECK_OUT_TIME,
  fetchTransientBookings,
  findTransientBookingConflict,
  isBookingRangeValid,
  updateTransientBooking,
} from "../../api/bookings";
import { fetchLessees } from "../../api/propertyDetails";
import { useProperties } from "../../hooks/api/useProperties";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../hooks/useAuth";
import type {
  Property,
  TransientBooking,
  TransientBookingPayload,
} from "../../types";
import { AddEditModal } from "../../components/ui/AddEditModal";
import { BaseField } from "../../components/ui/fields/BaseField";
import { BuildingChoices } from "../../components/bookings/BuildingChoices";
import {
  getAvailabilityForDay,
  getBookingsForDay,
} from "../../utils/bookings/bookingAvailability";
import {
  dateKey,
  emptyForm,
  formatDisplayDate,
  formatDisplayTime,
  getBookingPickerChange,
  getBookingPickerTitle,
  getBookingPickerValue,
  getBookingStatusLabel,
  getDateRangeLabel,
  getMonthDays,
  getParamValue,
  parseDate,
  parseMoney,
  weekdayLabels,
  type BookingFormMode,
  type BookingFormState,
  type BookingPickerField,
  type StatusFilter,
} from "../../utils/bookings/bookingCalendar";
import AddButton from "../../components/ui/buttons/AddButton";
import { PickerField } from "../../components/ui/fields/PickerField";
import { DropdownField } from "../../components/ui/fields/DropdownField";

export default function BookingsScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const params = useLocalSearchParams<{ propertyId?: string }>();
  const requestedPropertyId = getParamValue(params.propertyId);
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Booked");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<BookingFormMode>("create");
  const [editingBooking, setEditingBooking] = useState<TransientBooking | null>(
    null,
  );
  const [formMessage, setFormMessage] = useState("");
  const [formData, setFormData] = useState<BookingFormState>(() => emptyForm());
  const [activePickerField, setActivePickerField] =
    useState<BookingPickerField | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [isAddingGuest, setIsAddingGuest] = useState(false);

  const { useList } = useProperties();
  const {
    data: properties = [],
    isLoading: isLoadingProperties,
    refetch: refetchProperties,
  } = useList();
  const {
    data: bookings = [],
    isLoading: isLoadingBookings,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ["transientBookings", accessToken],
    queryFn: () => fetchTransientBookings(accessToken),
    enabled: Boolean(accessToken),
  });
  const { data: guests = [] } = useQuery({
    queryKey: ["lessees", accessToken],
    queryFn: () => fetchLessees(accessToken),
    enabled: Boolean(accessToken),
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const buildingOptions = useMemo(() => {
    return properties
      .filter((property) => property.isTransientBookable)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [properties]);
  const guestOptions = useMemo(
    () =>
      guests.map((guest) => ({
        label: `${guest.name}${guest.contactEmail ? ` · ${guest.contactEmail}` : ""}`,
        value: guest.id,
      })),
    [guests],
  );

  useEffect(() => {
    if (
      requestedPropertyId &&
      buildingOptions.some((building) => building.id === requestedPropertyId)
    ) {
      setSelectedPropertyId(requestedPropertyId);
      return;
    }

    if (!selectedPropertyId && buildingOptions[0]) {
      setSelectedPropertyId(buildingOptions[0].id);
      return;
    }

    if (
      selectedPropertyId &&
      !buildingOptions.some((building) => building.id === selectedPropertyId)
    ) {
      setSelectedPropertyId(buildingOptions[0]?.id ?? "");
    }
  }, [buildingOptions, requestedPropertyId, selectedPropertyId]);

  const selectedBuilding = buildingOptions.find(
    (building) => building.id === selectedPropertyId,
  );
  const selectedBuildingBookings = useMemo(
    () =>
      bookings.filter((booking) => booking.propertyId === selectedPropertyId),
    [bookings, selectedPropertyId],
  );
  const visibleBookings = useMemo(
    () =>
      selectedBuildingBookings.filter((booking) =>
        statusFilter === "All" ? true : booking.status === statusFilter,
      ),
    [selectedBuildingBookings, statusFilter],
  );
  const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);
  const selectedDay = useMemo(() => parseDate(selectedDate), [selectedDate]);
  const selectedDayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(selectedDay);
  const selectedDayBookings = useMemo(
    () => getBookingsForDay(visibleBookings, selectedDay),
    [selectedDay, visibleBookings],
  );
  const selectedDayAvailability = getAvailabilityForDay(
    selectedBuildingBookings,
    selectedDay,
  );
  const canCreateOnSelectedDay =
    selectedDayAvailability.label === "Available" ||
    selectedDayAvailability.label === "After 2 PM";
  const today = new Date();
  const todayKey = dateKey(today);
  const isViewingCurrentMonth =
    currentMonth.getFullYear() === today.getFullYear() &&
    currentMonth.getMonth() === today.getMonth();
  const isLoading = isLoadingProperties || isLoadingBookings;

  function changeMonth(offset: number) {
    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + offset,
      1,
    );
    setCurrentMonth(nextMonth);
    setSelectedDate(dateKey(nextMonth));
  }

  function selectCalendarDay(day: Date) {
    setSelectedDate(dateKey(day));
    if (
      day.getFullYear() !== currentMonth.getFullYear() ||
      day.getMonth() !== currentMonth.getMonth()
    ) {
      setCurrentMonth(new Date(day.getFullYear(), day.getMonth(), 1));
    }
  }

  function goToToday() {
    const nextToday = new Date();
    setCurrentMonth(nextToday);
    setSelectedDate(dateKey(nextToday));
  }

  async function refreshBookings() {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchProperties(), refetchBookings()]);
    } finally {
      setIsRefreshing(false);
    }
  }

  function updateForm<K extends keyof BookingFormState>(
    key: K,
    value: BookingFormState[K],
  ) {
    setFormData((current) => ({ ...current, [key]: value }));
  }

  function resetForm(
    propertyId = selectedPropertyId,
    date = dateKey(new Date()),
  ) {
    setFormData(emptyForm(propertyId, date));
    setFormMessage("");
  }

  function openCreate(date = dateKey(new Date())) {
    setModalMode("create");
    setEditingBooking(null);
    resetForm(selectedPropertyId, date);
    setActivePickerField(null);
    setSelectedGuestId("");
    setIsAddingGuest(false);
    setIsModalOpen(true);
  }

  function openEdit(booking: TransientBooking) {
    setModalMode("edit");
    setEditingBooking(booking);
    setFormData({
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
    setFormMessage("");
    setActivePickerField(null);
    const matchedGuest = guests.find(
      (guest) =>
        guest.contactEmail.toLowerCase() === booking.guestEmail.toLowerCase(),
    );
    setSelectedGuestId(matchedGuest?.id ?? "");
    setIsAddingGuest(!matchedGuest);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingBooking(null);
    setFormMessage("");
    setActivePickerField(null);
    setSelectedGuestId("");
    setIsAddingGuest(false);
  }

  function selectGuest(guestId: string) {
    const guest = guests.find((item) => item.id === guestId);
    if (!guest) return;

    setSelectedGuestId(guestId);
    setIsAddingGuest(false);
    setFormData((current) => ({
      ...current,
      guestName: guest.name,
      guestEmail: guest.contactEmail,
      guestPhone: guest.phone,
    }));
  }

  const formConflict =
    formData.propertyId &&
    formData.roomNumber &&
    formData.startDate &&
    formData.endDate &&
    isBookingRangeValid({
      startDate: formData.startDate,
      checkInTime: formData.checkInTime,
      endDate: formData.endDate,
      checkOutTime: formData.checkOutTime,
    })
      ? findTransientBookingConflict({
          bookings,
          propertyId: formData.propertyId,
          roomNumber: formData.roomNumber,
          startDate: formData.startDate,
          checkInTime: formData.checkInTime,
          endDate: formData.endDate,
          checkOutTime: formData.checkOutTime,
          ignoreBookingId: editingBooking?.id,
        })
      : undefined;
  const selectedFormBuilding = buildingOptions.find(
    (building) => building.id === formData.propertyId,
  );

  const saveMutation = useMutation({
    mutationFn: (payload: TransientBookingPayload) =>
      modalMode === "create"
        ? createTransientBooking(payload, accessToken)
        : editingBooking
          ? updateTransientBooking(editingBooking.id, payload, accessToken)
          : Promise.reject(new Error("No booking selected.")),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({
        queryKey: ["transientBookings"],
      });
      await queryClient.invalidateQueries({ queryKey: ["leases"] });
      await queryClient.invalidateQueries({ queryKey: ["lessees"] });
      setSelectedPropertyId(payload.propertyId);
      closeModal();
    },
    onError: (error) => {
      setFormMessage(
        error instanceof Error ? error.message : "Failed to save booking.",
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) =>
      cancelTransientBooking(bookingId, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["transientBookings"],
      });
      await queryClient.invalidateQueries({ queryKey: ["leases"] });
      closeModal();
    },
    onError: (error) => {
      setFormMessage(
        error instanceof Error ? error.message : "Failed to cancel booking.",
      );
    },
  });

  function handleSubmit() {
    setFormMessage("");

    if (!formData.propertyId) {
      setFormMessage("Please select a building.");
      return;
    }

    if (!formData.roomNumber.trim()) {
      setFormMessage("Please enter a room number.");
      return;
    }

    if (!isAddingGuest && !selectedGuestId) {
      setFormMessage("Please select an existing guest or add a new guest.");
      return;
    }

    if (!formData.guestName.trim()) {
      setFormMessage("Please enter the guest name.");
      return;
    }

    if (!formData.guestEmail.trim()) {
      setFormMessage("Please enter the guest email.");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setFormMessage("Please enter check-in and check-out dates.");
      return;
    }

    if (
      !isBookingRangeValid({
        startDate: formData.startDate,
        checkInTime: formData.checkInTime,
        endDate: formData.endDate,
        checkOutTime: formData.checkOutTime,
      })
    ) {
      setFormMessage("Check-out must be after check-in.");
      return;
    }

    const dailyRate = parseMoney(formData.dailyRate);

    if (dailyRate === undefined || dailyRate <= 0) {
      setFormMessage("Please enter a valid daily rate greater than 0.");
      return;
    }

    if (formConflict) {
      setFormMessage(
        `This room is already booked for ${getDateRangeLabel(formConflict)}.`,
      );
      return;
    }

    saveMutation.mutate({
      propertyId: formData.propertyId,
      roomNumber: formData.roomNumber.trim(),
      guestName: formData.guestName.trim(),
      guestEmail: formData.guestEmail.trim(),
      guestPhone: formData.guestPhone.trim(),
      startDate: formData.startDate,
      checkInTime: formData.checkInTime || DEFAULT_CHECK_IN_TIME,
      endDate: formData.endDate,
      checkOutTime: formData.checkOutTime || DEFAULT_CHECK_OUT_TIME,
      dailyRate,
      notes: formData.notes.trim(),
      status: "Booked",
    });
  }

  return (
    <Screen className="bg-slate-50">
      <View className="flex-1 gap-5">
        <View className="flex-row items-center justify-between px-1">
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-slate-400">
              Short Stay
            </Text>
            <Text className="font-soraSemiBold text-3xl tracking-tight text-slate-950">
              Bookings
            </Text>
          </View>
          <AddButton
            disabled={!selectedBuilding}
            onPress={() => openCreate(selectedDate)}
          />
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl
              colors={["#2563EB"]}
              onRefresh={refreshBookings}
              refreshing={isRefreshing}
              tintColor="#2563EB"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-4 pb-8">
            <View className="gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Property calendar
                  </Text>
                  <Text
                    className="mt-1 font-soraSemiBold text-lg text-slate-950"
                    numberOfLines={1}
                  >
                    {selectedBuilding?.title ?? "No building selected"}
                  </Text>
                </View>
                <View className="flex-row rounded-full bg-slate-100 p-1">
                  {(
                    [
                      { label: "Confirmed", value: "Booked" },
                      { label: "All", value: "All" },
                    ] as const
                  ).map((option) => {
                    const selected = statusFilter === option.value;

                    return (
                      <TouchableOpacity
                        key={option.value}
                        activeOpacity={0.78}
                        accessibilityLabel={`Show ${option.label.toLowerCase()} reservations`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        className={`h-11 justify-center rounded-full px-3 ${
                          selected ? "bg-blue-600" : "bg-transparent"
                        }`}
                        onPress={() => setStatusFilter(option.value)}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            selected ? "text-white" : "text-slate-600"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {buildingOptions.length > 0 ? (
                <BuildingChoices
                  buildings={buildingOptions}
                  onSelect={setSelectedPropertyId}
                  selectedId={selectedPropertyId}
                />
              ) : null}
            </View>

            {isLoading ? (
              <View className="items-center rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5">
                <ActivityIndicator color="#2563EB" />
                <Text className="mt-3 text-sm font-semibold text-slate-700">
                  Loading calendar
                </Text>
              </View>
            ) : buildingOptions.length === 0 ? (
              <View className="items-center rounded-[24px] border border-dashed border-slate-300 bg-white p-8">
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                  <Ionicons name="calendar-outline" color="#2563EB" size={28} />
                </View>
                <Text className="mt-4 text-center font-soraSemiBold text-base text-slate-950">
                  No bookable buildings yet
                </Text>
                <Text className="mt-1 text-center text-sm leading-5 text-slate-500">
                  Enable transient bookings in a property form to start using
                  this calendar.
                </Text>
              </View>
            ) : (
              <>
                <View className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
                  <View className="flex-row items-center gap-2 px-4 pb-3 pt-4">
                    <View className="min-w-0 flex-1">
                      <Text className="font-soraSemiBold text-lg text-slate-950">
                        {monthLabel}
                      </Text>
                      <Text className="mt-0.5 text-xs font-medium text-slate-500">
                        Select a day to see its schedule
                      </Text>
                    </View>
                    {!isViewingCurrentMonth ? (
                      <TouchableOpacity
                        activeOpacity={0.78}
                        accessibilityLabel="Return to today"
                        accessibilityRole="button"
                        className="h-11 justify-center rounded-full bg-blue-50 px-3"
                        onPress={goToToday}
                      >
                        <Text className="text-xs font-bold text-blue-700">
                          Today
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      activeOpacity={0.78}
                      accessibilityLabel="Previous month"
                      accessibilityRole="button"
                      className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white"
                      onPress={() => changeMonth(-1)}
                    >
                      <Ionicons name="chevron-back" color="#334155" size={19} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.78}
                      accessibilityLabel="Next month"
                      accessibilityRole="button"
                      className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white"
                      onPress={() => changeMonth(1)}
                    >
                      <Ionicons
                        name="chevron-forward"
                        color="#334155"
                        size={19}
                      />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row border-y border-slate-100 bg-slate-50/80 py-2.5">
                    {weekdayLabels.map((day) => (
                      <Text
                        key={day}
                        className="flex-1 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400"
                      >
                        {day.slice(0, 1)}
                      </Text>
                    ))}
                  </View>

                  <View className="flex-row flex-wrap px-1 py-2">
                    {monthDays.map((day) => {
                      const key = dateKey(day);
                      const dayBookings = getBookingsForDay(
                        visibleBookings,
                        day,
                      );
                      const availability = getAvailabilityForDay(
                        selectedBuildingBookings,
                        day,
                      );
                      const isCurrentMonth =
                        day.getMonth() === currentMonth.getMonth();
                      const isSelected = key === selectedDate;
                      const isToday = key === todayKey;
                      const availabilityDot =
                        availability.label === "Available"
                          ? "bg-emerald-500"
                          : availability.label === "After 2 PM" ||
                              availability.label === "Checkout"
                            ? "bg-amber-500"
                            : "bg-rose-500";
                      const spokenDate = new Intl.DateTimeFormat("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      }).format(day);

                      return (
                        <TouchableOpacity
                          key={key}
                          activeOpacity={0.72}
                          accessibilityLabel={`${spokenDate}. ${availability.label}. ${dayBookings.length} ${dayBookings.length === 1 ? "booking" : "bookings"}.`}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                          className="h-14 items-center justify-center"
                          onPress={() => selectCalendarDay(day)}
                          style={{ width: "14.2857%" }}
                        >
                          <View
                            className={`h-9 w-9 items-center justify-center rounded-full ${
                              isSelected
                                ? "bg-blue-600"
                                : isToday
                                  ? "border border-blue-500 bg-blue-50"
                                  : "bg-transparent"
                            }`}
                          >
                            <Text
                              className={`text-[13px] font-bold ${
                                isSelected
                                  ? "text-white"
                                  : isCurrentMonth
                                    ? isToday
                                      ? "text-blue-700"
                                      : "text-slate-800"
                                    : "text-slate-300"
                              }`}
                            >
                              {day.getDate()}
                            </Text>
                          </View>
                          <View className="mt-0.5 h-2 flex-row items-center justify-center gap-0.5">
                            {dayBookings.length > 0 ? (
                              dayBookings
                                .slice(0, 3)
                                .map((booking) => (
                                  <View
                                    key={booking.id}
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      booking.status === "Cancelled"
                                        ? "bg-slate-300"
                                        : "bg-blue-500"
                                    }`}
                                  />
                                ))
                            ) : isCurrentMonth ? (
                              <View
                                className={`h-1.5 w-1.5 rounded-full ${availabilityDot}`}
                              />
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View className="flex-row flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 px-4 py-3">
                    {[
                      { color: "bg-blue-500", label: "Reservation" },
                      { color: "bg-emerald-500", label: "Available" },
                      { color: "bg-amber-500", label: "Turnover" },
                      { color: "bg-slate-300", label: "Cancelled" },
                    ].map((item) => (
                      <View
                        className="flex-row items-center gap-1.5"
                        key={item.label}
                      >
                        <View
                          className={`h-2 w-2 rounded-full ${item.color}`}
                        />
                        <Text className="text-[11px] font-semibold text-slate-500">
                          {item.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Day schedule
                      </Text>
                      <Text className="mt-1 font-soraSemiBold text-lg text-slate-950">
                        {selectedDayLabel}
                      </Text>
                    </View>
                    <View
                      className={`rounded-full px-3 py-1.5 ${selectedDayAvailability.bg}`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${selectedDayAvailability.text}`}
                      >
                        {selectedDayAvailability.label}
                      </Text>
                    </View>
                  </View>

                  {selectedDayBookings.length > 0 ? (
                    <View className="gap-2">
                      {selectedDayBookings.map((booking) => (
                        <TouchableOpacity
                          key={booking.id}
                          activeOpacity={0.78}
                          accessibilityLabel={`Open booking for ${booking.guestName}, room ${booking.roomNumber}`}
                          accessibilityRole="button"
                          className="min-h-[64px] flex-row items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3"
                          onPress={() => openEdit(booking)}
                        >
                          <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                            <Ionicons
                              name="bed-outline"
                              color="#2563EB"
                              size={19}
                            />
                          </View>
                          <View className="min-w-0 flex-1">
                            <Text
                              className="font-soraSemiBold text-sm text-slate-900"
                              numberOfLines={1}
                            >
                              {booking.guestName}
                            </Text>
                            <Text className="mt-0.5 text-xs font-medium text-slate-500">
                              Room {booking.roomNumber} ·{" "}
                              {formatDisplayTime(booking.checkInTime)}–
                              {formatDisplayTime(booking.checkOutTime)}
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            color="#94A3B8"
                            size={18}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-3 rounded-2xl bg-slate-50 p-4">
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
                        <Ionicons
                          name="sparkles-outline"
                          color="#64748B"
                          size={18}
                        />
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text className="text-sm font-bold text-slate-800">
                          No stays scheduled
                        </Text>
                        <Text className="mt-0.5 text-xs leading-5 text-slate-500">
                          This day has no visible reservations.
                        </Text>
                      </View>
                    </View>
                  )}

                  {canCreateOnSelectedDay ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      accessibilityLabel={`Add booking on ${selectedDayLabel}`}
                      accessibilityRole="button"
                      className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600"
                      onPress={() => openCreate(selectedDate)}
                    >
                      <Ionicons name="add" color="#FFFFFF" size={20} />
                      <Text className="font-soraSemiBold text-sm text-white">
                        Add booking for this day
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            )}

            <View className="mb-16 gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
              <View className="flex-row items-end justify-between gap-3">
                <View>
                  <Text className="font-soraSemiBold text-lg text-slate-950">
                    All reservations
                  </Text>
                  <Text className="mt-1 text-xs font-medium text-slate-500">
                    {selectedBuilding?.title ?? "Select a building"}
                  </Text>
                </View>
                <Text className="text-xs font-bold text-slate-400">
                  {visibleBookings.length} total
                </Text>
              </View>

              {isLoading ? (
                <Text className="text-sm font-medium text-slate-500">
                  Loading reservations...
                </Text>
              ) : visibleBookings.length > 0 ? (
                visibleBookings
                  .slice()
                  .sort((a, b) => b.startDate.localeCompare(a.startDate))
                  .map((booking) => {
                    const statusLabel = getBookingStatusLabel(booking);
                    const statusBackground =
                      statusLabel === "Cancelled" || statusLabel === "Completed"
                        ? "bg-slate-100"
                        : statusLabel === "Upcoming"
                          ? "bg-blue-50"
                          : statusLabel === "Checking out today"
                            ? "bg-amber-50"
                            : "bg-emerald-50";
                    const statusText =
                      statusLabel === "Cancelled" || statusLabel === "Completed"
                        ? "text-slate-500"
                        : statusLabel === "Upcoming"
                          ? "text-blue-700"
                          : statusLabel === "Checking out today"
                            ? "text-amber-700"
                            : "text-emerald-700";
                    const startDate = parseDate(booking.startDate);
                    const startMonth = new Intl.DateTimeFormat("en-US", {
                      month: "short",
                    }).format(startDate);

                    return (
                      <TouchableOpacity
                        key={booking.id}
                        activeOpacity={0.78}
                        accessibilityLabel={`Open ${statusLabel} booking for ${booking.guestName}`}
                        accessibilityRole="button"
                        className="min-h-[76px] flex-row items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3"
                        onPress={() => openEdit(booking)}
                      >
                        <View className="w-12 items-center rounded-xl bg-slate-50 py-2">
                          <Text className="text-[10px] font-bold uppercase text-slate-400">
                            {startMonth}
                          </Text>
                          <Text className="font-soraSemiBold text-lg text-slate-900">
                            {startDate.getDate()}
                          </Text>
                        </View>
                        <View className="min-w-0 flex-1">
                          <Text
                            className="font-soraSemiBold text-sm text-slate-900"
                            numberOfLines={1}
                          >
                            {booking.guestName}
                          </Text>
                          <Text className="mt-1 text-xs font-medium text-slate-500">
                            Room {booking.roomNumber} ·{" "}
                            {formatDisplayDate(booking.startDate)}–
                            {formatDisplayDate(booking.endDate)}
                          </Text>
                          <View
                            className={`mt-2 self-start rounded-full px-2 py-1 ${statusBackground}`}
                          >
                            <Text
                              className={`text-[10px] font-bold ${statusText}`}
                            >
                              {statusLabel}
                            </Text>
                          </View>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          color="#94A3B8"
                          size={18}
                        />
                      </TouchableOpacity>
                    );
                  })
              ) : (
                <View className="items-center rounded-2xl border border-dashed border-slate-200 p-6">
                  <Text className="text-center text-sm font-bold text-slate-800">
                    No reservations found
                  </Text>
                  <Text className="mt-1 text-center text-xs leading-5 text-slate-500">
                    Select an available day to add your first booking.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      <AddEditModal
        formError={formMessage}
        isPending={saveMutation.isPending}
        isVisible={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitText={modalMode === "create" ? "Save Booking" : "Update Booking"}
        // subtitle="Manage transient reservations."
        title={modalMode === "create" ? "Create a booking" : "Edit booking"}
      >
        <DropdownField
          label={"Building"}
          options={buildingOptions.map((building) => ({
            label: building.title,
            value: building.id,
          }))}
          onSelect={(value) => {
            setFormData((current) => ({
              ...current,
              propertyId: value,
              roomNumber: "",
            }));
          }}
          value={formData.propertyId}
        />

        <BaseField
          keyboardType="number-pad"
          label="Room Number"
          onChangeText={(value) => updateForm("roomNumber", value)}
          placeholder="e.g. 101"
          value={formData.roomNumber}
        />

        <BaseField
          keyboardType="decimal-pad"
          label="Daily Rate"
          onChangeText={(value) => updateForm("dailyRate", value)}
          placeholder="e.g. 2500"
          value={formData.dailyRate}
        />

        {selectedFormBuilding && formData.roomNumber ? (
          <View className="rounded-2xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
            <Text className="text-xs font-medium text-[#6F6D6D]">
              <Text className="font-bold text-[#1d1d1f]">
                {selectedFormBuilding.title}
              </Text>
              {` - ${formData.roomNumber}`}
            </Text>
          </View>
        ) : null}

        <View className="gap-3 rounded-xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4">
          <DropdownField
            label="Guest"
            onSelect={selectGuest}
            options={guestOptions}
            placeholder={
              guests.length ? "Select an existing guest" : "No guests available"
            }
            subtitle="Select a saved guest or add a new one."
            value={selectedGuestId}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            className="self-start rounded-full bg-[#2563EB]/10 px-4 py-2.5"
            onPress={() => {
              setIsAddingGuest((current) => !current);
              setSelectedGuestId("");
              if (!isAddingGuest) {
                setFormData((current) => ({
                  ...current,
                  guestName: "",
                  guestEmail: "",
                  guestPhone: "",
                }));
              }
            }}
          >
            <Text className="text-xs font-bold text-[#2563EB]">
              {isAddingGuest ? "Cancel Add Guest" : "Add Guest"}
            </Text>
          </TouchableOpacity>

          {isAddingGuest ? (
            <View className="gap-4 border-t border-[#1d1d1f]/10 pt-4">
              <BaseField
                label="Guest Name"
                onChangeText={(value) => updateForm("guestName", value)}
                value={formData.guestName}
              />
              <BaseField
                keyboardType="phone-pad"
                label="Guest Phone"
                onChangeText={(value) => updateForm("guestPhone", value)}
                value={formData.guestPhone}
              />
              <BaseField
                keyboardType="email-address"
                label="Guest Email"
                onChangeText={(value) => updateForm("guestEmail", value)}
                value={formData.guestEmail}
              />
            </View>
          ) : null}
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <PickerField
              label="Check-in Date"
              onPress={() => setActivePickerField("startDate")}
              placeholder="Select date"
              value={formData.startDate}
            />
          </View>
          <View className="w-32">
            <PickerField
              iconName="time-outline"
              label="Check-in Time"
              onPress={() => setActivePickerField("checkInTime")}
              placeholder="Select time"
              value={formData.checkInTime}
            />
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <PickerField
              label="Check-out Date"
              onPress={() => setActivePickerField("endDate")}
              placeholder="Select date"
              value={formData.endDate}
            />
          </View>
          <View className="w-32">
            <PickerField
              iconName="time-outline"
              label="Check-out Time"
              onPress={() => setActivePickerField("checkOutTime")}
              placeholder="Select time"
              value={formData.checkOutTime}
            />
          </View>
        </View>

        {activePickerField ? (
          <Modal
            animationType="fade"
            onRequestClose={() => setActivePickerField(null)}
            transparent
            visible
          >
            <View className="flex-1 justify-center bg-black/40 px-5">
              <View className="rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-5 shadow-xl">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-[#1d1d1f]">
                    {getBookingPickerTitle(activePickerField)}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="rounded-full bg-[#2563EB]/5 px-3 py-1.5"
                    onPress={() => setActivePickerField(null)}
                  >
                    <Text className="text-xs font-bold text-[#2563EB]">
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  display={
                    Platform.OS === "ios"
                      ? activePickerField === "startDate" ||
                        activePickerField === "endDate"
                        ? "inline"
                        : "spinner"
                      : "default"
                  }
                  minimumDate={
                    activePickerField === "endDate" && formData.startDate
                      ? new Date(`${formData.startDate}T12:00:00`)
                      : undefined
                  }
                  mode={
                    activePickerField === "startDate" ||
                    activePickerField === "endDate"
                      ? "date"
                      : "time"
                  }
                  onChange={(event, selectedValue) => {
                    if (Platform.OS === "android") setActivePickerField(null);
                    const selection = getBookingPickerChange(
                      event.type,
                      activePickerField,
                      selectedValue,
                    );
                    if (selection) updateForm(selection.field, selection.value);
                  }}
                  value={getBookingPickerValue(formData, activePickerField)}
                />
              </View>
            </View>
          </Modal>
        ) : null}

        {formData.propertyId &&
        formData.roomNumber &&
        formData.startDate &&
        formData.endDate ? (
          <View
            className={`rounded-2xl border p-4 ${
              formConflict
                ? "border-amber-500/30 bg-amber-50"
                : "border-emerald-500/30 bg-emerald-50"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                formConflict ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {formConflict
                ? `Not available. Conflicts with ${formConflict.guestName} from ${getDateRangeLabel(
                    formConflict,
                  )}.`
                : "Available for this check-in and check-out window."}
            </Text>
          </View>
        ) : null}

        <BaseField
          label="Notes"
          multiline
          onChangeText={(value) => updateForm("notes", value)}
          placeholder="Optional booking notes"
          value={formData.notes}
        />

        {modalMode === "edit" && editingBooking?.status === "Booked" ? (
          <TouchableOpacity
            activeOpacity={0.85}
            className="mb-3 h-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-50"
            disabled={cancelMutation.isPending}
            onPress={() =>
              editingBooking && cancelMutation.mutate(editingBooking.id)
            }
          >
            {cancelMutation.isPending ? (
              <ActivityIndicator color="#DC2626" />
            ) : (
              <Text className="font-bold text-rose-600">Cancel Booking</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </AddEditModal>
    </Screen>
  );
}
