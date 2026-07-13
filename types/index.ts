export type {
  ApiEnvelope,
  ApiErrorResponse,
  PaginatedApiData,
  RequestOptions,
} from "./api/common";
export type {
  AuthContextValue,
  AuthResponse,
  AuthSession,
  AuthUser,
  RegisterFormData,
} from "./auth";
export type { PortfolioSnapshot, PortfolioStats } from "./domain/analytics";
export type {
  CreatePropertyPayload,
  Property,
  PropertyClassification,
  PropertyImageUpload,
  PropertyType,
  UpdatePropertyPayload,
} from "./domain/properties";
export { PROPERTY_TAXONOMY } from "./domain/properties";
export type {
  DocumentCategory,
  DocumentUpdatePayload,
  DocumentUpload,
  Lease,
  LeasePayload,
  Lessee,
  LesseePayload,
  PropertyDocument,
} from "./domain/propertyDetails";
export type {
  TransientBooking,
  TransientBookingPayload,
  TransientBookingStatus,
} from "./domain/bookings";
export type {
  AppNotification,
  AppNotificationSeverity,
  DevicePushToken,
  NotificationModule,
  PushNotificationData,
  PushTokenPlatform,
  RegisterPushTokenPayload,
} from "./domain/notifications";
