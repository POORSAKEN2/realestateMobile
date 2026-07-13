import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
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
import ChoiceChips from "../../components/ui/chips/ChoiceChips";
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
  getBookingStatusLabel,
  getDateRangeLabel,
  getMonthDays,
  getParamValue,
  parseMoney,
  weekdayLabels,
  type BookingFormMode,
  type BookingFormState,
  type StatusFilter,
} from "../../utils/bookings/bookingCalendar";

export default function BookingsScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const params = useLocalSearchParams<{ propertyId?: string }>();
  const requestedPropertyId = getParamValue(params.propertyId);
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Booked");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<BookingFormMode>("create");
  const [editingBooking, setEditingBooking] = useState<TransientBooking | null>(
    null,
  );
  const [formMessage, setFormMessage] = useState("");
  const [formData, setFormData] = useState<BookingFormState>(() => emptyForm());

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const buildingOptions = useMemo(() => {
    return properties
      .filter((property) => property.isTransientBookable)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [properties]);

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
  const isLoading = isLoadingProperties || isLoadingBookings;

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
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingBooking(null);
    setFormMessage("");
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
    <Screen className="bg-[#2563EB]/5">
      <View className="flex-1 gap-5">
        <View className="flex-row items-center justify-between px-1">
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-slate-400">
              Short Stay
            </Text>
            <Text className="font-soraSemiBold text-3xl tracking-tight text-[#1d1d1f]">
              Bookings
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            className="flex-row items-center gap-2 rounded-2xl bg-[#2563EB] px-4 py-3 shadow-md shadow-blue-200"
            disabled={!selectedBuilding || buildingOptions.length < 1}
            onPress={() => openCreate()}
          >
            <Ionicons name="add" color="#FFFFFF" size={20} />
            <Text className="text-sm font-bold text-white">New</Text>
          </TouchableOpacity>
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
          <View className="gap-5 pb-8">
            <View className="gap-4 rounded-[28px] border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
                    Building
                  </Text>
                  <Text className="mt-1 text-base font-bold text-[#1d1d1f]">
                    {selectedBuilding?.title ?? "No building selected"}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="h-10 w-10 items-center justify-center rounded-full bg-[#2563EB]/10"
                    onPress={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() - 1,
                          1,
                        ),
                      )
                    }
                  >
                    <Ionicons name="chevron-back" color="#2563EB" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="h-10 w-10 items-center justify-center rounded-full bg-[#2563EB]/10"
                    onPress={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1,
                          1,
                        ),
                      )
                    }
                  >
                    <Ionicons
                      name="chevron-forward"
                      color="#2563EB"
                      size={20}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Text className="text-center font-soraSemiBold text-lg text-[#1d1d1f]">
                {monthLabel}
              </Text>

              {buildingOptions.length > 0 ? (
                <BuildingChoices
                  buildings={buildingOptions}
                  onSelect={setSelectedPropertyId}
                  selectedId={selectedPropertyId}
                />
              ) : null}

              <ChoiceChips<StatusFilter>
                options={[
                  { label: "Booked", value: "Booked" },
                  { label: "All", value: "All" },
                ]}
                onSelect={setStatusFilter}
                value={statusFilter}
              />
            </View>

            {isLoading ? (
              <View className="items-center rounded-[28px] border border-[#1d1d1f]/10 bg-[#FFFFFF] p-8 shadow-sm">
                <ActivityIndicator color="#2563EB" />
                <Text className="mt-3 text-sm font-semibold text-[#1d1d1f]">
                  Loading bookings
                </Text>
              </View>
            ) : buildingOptions.length === 0 ? (
              <View className="items-center rounded-[28px] border border-dashed border-[#1d1d1f]/20 bg-[#FFFFFF]/95 p-8 shadow-sm">
                <Ionicons name="calendar-outline" color="#2563EB" size={38} />
                <Text className="mt-3 text-base font-bold text-[#1d1d1f]">
                  No transient-bookable buildings yet
                </Text>
                <Text className="mt-1 text-center text-sm leading-5 text-[#6F6D6D]">
                  Mark a property as available for transient bookings in the
                  property form.
                </Text>
              </View>
            ) : (
              <View className="overflow-hidden rounded-[28px] border border-[#1d1d1f]/10 bg-[#FFFFFF] shadow-sm">
                <View className="flex-row border-b border-[#1d1d1f]/10 p-2">
                  {weekdayLabels.map((day) => (
                    <Text
                      key={day}
                      className="flex-1 text-center text-[10px] font-bold uppercase text-[#6F6D6D]"
                    >
                      {day}
                    </Text>
                  ))}
                </View>

                <View className="flex-row flex-wrap p-1">
                  {monthDays.map((day) => {
                    const key = dateKey(day);
                    const dayBookings = getBookingsForDay(visibleBookings, day);
                    const availability = getAvailabilityForDay(
                      selectedBuildingBookings,
                      day,
                    );
                    const isCurrentMonth =
                      day.getMonth() === currentMonth.getMonth();
                    const canCreateFromDay =
                      availability.label === "Available" ||
                      availability.label === "After 2 PM";

                    return (
                      <TouchableOpacity
                        key={key}
                        activeOpacity={0.78}
                        className={`m-0.5 min-h-[86px] rounded-2xl border border-[#1d1d1f]/5 p-2 ${
                          isCurrentMonth ? "bg-[#FFFFFF]" : "bg-[#1d1d1f]/5"
                        }`}
                        onPress={() =>
                          canCreateFromDay
                            ? openCreate(key)
                            : dayBookings[0] && openEdit(dayBookings[0])
                        }
                        style={{ width: "13.25%" }}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            isCurrentMonth ? "text-[#1d1d1f]" : "text-[#6F6D6D]"
                          }`}
                        >
                          {day.getDate()}
                        </Text>
                        <View
                          className={`mt-1 rounded-md px-1.5 py-1 ${availability.bg}`}
                        >
                          <Text
                            className={`text-[8px] font-bold uppercase leading-3 ${availability.text}`}
                            numberOfLines={2}
                          >
                            {availability.label}
                          </Text>
                        </View>
                        {dayBookings.slice(0, 1).map((booking) => (
                          <View
                            key={booking.id}
                            className="mt-1 rounded-md bg-[#2563EB]/10 px-1.5 py-1"
                          >
                            <Text
                              className="text-[9px] font-bold text-[#2563EB]"
                              numberOfLines={1}
                            >
                              {booking.guestName}
                            </Text>
                            <Text
                              className="text-[8px] font-medium text-[#2563EB]"
                              numberOfLines={1}
                            >
                              Room {booking.roomNumber}
                            </Text>
                          </View>
                        ))}
                        {dayBookings.length > 1 ? (
                          <Text className="mt-1 text-[9px] font-medium text-[#6F6D6D]">
                            +{dayBookings.length - 1} more
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View className="mb-16 gap-3 rounded-[28px] border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
              <View>
                <Text className="text-lg font-bold text-[#1d1d1f]">
                  Booking History
                </Text>
                <Text className="mt-1 text-xs font-medium text-[#6F6D6D]">
                  {selectedBuilding?.title ?? "Select a building"}
                </Text>
              </View>

              {isLoading ? (
                <Text className="text-sm font-medium text-[#6F6D6D]">
                  Loading bookings...
                </Text>
              ) : visibleBookings.length > 0 ? (
                visibleBookings
                  .slice()
                  .sort((a, b) => a.startDate.localeCompare(b.startDate))
                  .map((booking) => (
                    <TouchableOpacity
                      key={booking.id}
                      activeOpacity={0.82}
                      className="rounded-2xl border border-[#1d1d1f]/10 bg-[#2563EB]/5 p-4"
                      onPress={() => openEdit(booking)}
                    >
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="min-w-0 flex-1">
                          <Text
                            className="font-soraSemiBold text-base text-[#1d1d1f]"
                            numberOfLines={1}
                          >
                            {booking.guestName}
                          </Text>
                          <Text className="mt-1 text-xs font-medium text-[#6F6D6D]">
                            {selectedBuilding?.title ?? "Building"} - Room{" "}
                            {booking.roomNumber}
                          </Text>
                          <Text className="mt-1 text-xs text-[#6F6D6D]">
                            Check-in: {formatDisplayDate(booking.startDate)}{" "}
                            {formatDisplayTime(booking.checkInTime)}
                          </Text>
                          <Text className="mt-1 text-xs text-[#6F6D6D]">
                            Check-out: {formatDisplayDate(booking.endDate)}{" "}
                            {formatDisplayTime(booking.checkOutTime)}
                          </Text>
                        </View>
                        <View
                          className={`rounded-md px-2 py-1 ${
                            booking.status === "Cancelled"
                              ? "bg-[#1d1d1f]/10"
                              : booking.endDate === dateKey(new Date())
                                ? "bg-amber-50"
                                : "bg-rose-50"
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-bold uppercase ${
                              booking.status === "Cancelled"
                                ? "text-[#6F6D6D]"
                                : booking.endDate === dateKey(new Date())
                                  ? "text-amber-600"
                                  : "text-rose-600"
                            }`}
                          >
                            {getBookingStatusLabel(booking)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
              ) : (
                <View className="rounded-2xl border border-dashed border-[#1d1d1f]/20 p-6">
                  <Text className="text-center text-sm font-bold text-[#1d1d1f]">
                    No bookings found
                  </Text>
                  <Text className="mt-1 text-center text-xs text-[#6F6D6D]">
                    Create a booking from the calendar or the button above.
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
        submitText={modalMode === "create" ? "Create" : "Save"}
        subtitle="Manage transient reservations."
        title={modalMode === "create" ? "Create Booking" : "Edit Booking"}
      >
        <View className="gap-3 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
            Building
          </Text>
          <ChoiceChips
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
        </View>

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

        <View className="flex-row gap-3">
          <View className="flex-1">
            <BaseField
              label="Check-in Date"
              onChangeText={(value) => updateForm("startDate", value)}
              placeholder="YYYY-MM-DD"
              value={formData.startDate}
            />
          </View>
          <View className="w-28">
            <BaseField
              label="Time"
              onChangeText={(value) => updateForm("checkInTime", value)}
              placeholder="14:00"
              value={formData.checkInTime}
            />
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <BaseField
              label="Check-out Date"
              onChangeText={(value) => updateForm("endDate", value)}
              placeholder="YYYY-MM-DD"
              value={formData.endDate}
            />
          </View>
          <View className="w-28">
            <BaseField
              label="Time"
              onChangeText={(value) => updateForm("checkOutTime", value)}
              placeholder="11:00"
              value={formData.checkOutTime}
            />
          </View>
        </View>

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
