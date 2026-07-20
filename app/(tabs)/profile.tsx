import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";

import {
  getImageName,
  getImageType,
  updateUserProfile,
  type ProfileImageUpload,
} from "../../api/user";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../hooks/useAuth";
import type { AuthUser } from "../../types";

type ProfileForm = {
  fullName: string;
  companyName: string;
  jobTitle: string;
  phoneNumber: string;
  imageUri: string;
};

type ProfileFieldProps = Pick<
  TextInputProps,
  | "autoCapitalize"
  | "autoComplete"
  | "keyboardType"
  | "maxLength"
  | "textContentType"
> & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  error?: string;
  required?: boolean;
};

const isAuthUser = (value: unknown): value is AuthUser =>
  typeof value === "object" && value !== null;

const formatRole = (role?: string) => {
  if (!role) return "";

  return role
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getInitials = (name: string) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "RE";
};

function getProfileImageUri(user?: AuthUser | null) {
  return (
    user?.profile_image_url ||
    user?.profile_image ||
    user?.profileImage ||
    user?.avatar ||
    ""
  );
}

function createProfileForm(user?: AuthUser | null): ProfileForm {
  return {
    fullName: user?.name?.trim() || "",
    companyName: user?.company?.trim() || "",
    jobTitle: formatRole(user?.job_title || user?.jobTitle || user?.role),
    phoneNumber: user?.phone?.trim() || "",
    imageUri: getProfileImageUri(user),
  };
}

function formsMatch(first: ProfileForm, second: ProfileForm) {
  return (Object.keys(first) as Array<keyof ProfileForm>).every(
    (key) => first[key] === second[key],
  );
}

function ProfileField({
  icon,
  label,
  value,
  placeholder,
  onChangeText,
  error,
  required,
  ...inputProps
}: ProfileFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderClassName = error
    ? "border-red-400 bg-red-50/40"
    : isFocused
      ? "border-blue-500 bg-white"
      : "border-slate-200 bg-slate-50";

  return (
    <View>
      <View className="mb-2 flex-row items-center">
        <Text className="font-soraMedium text-sm text-slate-700">{label}</Text>
        {required ? (
          <Text className="ml-1 text-red-500" accessibilityLabel="required">
            *
          </Text>
        ) : null}
      </View>

      <View
        className={`min-h-14 flex-row items-center rounded-2xl border px-4 ${borderClassName}`}
      >
        <Ionicons
          name={icon}
          color={error ? "#DC2626" : isFocused ? "#2563EB" : "#64748B"}
          size={20}
        />
        <TextInput
          accessibilityLabel={label}
          className="ml-3 min-h-14 flex-1 font-soraMedium text-base text-slate-950"
          value={value}
          onChangeText={onChangeText}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          {...inputProps}
        />
        {value ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label.toLowerCase()}`}
            hitSlop={8}
            onPress={() => onChangeText("")}
            className="h-8 w-8 items-center justify-center"
          >
            <Ionicons name="close-circle" color="#CBD5E1" size={19} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-2 text-xs text-red-600"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export default function ProfileScreen() {
  const { session, signIn, signOut } = useAuth();
  const user = useMemo(
    () => (isAuthUser(session?.user) ? session.user : null),
    [session?.user],
  );
  const initialForm = useMemo(() => createProfileForm(user), [user]);

  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [savedForm, setSavedForm] = useState<ProfileForm>(initialForm);
  const [selectedImage, setSelectedImage] = useState<ProfileImageUpload | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [didTrySave, setDidTrySave] = useState(false);
  const accessToken = session?.accessToken;
  const email = user?.email?.trim();

  const completionItems = [
    { label: "name", complete: Boolean(form.fullName.trim()) },
    { label: "company", complete: Boolean(form.companyName.trim()) },
    { label: "job title", complete: Boolean(form.jobTitle.trim()) },
    { label: "phone", complete: Boolean(form.phoneNumber.trim()) },
    { label: "photo", complete: Boolean(form.imageUri.trim()) },
  ];
  const profileCompleteCount = completionItems.filter(
    (item) => item.complete,
  ).length;
  const completionPercent = Math.round(
    (profileCompleteCount / completionItems.length) * 100,
  );
  const nextMissingItem = completionItems.find((item) => !item.complete)?.label;
  const hasChanges = selectedImage !== null || !formsMatch(form, savedForm);
  const fullNameError = didTrySave && !form.fullName.trim()
    ? "Enter your full name."
    : undefined;

  function updateField<Key extends keyof ProfileForm>(
    key: Key,
    value: ProfileForm[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/dashboard");
  }

  async function pickProfileImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Photo access needed",
        "Allow photo library access in Settings to choose a profile photo.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];

    setSelectedImage({
      uri: asset.uri,
      name: getImageName(asset),
      type: getImageType(asset),
      file: asset.file,
    });
    updateField("imageUri", asset.uri);
  }

  async function handleSave() {
    setDidTrySave(true);

    if (!form.fullName.trim()) return;

    if (!accessToken) {
      Alert.alert(
        "Session expired",
        "Please sign in again before updating your profile.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const updatedUser = await updateUserProfile(
        {
          name: form.fullName.trim(),
          company: form.companyName.trim(),
          role: form.jobTitle.trim(),
          phone: form.phoneNumber.trim(),
          profileImage: selectedImage,
        },
        accessToken,
      );
      const nextUser = {
        ...(user ?? {}),
        ...updatedUser,
      } satisfies AuthUser;
      const nextForm = createProfileForm(nextUser);

      signIn({ ...session, user: nextUser });
      setForm(nextForm);
      setSavedForm(nextForm);
      setSelectedImage(null);
      setDidTrySave(false);
      Alert.alert("Changes saved", "Your profile is up to date.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Profile update failed. Please try again.";

      Alert.alert("Couldn’t save changes", message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleSignOut() {
    Alert.alert(
      "Sign out?",
      "You’ll need to sign in again to manage your properties.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            signOut();
            router.replace("/(auth)/login");
          },
        },
      ],
    );
  }

  const saveDisabled = isSaving || !hasChanges;

  return (
    <Screen className="bg-slate-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="-mx-6"
          contentContainerClassName="px-6 pb-32"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go back"
              activeOpacity={0.7}
              onPress={handleBack}
              className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white"
            >
              <Ionicons name="chevron-back" color="#0F172A" size={22} />
            </TouchableOpacity>
            <View className="ml-4 flex-1">
              <Text className="font-soraBold text-2xl text-slate-950">
                Your profile
              </Text>
              <Text className="mt-0.5 text-sm text-slate-500">
                Keep your account details current
              </Text>
            </View>
          </View>

          <View className="mt-7 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
            <View className="items-center">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                accessibilityHint="Opens your photo library"
                activeOpacity={0.82}
                onPress={pickProfileImage}
                className="relative"
              >
                <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-blue-50">
                  {form.imageUri ? (
                    <Image
                      source={{ uri: form.imageUri }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="font-soraBold text-3xl text-blue-700">
                      {getInitials(form.fullName)}
                    </Text>
                  )}
                </View>
                <View className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-blue-600">
                  <Ionicons name="camera" color="#FFFFFF" size={16} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.7}
                onPress={pickProfileImage}
                className="mt-3 min-h-11 justify-center px-3"
              >
                <Text className="font-soraSemiBold text-sm text-blue-600">
                  {form.imageUri ? "Change photo" : "Add profile photo"}
                </Text>
              </TouchableOpacity>

              <Text
                className="mt-1 font-soraSemiBold text-xl text-slate-950"
                numberOfLines={1}
              >
                {form.fullName.trim() || "Your name"}
              </Text>
              <Text className="mt-1 text-sm text-slate-500" numberOfLines={1}>
                {email || form.jobTitle.trim() || "Real estate professional"}
              </Text>
            </View>

            <View className="mt-5 rounded-2xl bg-slate-50 p-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-soraSemiBold text-sm text-slate-700">
                  Profile completion
                </Text>
                <Text className="font-soraSemiBold text-sm text-blue-600">
                  {completionPercent}%
                </Text>
              </View>
              <View className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <View
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${completionPercent}%` }}
                />
              </View>
              <Text className="mt-3 text-xs leading-5 text-slate-500">
                {nextMissingItem
                  ? `Add your ${nextMissingItem} to help complete your profile.`
                  : "All key profile details are complete."}
              </Text>
            </View>
          </View>

          <View className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
            <Text className="font-soraSemiBold text-lg text-slate-950">
              Professional details
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-500">
              Information shown across your account and documents.
            </Text>

            <View className="mt-6 gap-5">
              <ProfileField
                icon="person-outline"
                label="Full name"
                placeholder="Enter your full name"
                value={form.fullName}
                onChangeText={(value) => updateField("fullName", value)}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                maxLength={80}
                required
                error={fullNameError}
              />
              <ProfileField
                icon="business-outline"
                label="Company"
                placeholder="Enter your company name"
                value={form.companyName}
                onChangeText={(value) => updateField("companyName", value)}
                autoCapitalize="words"
                autoComplete="organization"
                maxLength={100}
              />
              <ProfileField
                icon="briefcase-outline"
                label="Job title"
                placeholder="e.g. Property Manager"
                value={form.jobTitle}
                onChangeText={(value) => updateField("jobTitle", value)}
                autoCapitalize="words"
                maxLength={80}
              />
              <ProfileField
                icon="call-outline"
                label="Phone number"
                placeholder="Enter your phone number"
                value={form.phoneNumber}
                onChangeText={(value) => updateField("phoneNumber", value)}
                autoComplete="tel"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                maxLength={24}
              />
            </View>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Save profile changes"
            accessibilityState={{ disabled: saveDisabled, busy: isSaving }}
            activeOpacity={0.82}
            className={`mt-5 h-14 flex-row items-center justify-center rounded-2xl ${
              saveDisabled ? "bg-slate-300" : "bg-blue-600"
            }`}
            disabled={saveDisabled}
            onPress={handleSave}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons
                name={hasChanges ? "checkmark" : "checkmark-circle"}
                color="#FFFFFF"
                size={20}
              />
            )}
            <Text className="ml-2 font-soraSemiBold text-base text-white">
              {isSaving
                ? "Saving changes…"
                : hasChanges
                  ? "Save changes"
                  : "Profile up to date"}
            </Text>
          </TouchableOpacity>

          <View className="mt-8 border-t border-slate-200 pt-6">
            <Text className="font-soraSemiBold text-base text-slate-950">
              Account
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/settings")}
              className="mt-3 min-h-14 flex-row items-center rounded-2xl bg-white px-4"
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                <Ionicons name="shield-checkmark-outline" color="#475569" size={19} />
              </View>
              <Text className="ml-3 flex-1 font-soraMedium text-sm text-slate-800">
                Password and security
              </Text>
              <Ionicons name="chevron-forward" color="#94A3B8" size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              activeOpacity={0.7}
              onPress={handleSignOut}
              className="mt-3 min-h-14 flex-row items-center rounded-2xl bg-red-50 px-4"
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-white">
                <Ionicons name="log-out-outline" color="#DC2626" size={19} />
              </View>
              <Text className="ml-3 flex-1 font-soraSemiBold text-sm text-red-600">
                Sign out
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
