import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
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

import { Screen } from "../../components/ui/Screen";
import { colors } from "../../constants/colors";
import {
  getImageName,
  getImageType,
  updateUserProfile,
  type ProfileImageUpload,
} from "../../api/user";
import { useAuth } from "../../hooks/useAuth";
import type { AuthUser } from "../../types";

type ProfileForm = {
  fullName: string;
  companyName: string;
  jobTitle: string;
  phoneNumber: string;
  imageUri: string;
};

const isAuthUser = (value: unknown): value is AuthUser =>
  typeof value === "object" && value !== null;

const formatRole = (role?: string) => {
  if (!role) return "Real Estate Professional";

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

function Field({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: TextInputProps["keyboardType"];
}) {
  return (
    <View className="gap-2">
      <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </Text>
      <View className="h-14 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm shadow-slate-900/5">
        <Ionicons name={icon} color="#64748B" size={19} />
        <TextInput
          className="ml-3 flex-1 text-base font-semibold text-slate-950"
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
        />
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { session, signIn, signOut } = useAuth();
  const user = useMemo(
    () => (isAuthUser(session?.user) ? session.user : null),
    [session?.user],
  );

  const [form, setForm] = useState<ProfileForm>(() => ({
    fullName: user?.name?.trim() || "Maria Santos",
    companyName: user?.company?.trim() || "Prime Nest Realty",
    jobTitle: formatRole(user?.job_title || user?.jobTitle || user?.role),
    phoneNumber: user?.phone?.trim() || "+63 917 456 2038",
    imageUri: getProfileImageUri(user),
  }));
  const [selectedImage, setSelectedImage] = useState<ProfileImageUpload | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const accessToken = session?.accessToken;

  const profileCompleteCount = [
    form.fullName,
    form.companyName,
    form.jobTitle,
    form.phoneNumber,
    form.imageUri,
  ].filter((value) => value.trim()).length;

  function updateField<Key extends keyof ProfileForm>(
    key: Key,
    value: ProfileForm[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function pickProfileImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Photo access needed",
        "Allow photo library access to upload your profile image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.9,
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
    if (!form.fullName.trim()) {
      Alert.alert("Full name required", "Enter your full name before saving.");
      return;
    }

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

      signIn({
        ...session,
        user: {
          ...(user ?? {}),
          ...updatedUser,
        } satisfies AuthUser,
      });

      setForm((current) => ({
        ...current,
        fullName: updatedUser.name?.trim() || current.fullName,
        companyName: updatedUser.company?.trim() || current.companyName,
        jobTitle:
          formatRole(updatedUser.job_title || updatedUser.jobTitle || updatedUser.role) ||
          current.jobTitle,
        phoneNumber: updatedUser.phone?.trim() || current.phoneNumber,
        imageUri: getProfileImageUri(updatedUser) || current.imageUri,
      }));
      setSelectedImage(null);
      Alert.alert("Profile updated", "Your profile has been saved.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Profile update failed. Please try again.";

      Alert.alert("Profile update failed", message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleSignOut() {
    signOut();
    router.replace("/(auth)/login");
  }

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
        >
          <View className="overflow-hidden rounded-[32px] bg-slate-950 shadow-2xl shadow-slate-900/50">
  {/* Premium Top Accent */}
            <View className="absolute inset-x-0 top-0 h-1.5 bg-[#2563EB]" />
            
            {/* Subtle Background Glow Effect */}
            <View className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#2563EB]/10 blur-3xl" />

            <View className="p-6">
              {/* --- HEADER ROW --- */}
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-[10px] font-bold uppercase tracking-[2px] text-blue-400/80">
                    Principal Profile
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleSignOut}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
                >
                  <Ionicons name="log-out-outline" color="#94A3B8" size={16} />
                  <Text className="text-[11px] font-bold text-slate-400">Sign Out</Text>
                </TouchableOpacity>
              </View>

              {/* --- AVATAR & INFO SECTION --- */}
              <View className="mt-8 flex-row items-center">
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={pickProfileImage}
                  className="relative"
                >
                  {/* Outer Glow Ring */}
                  <View className="h-24 w-24 items-center justify-center rounded-full border-2 border-blue-500/30 p-1">
                    <View className="h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-white/10 bg-slate-900">
                      {form.imageUri ? (
                        <Image
                          source={{ uri: form.imageUri }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Text className="font-soraSemiBold text-3xl text-white">
                          {getInitials(form.fullName)}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  {/* Camera Action Overlay */}
                  <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-slate-950 bg-blue-600 shadow-sm">
                    <Ionicons name="camera" color="white" size={14} />
                  </View>
                </TouchableOpacity>

                <View className="ml-5 flex-1 justify-center">
                  <Text 
                    className="font-soraSemiBold text-2xl tracking-tight text-white" 
                    numberOfLines={1}
                  >
                    {form.fullName}
                  </Text>
                  <Text className="text-sm font-medium text-blue-200/60">
                    {form.jobTitle || "Executive Manager"}
                  </Text>

                  {/* --- PROFILE COMPLETION TRACKER --- */}
                  <View className="mt-4">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Profile Strength
                      </Text>
                      <Text className="text-[10px] font-bold text-blue-400">
                        {profileCompleteCount}/5
                      </Text>
                    </View>
                    {/* Custom Progress Bar */}
                    <View className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <View 
                        className="h-full bg-blue-500" 
                        style={{ width: `${(profileCompleteCount / 5) * 100}%` }} 
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="mt-5 flex-row gap-3">
            <View className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
                <MaterialCommunityIcons
                  name="office-building-marker-outline"
                  color={colors.primary}
                  size={21}
                />
              </View>
              <Text className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Company
              </Text>
              <Text className="mt-1 text-base font-bold text-slate-950">
                {form.companyName || "Not set"}
              </Text>
            </View>

            <View className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
                <Ionicons name="call-outline" color="#059669" size={20} />
              </View>
              <Text className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Phone
              </Text>
              <Text className="mt-1 text-base font-bold text-slate-950">
                {form.phoneNumber || "Not set"}
              </Text>
            </View>
          </View>

          <View className="mt-5 gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-bold text-slate-950">
                  Professional Details
                </Text>
                <Text className="mt-1 text-sm text-slate-500">
                  Owner, broker, and company identity
                </Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                <Ionicons name="business-outline" color="#334155" size={20} />
              </View>
            </View>

            <Field
              icon="person-outline"
              label="Full name"
              placeholder="Enter full name"
              value={form.fullName}
              onChangeText={(value) => updateField("fullName", value)}
            />
            <Field
              icon="business-outline"
              label="Company name"
              placeholder="Enter company name"
              value={form.companyName}
              onChangeText={(value) => updateField("companyName", value)}
            />
            <Field
              icon="briefcase-outline"
              label="Job title"
              placeholder="Enter job title"
              value={form.jobTitle}
              onChangeText={(value) => updateField("jobTitle", value)}
            />
            <Field
              icon="call-outline"
              label="Phone number"
              keyboardType="phone-pad"
              placeholder="Enter phone number"
              value={form.phoneNumber}
              onChangeText={(value) => updateField("phoneNumber", value)}
            />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.84}
            className={`mt-5 h-14 flex-row items-center justify-center rounded-2xl ${
              isSaving ? "bg-blue-400" : "bg-blue-600"
            } shadow-md shadow-blue-900/20`}
            disabled={isSaving}
            onPress={handleSave}
          >
            <Ionicons
              name={isSaving ? "cloud-upload-outline" : "save-outline"}
              color="#FFFFFF"
              size={20}
            />
            <Text className="ml-2 text-base font-bold text-white">
              {isSaving ? "Saving Profile" : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
