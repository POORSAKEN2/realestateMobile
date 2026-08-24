import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef } from "react";
import {
  Animated,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Lessee } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { BottomSheetModal } from "../ui/BottomSheetModal";

function getTenantInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "T"
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Ionicons color="#8A77F4" name={icon} size={19} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-ralewayExtraBold text-[10px] uppercase tracking-wider text-description">
          {label}
        </Text>
        <Text
          className="mt-1 font-ralewaySemiBold text-sm text-textPrimary"
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export function TenantDetailsModal({
  linkedLeaseCount,
  monthlyRent,
  onClose,
  propertyNames = [],
  tenant,
}: {
  linkedLeaseCount?: number;
  monthlyRent?: number;
  onClose: () => void;
  propertyNames?: string[];
  tenant: Lessee | null;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const swipeDownResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          sheetTranslateY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 72 || gesture.vy > 0.9) {
            Animated.timing(sheetTranslateY, {
              duration: 180,
              toValue: height,
              useNativeDriver: true,
            }).start(() => {
              onClose();
              sheetTranslateY.setValue(0);
            });
            return;
          }

          Animated.spring(sheetTranslateY, {
            bounciness: 4,
            speed: 20,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(sheetTranslateY, {
            bounciness: 4,
            speed: 20,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [height, onClose, sheetTranslateY],
  );

  return (
    <BottomSheetModal
      backdropAccessibilityLabel="Close tenant details"
      backdropClassName="bg-textPrimary/45"
      onClose={onClose}
      statusBarTranslucent
      visible={Boolean(tenant)}
    >
      {tenant ? (
        <Animated.View
          className="overflow-hidden rounded-t-[30px] bg-white"
          style={{
            maxHeight: height * 0.84,
            transform: [{ translateY: sheetTranslateY }],
          }}
        >
          <View
            accessible
            accessibilityLabel="Swipe down to close tenant details"
            className="h-9 items-center justify-center"
            {...swipeDownResponder.panHandlers}
          >
            <View className="h-1.5 w-12 rounded-full bg-primary/30" />
          </View>

          <ScrollView
            bounces={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="px-6 pb-2">
              <View className="flex-row items-start gap-4">
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Text className="font-ralewayExtraBold text-xl text-secondary">
                    {getTenantInitials(tenant.name)}
                  </Text>
                </View>
                <View className="min-w-0 flex-1 pt-0.5">
                  <Text className="font-ralewayExtraBold text-2xl text-textPrimary">
                    {tenant.name}
                  </Text>
                  <Text className="mt-1 font-ralewaySemiBold text-xs uppercase tracking-wider text-description">
                    Tenant profile
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityLabel="Close tenant details"
                  accessibilityRole="button"
                  activeOpacity={0.75}
                  className="h-10 w-10 items-center justify-center rounded-full bg-primary/10"
                  onPress={onClose}
                >
                  <Ionicons color="#8A77F4" name="close" size={20} />
                </TouchableOpacity>
              </View>

              {linkedLeaseCount !== undefined || monthlyRent !== undefined ? (
                <View className="mt-6 flex-row gap-3">
                  {linkedLeaseCount !== undefined ? (
                    <View className="min-w-0 flex-1 rounded-2xl border border-primary/20 bg-primary/10 p-4">
                      <Text className="font-ralewayExtraBold text-[10px] uppercase tracking-wider text-description">
                        Linked leases
                      </Text>
                      <Text className="mt-1 font-ralewayExtraBold text-xl text-textPrimary">
                        {linkedLeaseCount}
                      </Text>
                    </View>
                  ) : null}
                  {monthlyRent !== undefined ? (
                    <View className="min-w-0 flex-1 rounded-2xl border border-primary/20 bg-primary/10 p-4">
                      <Text className="font-ralewayExtraBold text-[10px] uppercase tracking-wider text-description">
                        Monthly rent
                      </Text>
                      <Text
                        adjustsFontSizeToFit
                        className="mt-1 font-ralewayExtraBold text-xl text-textPrimary"
                        numberOfLines={1}
                      >
                        {formatCurrency(monthlyRent)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <Text className="mb-3 mt-6 font-ralewayExtraBold text-xs uppercase tracking-wider text-description">
                Contact details
              </Text>
              <View className="gap-3">
                <ContactRow
                  icon="mail-outline"
                  label="Email"
                  value={tenant.contactEmail || "No email on file"}
                />
                <ContactRow
                  icon="call-outline"
                  label="Phone"
                  value={tenant.phone || "No phone on file"}
                />
              </View>

              {propertyNames.length > 0 ? (
                <>
                  <Text className="mb-3 mt-6 font-ralewayExtraBold text-xs uppercase tracking-wider text-description">
                    Linked properties
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {propertyNames.map((propertyName) => (
                      <View
                        className="max-w-full flex-row items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2"
                        key={propertyName}
                      >
                        <Ionicons
                          color="#8A77F4"
                          name="business-outline"
                          size={14}
                        />
                        <Text
                          className="min-w-0 font-ralewayBold text-xs text-textPrimary"
                          numberOfLines={1}
                        >
                          {propertyName}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          </ScrollView>
        </Animated.View>
      ) : null}
    </BottomSheetModal>
  );
}
