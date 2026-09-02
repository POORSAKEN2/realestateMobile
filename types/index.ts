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
  AccountDeletionRequestPayload,
  AuthContextValue,
  AuthResponse,
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  RegisterFormData,
  RegistrationDraft,
  ResetPasswordPayload,
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
  PropertyDocument,
  TenantFinancialLedger,
} from "./domain/propertyDetails";
export type {
  LeaseLedgerData,
  Payment,
  PaymentStatus,
  PaymentType,
  RecordPaymentPayload,
} from "./domain/payments";
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
  BillingEntitlement,
  CheckoutSessionPayload,
  CheckoutSessionResponse,
  PlanTier,
  SubscriptionTierKey,
} from "./domain/billing";
export type {
  ListingLead,
  ListingLeadStatus,
  ListingLeadType,
  UpdateLeadStatusPayload,
} from "./domain/leads";
export type {
  CreateSupportTicketPayload,
  FAQItem,
  SupportTicket,
  TicketPriority,
  TicketStatus,
} from "./domain/support";
export type { GlobalSearchResults } from "./domain/search";
export type { CreateStaffManagerPayload, StaffManager } from "./domain/staff";
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
