import { Text, View } from "react-native";

import type { TransientBooking } from "../../types";
import { getDateRangeLabel } from "../../utils/bookings/bookingCalendar";

export function BookingAvailabilityMessage({
  conflict,
}: {
  conflict?: TransientBooking;
}) {
  return (
    <View
      className={`rounded-2xl border p-4 ${
        conflict
          ? "border-warning/30 bg-warningSurface"
          : "border-success/25 bg-successSurface"
      }`}
    >
      <Text
        className={`font-ralewayBold text-sm ${
          conflict ? "text-warning" : "text-success"
        }`}
      >
        {conflict
          ? `Not available. Conflicts with ${conflict.guestName} from ${getDateRangeLabel(conflict)}.`
          : "Available for this check-in and check-out window."}
      </Text>
    </View>
  );
}
