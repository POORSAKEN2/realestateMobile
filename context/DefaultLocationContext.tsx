import * as SecureStore from "expo-secure-store";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_LOCATION_OPTIONS,
  getDefaultLocationByCountry,
  type DefaultDashboardLocation,
} from "../constants/defaultLocation";
import { useAuth } from "../hooks/useAuth";

type DefaultLocationContextValue = {
  defaultLocation: DefaultDashboardLocation | null;
  hasDefaultLocation: boolean;
  isLoadingDefaultLocation: boolean;
  setDefaultLocation: (location: DefaultDashboardLocation) => Promise<void>;
  clearDefaultLocation: () => Promise<void>;
};

export const DefaultLocationContext = createContext<
  DefaultLocationContextValue | undefined
>(undefined);

const DEFAULT_LOCATION_STORAGE_PREFIX = "realestate.default-location";

function getSessionKey(user: unknown) {
  if (user && typeof user === "object") {
    const candidate = user as {
      id?: string | number;
      email?: string;
    };

    if (candidate.id !== undefined && candidate.id !== null) {
      return String(candidate.id);
    }

    if (candidate.email) return candidate.email.toLowerCase();
  }

  return "anonymous";
}

function getStorageKey(user: unknown) {
  return `${DEFAULT_LOCATION_STORAGE_PREFIX}.${getSessionKey(user)}`;
}

async function getStoredLocation(key: string) {
  const raw = await getStoredItem(key);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<DefaultDashboardLocation>;
    const country = parsed.country ?? parsed.label;

    return getDefaultLocationByCountry(country) ?? null;
  } catch {
    return null;
  }
}

async function getStoredItem(key: string) {
  if (await SecureStore.isAvailableAsync()) {
    return SecureStore.getItemAsync(key);
  }

  if (typeof localStorage !== "undefined") {
    return localStorage.getItem(key);
  }

  return null;
}

async function setStoredItem(key: string, value: string) {
  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
  }
}

async function deleteStoredItem(key: string) {
  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(key);
  }
}

export function DefaultLocationProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, session } = useAuth();
  const [defaultLocation, setDefaultLocationState] =
    useState<DefaultDashboardLocation | null>(null);
  const [isLoadingDefaultLocation, setIsLoadingDefaultLocation] =
    useState(true);

  const storageKey = useMemo(
    () => getStorageKey(session?.user),
    [session?.user],
  );

  useEffect(() => {
    let isMounted = true;

    async function restoreDefaultLocation() {
      setIsLoadingDefaultLocation(true);

      if (!isAuthenticated) {
        if (isMounted) {
          setDefaultLocationState(null);
          setIsLoadingDefaultLocation(false);
        }
        return;
      }

      try {
        const storedLocation = await getStoredLocation(storageKey);

        if (isMounted) {
          setDefaultLocationState(storedLocation);
        }
      } finally {
        if (isMounted) {
          setIsLoadingDefaultLocation(false);
        }
      }
    }

    restoreDefaultLocation();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, storageKey]);

  const setDefaultLocation = useCallback(
    async (location: DefaultDashboardLocation) => {
      const normalizedLocation =
        DEFAULT_LOCATION_OPTIONS.find((option) => option.id === location.id) ??
        location;

      setDefaultLocationState(normalizedLocation);
      await setStoredItem(storageKey, JSON.stringify(normalizedLocation));
    },
    [storageKey],
  );

  const clearDefaultLocation = useCallback(async () => {
    setDefaultLocationState(null);
    await deleteStoredItem(storageKey);
  }, [storageKey]);

  const value = useMemo(
    () => ({
      defaultLocation,
      hasDefaultLocation: Boolean(defaultLocation),
      isLoadingDefaultLocation,
      setDefaultLocation,
      clearDefaultLocation,
    }),
    [
      clearDefaultLocation,
      defaultLocation,
      isLoadingDefaultLocation,
      setDefaultLocation,
    ],
  );

  return (
    <DefaultLocationContext.Provider value={value}>
      {children}
    </DefaultLocationContext.Provider>
  );
}
