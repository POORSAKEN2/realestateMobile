import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { fetchTransientBookings } from "../../api/bookings";
import {
  BookingCalendar,
  BookingCalendarEmpty,
  BookingCalendarLoading,
  BookingDaySchedule,
  BookingFilters,
  BookingFormModal,
  BookingReservationList,
} from "../../components/bookings";
import AddButton from "../../components/ui/buttons/AddButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { useProperties } from "../../hooks/api/useProperties";
import { useClients } from "../../hooks/api/useClients";
import { useBookingCalendar, useBookingForm } from "../../hooks/bookings";
import { useAuth } from "../../hooks/useAuth";
import { useSnackbar } from "../../hooks/useSnackbar";
import {
  getParamValue,
  type StatusFilter,
} from "../../utils/bookings/bookingCalendar";

export default function BookingsScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const params = useLocalSearchParams<{ propertyId?: string }>();
  const requestedPropertyId = getParamValue(params.propertyId);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Booked");
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  const { data: guests = [] } = useClients(accessToken);

  const buildingOptions = useMemo(
    () =>
      properties
        .filter((property) => property.isTransientBookable)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [properties],
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
  const calendar = useBookingCalendar({
    bookings: visibleBookings,
    availabilityBookings: selectedBuildingBookings,
  });
  const bookingSnackbar = useSnackbar();
  const bookingForm = useBookingForm({
    accessToken,
    bookings,
    buildings: buildingOptions,
    guests,
    onSaved: (payload, operation) => {
      setSelectedPropertyId(payload.propertyId);
      bookingSnackbar.show(
        operation === "created" ? "Booking created." : "Booking updated.",
      );
    },
  });
  const isLoading = isLoadingProperties || isLoadingBookings;

  async function refreshBookings() {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchProperties(), refetchBookings()]);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <Screen bottomInset="tab-bar" className="bg-surface">
      <View className="flex-1 gap-5">
        <View className="px-1">
          <ModuleHeader
            action={
              <AddButton
                disabled={!selectedBuilding}
                onPress={() =>
                  bookingForm.openCreate(
                    selectedPropertyId,
                    calendar.selectedDate,
                  )
                }
              />
            }
            eyebrow="Short Stay"
            title="Bookings"
          />
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl
              colors={["#634CE4"]}
              onRefresh={refreshBookings}
              refreshing={isRefreshing}
              tintColor="#634CE4"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-4 pb-8">
            <BookingFilters
              buildings={buildingOptions}
              onSelectBuilding={setSelectedPropertyId}
              onSelectStatus={setStatusFilter}
              selectedBuilding={selectedBuilding}
              selectedStatus={statusFilter}
            />

            {isLoading ? (
              <BookingCalendarLoading />
            ) : buildingOptions.length === 0 ? (
              <BookingCalendarEmpty />
            ) : (
              <>
                <BookingCalendar
                  availabilityBookings={selectedBuildingBookings}
                  bookings={visibleBookings}
                  currentMonth={calendar.currentMonth}
                  onChangeMonth={calendar.changeMonth}
                  onGoToToday={calendar.goToToday}
                  onSelectDay={calendar.selectDay}
                  selectedDate={calendar.selectedDate}
                />
                <BookingDaySchedule
                  availability={calendar.selectedDayAvailability}
                  bookings={calendar.selectedDayBookings}
                  canCreate={calendar.canCreateOnSelectedDay}
                  date={calendar.selectedDate}
                  onCreate={(date) =>
                    bookingForm.openCreate(selectedPropertyId, date)
                  }
                  onOpenBooking={bookingForm.openEdit}
                />
              </>
            )}

            <BookingReservationList
              bookings={visibleBookings}
              buildingTitle={selectedBuilding?.title}
              isLoading={isLoading}
              onOpenBooking={bookingForm.openEdit}
            />
          </View>
        </ScrollView>
      </View>

      <BookingFormModal
        buildings={buildingOptions}
        rooms={bookingForm.rooms}
        conflict={bookingForm.conflict}
        editingBooking={bookingForm.editingBooking}
        form={bookingForm.form}
        formError={bookingForm.message}
        guests={guests}
        isAddingGuest={bookingForm.isAddingGuest}
        isCancelling={bookingForm.isCancelling}
        isLoadingRooms={bookingForm.isLoadingRooms}
        isSaving={bookingForm.isSaving}
        isVisible={bookingForm.isOpen}
        mode={bookingForm.mode}
        onCancelBooking={bookingForm.cancel}
        onClose={bookingForm.close}
        onSelectBuilding={bookingForm.selectBuilding}
        onSelectRoom={bookingForm.selectRoom}
        onSelectGuest={bookingForm.selectGuest}
        onSubmit={bookingForm.submit}
        onToggleAddingGuest={bookingForm.toggleAddingGuest}
        onUpdateForm={bookingForm.updateForm}
        selectedBuilding={bookingForm.selectedBuilding}
        selectedGuestId={bookingForm.selectedGuestId}
        selectedRoom={bookingForm.selectedRoom}
      />

      <ScreenSnackbar
        message={bookingSnackbar.message}
        onDismiss={bookingSnackbar.dismiss}
      />
    </Screen>
  );
}
