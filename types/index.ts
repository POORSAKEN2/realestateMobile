export type {
  Bedspace,
  BedspacePayload,
  BedspaceStatus,
} from "./domain/bedspaces";
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
  RegistrationDraft,
} from "./auth";
export type { PortfolioSnapshot, PortfolioStats } from "./domain/analytics";
export type {
  GeocodingClient,
  LocationSearchResult,
  ReverseGeocodeResult,
} from "./domain/geocoding";
export type {
  FloorArea,
  FloorAreaPayload,
  FloorPlan,
  FloorPlanDrawingMode,
  FloorPlanImageUpload,
  FloorPlanPayload,
  FloorPlanPoint,
  PropertyRoom,
  PropertyRoomPayload,
  PropertyRoomStatus,
} from "./domain/floorplans";
export type {
  CreatePropertyPayload,
  Property,
  PropertyClassification,
  PropertyImageUpload,
  PropertySpatialCapabilities,
  PropertyType,
  SpatialCapabilityLevel,
  UpdatePropertyPayload,
} from "./domain/properties";
export { PROPERTY_TAXONOMY } from "./domain/properties";
export type {
  DocumentCategory,
  DocumentUpdatePayload,
  DocumentUpload,
  Lease,
  LeaseLedger,
  LeasePayment,
  LeasePayload,
  Lessee,
  LesseePayload,
  PaymentStatus,
  PropertyDocument,
  TenantFinancialLedger,
} from "./domain/propertyDetails";
export {
  TENANT_NOTE_CATEGORIES,
  type CreateTenantNotePayload,
  type TenantNote,
  type TenantNoteCategory,
  type TenantNoteDraft,
  type TenantNoteListParams,
  type TenantNotePage,
  type UpdateTenantNotePayload,
} from "./domain/tenantNotes";
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
export type {
  EditableProfileField,
  ProfileCompletion,
  ProfileForm,
  ProfileImageGateway,
  ProfileImageSelection,
  ProfileImageUpload,
  ProfileSaveResult,
  ProfileUpdateGateway,
  ProfileValidationErrors,
  UpdateUserProfilePayload,
} from "./domain/profile";
