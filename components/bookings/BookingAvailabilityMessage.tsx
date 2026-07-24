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
          ? "border-amber-500/30 bg-amber-50"
          : "border-emerald-500/30 bg-emerald-50"
      }`}
    >
      <Text
        className={`text-sm font-ralewayBold ${
          conflict ? "text-amber-700" : "text-emerald-700"
        }`}
      >
        {conflict
          ? `Not available. Conflicts with ${conflict.guestName} from ${getDateRangeLabel(conflict)}.`
          : "Available for this check-in and check-out window."}
      </Text>
    </View>
  );
}
