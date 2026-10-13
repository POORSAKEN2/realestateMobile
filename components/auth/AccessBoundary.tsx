import type { PropsWithChildren } from "react";
import {
  Redirect,
  router,
  useGlobalSearchParams,
  useSegments,
} from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useAccess } from "../../hooks/auth/useAccess";
import {
  PROPERTY_ROUTES,
  ROUTE_PERMISSIONS,
} from "../../utils/auth/routeAccess";
import { Screen } from "../ui/Screen";
import { ModuleEmptyState } from "../ui/ModuleState";

export function AccessBoundary({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading, signOut } = useAuth();
  const { access, can, canAccessProperty, hasAssignments } = useAccess();
  const segments = useSegments();
  const params = useGlobalSearchParams<{ propertyId?: string | string[] }>();
  const route = segments[segments.length - 1];
  const propertyId = Array.isArray(params.propertyId)
    ? params.propertyId[0]
    : params.propertyId;
  if (isLoading) return children;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  const permission = ROUTE_PERMISSIONS[route];
  const needsAssignments =
    access.role === "MANAGER" &&
    PROPERTY_ROUTES.has(route) &&
    route !== "properties";
  const denied =
    (permission && !can(permission)) ||
    (PROPERTY_ROUTES.has(route) &&
      propertyId &&
      !canAccessProperty(propertyId));
  const aggregateUnavailable =
    access.role === "MANAGER" && route === "analytics";
  if (
    !denied &&
    !(needsAssignments && !hasAssignments) &&
    !aggregateUnavailable
  )
    return children;
  const title =
    needsAssignments && !hasAssignments
      ? "No assigned properties"
      : "Access unavailable";
  const description =
    needsAssignments && !hasAssignments
      ? "Ask your account owner to assign properties to your manager account."
      : aggregateUnavailable
        ? "Portfolio reporting is not available for manager accounts yet."
        : "Your account does not have permission to open this page or property.";
  return (
    <Screen className="bg-surface">
      <View className="flex-1 justify-center gap-6">
        <ModuleEmptyState
          title={title}
          description={description}
          icon="lock-closed-outline"
        />
        <TouchableOpacity
          className="mx-auto w-1/3 items-center p-4"
          onPress={() => router.back()}
        >
          <Text className="rounded text-center font-ralewayBold text-primary">
            Back
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
