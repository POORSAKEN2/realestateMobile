import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { colors } from "../../constants/colors";
import { usePropertyVerificationController } from "../../hooks/properties/usePropertyVerificationController";
import {
  createPropertyVerification,
  submitPropertyVerification,
  withdrawPropertyVerification,
  updateListingAvailability,
  setPropertyPublication,
  inspectPropertyEvidence,
} from "../../api/propertyVerification";
import { Button } from "../ui/buttons/Button";
import { SkeletonBlock } from "../ui/Skeleton";
import { PropertyAdminSection } from "./PropertyAdminSection";
import { VerificationAvailability } from "./verification/VerificationAvailability";
import { VerificationRecordCard } from "./verification/VerificationRecordCard";

export function PropertyVerificationPanel({
  propertyId,
}: {
  propertyId: string;
}) {
  const controller = usePropertyVerificationController(propertyId);
  const { query, action, page, setPage, run, upload, feedback } = controller;
  const [requirementsOpen, setRequirementsOpen] = useState(false);
  const state = query.data;
  const pending = action.isPending;
  const unfinished = state?.records.some((record) =>
    ["draft", "pending"].includes(record.status),
  );
  return (
    <PropertyAdminSection
      title="Marketplace verification"
      description="Submit private evidence for independent review, then publish when ready."
      icon="shield"
    >
      {query.isPending ? (
        <View accessibilityLabel="Loading verification" className="gap-3">
          <SkeletonBlock className="h-16 w-full" />
          <SkeletonBlock className="h-12 w-full" />
        </View>
      ) : !state ? (
        <>
          <Text accessibilityRole="alert" className="text-sm text-danger">
            {query.error?.message ?? "Verification unavailable."}
          </Text>
          <Button
            title="Retry verification"
            variant="secondary"
            onPress={() => {
              void query.refetch();
            }}
          />
        </>
      ) : (
        <>
          <View
            className={`gap-2 rounded-xl p-3 ${state.is_verified ? "bg-successSurface" : "bg-infoSurface"}`}
          >
            <Text
              className={`font-ralewayBold text-sm ${state.is_verified ? "text-success" : "text-info"}`}
            >
              {state.is_verified
                ? "Verified property"
                : "Independent review required"}
            </Text>
            <Text className="text-xs leading-5 text-description">
              {state.is_published
                ? "Listing is published. Current verification and availability are required for public visibility."
                : "Listing is unpublished. Complete the requirements below to publish."}
            </Text>
          </View>
          <VerificationAvailability
            availability={state.availability}
            pending={pending}
            onSave={(from, until) =>
              run(
                () => updateListingAvailability(propertyId, from, until),
                "Availability saved.",
              )
            }
          />
          <View className="gap-3">
            <Text className="font-ralewayBold text-sm text-textPrimary">
              Publication
            </Text>
            {state.eligibility_reasons.length ? (
              <>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ expanded: requirementsOpen }}
                  className="min-h-11 flex-row items-center justify-between gap-2"
                  onPress={() => setRequirementsOpen((value) => !value)}
                >
                  <Text className="min-w-0 flex-1 font-ralewaySemiBold text-xs text-warning">
                    {state.eligibility_reasons.length} requirement
                    {state.eligibility_reasons.length === 1 ? "" : "s"}{" "}
                    remaining
                  </Text>
                  <Feather
                    name={requirementsOpen ? "chevron-up" : "chevron-down"}
                    color={colors.warning}
                    size={18}
                  />
                </TouchableOpacity>
                {requirementsOpen ? (
                  <View className="gap-2 rounded-xl bg-warningSurface p-3">
                    {state.eligibility_reasons.map((reason) => (
                      <Text
                        key={reason}
                        className="text-xs leading-5 text-warning"
                      >
                        • {reason}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </>
            ) : (
              <Text className="text-xs text-success">
                All publication requirements met. Plan limits still apply.
              </Text>
            )}
            <Button
              title={
                state.is_published ? "Unpublish listing" : "Publish listing"
              }
              disabled={
                pending ||
                (!state.is_published && state.eligibility_reasons.length > 0)
              }
              onPress={() => {
                void run(
                  () => setPropertyPublication(propertyId, !state.is_published),
                  state.is_published
                    ? "Listing unpublished."
                    : "Listing published.",
                );
              }}
            />
          </View>
          <View className="gap-3 border-t border-primary/15 pt-4">
            <Text className="font-ralewayBold text-sm text-textPrimary">
              Verification requests
            </Text>
            {!state.records.length ? (
              <Text className="text-xs leading-5 text-description">
                No requests yet. Start a request and attach the required
                evidence.
              </Text>
            ) : null}
            {!unfinished && page === 1
              ? Object.entries(state.policy.levels).map(([level, policy]) => (
                  <Button
                    key={level}
                    title={`Request ${policy.label}`}
                    variant="secondary"
                    disabled={pending}
                    onPress={() => {
                      void run(
                        () => createPropertyVerification(propertyId, level),
                        "Verification draft created.",
                      );
                    }}
                  />
                ))
              : null}
            {state.records.map((record) => (
              <VerificationRecordCard
                key={record.id}
                record={record}
                policy={state.policy}
                pending={pending}
                onInspect={(id, name) => {
                  void run(() =>
                    inspectPropertyEvidence(propertyId, record.id, id, name),
                  );
                }}
                onUpload={(type) => {
                  void upload(record.id, type);
                }}
                onSubmit={() => {
                  void run(
                    () => submitPropertyVerification(propertyId, record.id),
                    "Submitted for independent review.",
                  );
                }}
                onWithdraw={() => {
                  void run(
                    () => withdrawPropertyVerification(propertyId, record.id),
                    "Verification request withdrawn.",
                  );
                }}
              />
            ))}
            {page > 1 || state.next_page ? (
              <View className="gap-2">
                <Text className="text-center text-xs text-description">
                  Request history · Page {page}
                </Text>
                {page > 1 ? (
                  <Button
                    title="Previous requests"
                    variant="secondary"
                    disabled={pending || query.isFetching}
                    onPress={() => setPage(page - 1)}
                  />
                ) : null}
                {state.next_page ? (
                  <Button
                    title="More requests"
                    variant="secondary"
                    disabled={pending || query.isFetching}
                    onPress={() => setPage(state.next_page!)}
                  />
                ) : null}
              </View>
            ) : null}
          </View>
          {query.isError ? (
            <Text accessibilityRole="alert" className="text-xs text-danger">
              Refresh failed. Showing the last loaded verification status.
            </Text>
          ) : null}
          <Button
            title="Refresh status"
            variant="secondary"
            disabled={pending}
            isLoading={query.isFetching}
            onPress={() => {
              void query.refetch();
            }}
          />
          {feedback ? (
            <Text
              accessibilityLiveRegion="polite"
              accessibilityRole={feedback.failed ? "alert" : undefined}
              className={`text-sm leading-5 ${feedback.failed ? "text-danger" : "text-success"}`}
            >
              {feedback.message}
            </Text>
          ) : null}
        </>
      )}
    </PropertyAdminSection>
  );
}
