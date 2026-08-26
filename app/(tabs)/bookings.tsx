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
  BookingFilterSheet,
  BookingFormModal,
  BookingReservationList,
  BookingViewToggle,
  type BookingViewMode,
} from "../../components/bookings";
import AddButton from "../../components/ui/buttons/AddButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { Screen } from "../../components/ui/Screen";
import {
  formatSearchResultLabel,
  SearchToolbar,
} from "../../components/ui/SearchToolbar";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<BookingViewMode>("month");

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
  const visibleBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return selectedBuildingBookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "All" || booking.status === statusFilter;
      const matchesSearch =
        !query ||
        [
          booking.guestName,
          booking.guestEmail,
          booking.guestPhone,
          booking.roomNumber,
          booking.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [searchQuery, selectedBuildingBookings, statusFilter]);
  const calendarBookings = useMemo(
    () =>
      statusFilter === "All"
        ? selectedBuildingBookings
        : selectedBuildingBookings.filter(
            (booking) => booking.status === statusFilter,
          ),
    [selectedBuildingBookings, statusFilter],
  );
  const calendar = useBookingCalendar({
    bookings: calendarBookings,
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
  const activeBookingFilterCount = [
    statusFilter !== "Booked",
    Boolean(
      selectedPropertyId && selectedPropertyId !== buildingOptions[0]?.id,
    ),
  ].filter(Boolean).length;

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
              colors={["#8A77F4"]}
              onRefresh={refreshBookings}
              refreshing={isRefreshing}
              tintColor="#8A77F4"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-4 pb-8">
            <BookingViewToggle value={viewMode} onChange={setViewMode} />

            <SearchToolbar
              accessibilityLabel="Search bookings"
              activeFilterCount={activeBookingFilterCount}
              clearAccessibilityLabel="Clear booking search"
              filterAccessibilityLabel="Filter bookings"
              filterLabel={`${selectedBuilding?.title ?? "No property"} · ${
                statusFilter === "All" ? "All statuses" : "Confirmed"
              }`}
              onChangeText={(value) => {
                setSearchQuery(value);
                if (value.trim()) setViewMode("agenda");
              }}
              onFilterPress={() => setIsFilterVisible(true)}
              placeholder="Guest, room, email, or phone"
              resultLabel={formatSearchResultLabel({
                filteredCount: visibleBookings.length,
                isLoading,
                singular: "reservation",
                totalCount: selectedBuildingBookings.length,
              })}
              value={searchQuery}
              variant={viewMode === "month" ? "compact" : "standard"}
            />

            {buildingOptions.length === 0 && !isLoading ? (
              <BookingCalendarEmpty />
            ) : viewMode === "month" ? (
              isLoading ? (
                <BookingCalendarLoading />
              ) : (
                <>
                  <BookingCalendar
                    availabilityBookings={selectedBuildingBookings}
                    bookings={calendarBookings}
                    currentMonth={calendar.currentMonth}
                    onChangeMonth={calendar.changeMonth}
                    onGoToToday={calendar.goToToday}
                    onSelectDay={calendar.selectDay}
                    propertyTitle={selectedBuilding?.title}
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
              )
            ) : (
              <BookingReservationList
                bookings={visibleBookings}
                buildingTitle={selectedBuilding?.title}
                hasActiveFilters={
                  Boolean(searchQuery.trim()) ||
                  visibleBookings.length !== selectedBuildingBookings.length
                }
                isLoading={isLoading}
                onOpenBooking={bookingForm.openEdit}
              />
            )}
          </View>
        </ScrollView>
      </View>

      <BookingFilterSheet
        buildings={buildingOptions}
        onApply={(filters) => {
          setSelectedPropertyId(filters.propertyId);
          setStatusFilter(filters.status);
          setIsFilterVisible(false);
        }}
        onClose={() => setIsFilterVisible(false)}
        selectedBuildingId={selectedPropertyId}
        selectedStatus={statusFilter}
        visible={isFilterVisible}
      />

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
