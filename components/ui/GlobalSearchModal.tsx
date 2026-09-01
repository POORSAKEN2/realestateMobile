import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { searchGlobal } from "../../api/search";
import { colors } from "../../constants/colors";
import { appRoutes } from "../../constants/navigation";
import type { GlobalSearchResults } from "../../types/domain/search";
import { openModuleRoute } from "../../utils/navigation/moduleNavigation";

type GlobalSearchModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

export function GlobalSearchModal({ isVisible, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setQuery("");
      setResults(null);
      return;
    }
  }, [isVisible]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const data = await searchGlobal(trimmed);
        setResults(data);
      } catch (err) {
        console.warn("Global search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  function navigateTo(route: Href) {
    onClose();
    setTimeout(() => {
      openModuleRoute(route);
    }, 180);
  }

  const hasResults =
    results &&
    (results.properties.length > 0 ||
      results.leases.length > 0 ||
      results.clients.length > 0 ||
      results.expenses.length > 0 ||
      results.documents.length > 0 ||
      results.bookings.length > 0);

  return (
    <Modal
      animationType="fade"
      presentationStyle="pageSheet"
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
        {/* Search Header */}
        <View className="border-b border-primary/10 bg-white px-5 py-4">
          <View className="flex-row items-center gap-3">
            <View className="h-12 flex-1 flex-row items-center rounded-2xl border border-primary/20 bg-surface px-3.5">
              <Feather name="search" size={18} color={colors.primary} />
              <TextInput
                autoFocus
                className="ml-2.5 flex-1 font-ralewayMedium text-base text-textPrimary"
                onChangeText={setQuery}
                placeholder="Search properties, leases, clients, expenses..."
                placeholderTextColor={colors.description}
                returnKeyType="search"
                value={query}
              />
              {query ? (
                <TouchableOpacity onPress={() => setQuery("")}>
                  <Ionicons name="close-circle" size={18} color={colors.description} />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              className="h-12 px-3 items-center justify-center rounded-2xl"
              onPress={onClose}
            >
              <Text className="font-ralewayBold text-sm text-primary">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Body */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-5 pt-4"
            contentContainerClassName="pb-12 gap-5"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {query.trim().length < 2 ? (
              <View className="items-center justify-center p-8">
                <Feather name="search" size={32} color={colors.description} />
                <Text className="mt-3 font-ralewayBold text-base text-textPrimary">
                  Type at least 2 characters
                </Text>
                <Text className="mt-1 text-center text-xs text-description">
                  Universal search across Properties, Leases, Tenants, Expenses, Documents, and Bookings.
                </Text>
              </View>
            ) : !hasResults ? (
              <View className="items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-white p-8 mt-4">
                <Ionicons name="alert-circle-outline" size={36} color={colors.description} />
                <Text className="mt-3 font-ralewayBold text-base text-textPrimary">
                  No matching records found
                </Text>
                <Text className="mt-1 text-center text-xs text-description">
                  We couldn't find anything matching "{query}".
                </Text>
              </View>
            ) : (
              <>
                {/* Properties */}
                {results.properties.length > 0 ? (
                  <View className="gap-2">
                    <Text className="font-ralewayBold text-xs uppercase tracking-wider text-description">
                      Properties ({results.properties.length})
                    </Text>
                    {results.properties.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        className="flex-row items-center justify-between rounded-2xl border border-primary/15 bg-white p-3.5"
                        onPress={() => navigateTo(appRoutes.primary.properties)}
                      >
                        <View className="flex-row items-center gap-3">
                          <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <Ionicons name="business-outline" size={18} color={colors.primary} />
                          </View>
                          <View>
                            <Text className="font-ralewayBold text-sm text-textPrimary">
                              {item.title}
                            </Text>
                            <Text className="text-xs text-description">
                              {item.location || item.type || "Property"}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.description} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                {/* Leases */}
                {results.leases.length > 0 ? (
                  <View className="gap-2">
                    <Text className="font-ralewayBold text-xs uppercase tracking-wider text-description">
                      Leases ({results.leases.length})
                    </Text>
                    {results.leases.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        className="flex-row items-center justify-between rounded-2xl border border-primary/15 bg-white p-3.5"
                        onPress={() => navigateTo(appRoutes.secondary.leases)}
                      >
                        <View className="flex-row items-center gap-3">
                          <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                          </View>
                          <View>
                            <Text className="font-ralewayBold text-sm text-textPrimary">
                              {item.client?.name || "Lease Contract"}
                            </Text>
                            <Text className="text-xs text-description">
                              Status: {item.status || "Active"} {item.room_number ? `• Room ${item.room_number}` : ""}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.description} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                {/* Clients / Tenants */}
                {results.clients.length > 0 ? (
                  <View className="gap-2">
                    <Text className="font-ralewayBold text-xs uppercase tracking-wider text-description">
                      Tenants & Clients ({results.clients.length})
                    </Text>
                    {results.clients.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        className="flex-row items-center justify-between rounded-2xl border border-primary/15 bg-white p-3.5"
                        onPress={() => navigateTo(appRoutes.primary.tenants)}
                      >
                        <View className="flex-row items-center gap-3">
                          <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <Ionicons name="person-outline" size={18} color={colors.primary} />
                          </View>
                          <View>
                            <Text className="font-ralewayBold text-sm text-textPrimary">
                              {item.name}
                            </Text>
                            <Text className="text-xs text-description">
                              {item.contact_email || item.phone || "Tenant"}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.description} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                {/* Expenses */}
                {results.expenses.length > 0 ? (
                  <View className="gap-2">
                    <Text className="font-ralewayBold text-xs uppercase tracking-wider text-description">
                      Expenses ({results.expenses.length})
                    </Text>
                    {results.expenses.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        className="flex-row items-center justify-between rounded-2xl border border-primary/15 bg-white p-3.5"
                        onPress={() => navigateTo(appRoutes.primary.expenses)}
                      >
                        <View className="flex-row items-center gap-3">
                          <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <Ionicons name="receipt-outline" size={18} color={colors.primary} />
                          </View>
                          <View>
                            <Text className="font-ralewayBold text-sm text-textPrimary">
                              {item.description || item.category || "Expense"}
                            </Text>
                            <Text className="text-xs text-primary font-ralewayBold">
                              ₱{Number(item.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.description} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                {/* Documents */}
                {results.documents.length > 0 ? (
                  <View className="gap-2">
                    <Text className="font-ralewayBold text-xs uppercase tracking-wider text-description">
                      Documents ({results.documents.length})
                    </Text>
                    {results.documents.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        className="flex-row items-center justify-between rounded-2xl border border-primary/15 bg-white p-3.5"
                        onPress={() => navigateTo(appRoutes.secondary.documents)}
                      >
                        <View className="flex-row items-center gap-3">
                          <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.primary} />
                          </View>
                          <View>
                            <Text className="font-ralewayBold text-sm text-textPrimary">
                              {item.name}
                            </Text>
                            <Text className="text-xs text-description">
                              {item.category || "Document"}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.description} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                {/* Bookings */}
                {results.bookings.length > 0 ? (
                  <View className="gap-2">
                    <Text className="font-ralewayBold text-xs uppercase tracking-wider text-description">
                      Bookings ({results.bookings.length})
                    </Text>
                    {results.bookings.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        className="flex-row items-center justify-between rounded-2xl border border-primary/15 bg-white p-3.5"
                        onPress={() => navigateTo(appRoutes.secondary.bookings)}
                      >
                        <View className="flex-row items-center gap-3">
                          <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                          </View>
                          <View>
                            <Text className="font-ralewayBold text-sm text-textPrimary">
                              {item.client?.name || "Transient Guest"}
                            </Text>
                            <Text className="text-xs text-description">
                              Status: {item.status || "Booked"} {item.room_number ? `• Room ${item.room_number}` : ""}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.description} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
