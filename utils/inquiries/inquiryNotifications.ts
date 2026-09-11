type InquiryNotificationData = {
  entityId?: string;
  module?: string;
  route?: string | null;
  type?: string | null;
};

export function isInquiryNotification(data?: InquiryNotificationData | null) {
  if (!data) return false;
  return (
    data.type?.trim().toUpperCase() === "LISTING_LEAD" ||
    data.module === "inquiries" ||
    Boolean(data.route?.includes("inquir"))
  );
}

export function inquiryNotificationRoute(
  data?: InquiryNotificationData | null,
) {
  if (!data || !isInquiryNotification(data)) return null;
  if (
    data.route &&
    !data.route.includes("inquir") &&
    data.module !== "inquiries"
  ) {
    return null;
  }
  if (!data.entityId) return "/(secondary)/inquiries";
  return `/(secondary)/inquiry-details?inquiryId=${encodeURIComponent(data.entityId)}`;
}
