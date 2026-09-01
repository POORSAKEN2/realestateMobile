import { router, type Href } from "expo-router";

export type ModuleNavigationLevel = "primary" | "secondary";

export function getModuleNavigationLevel(href: Href): ModuleNavigationLevel {
  const pathname = typeof href === "string" ? href : href.pathname;

  return pathname.startsWith("/(tabs)/") ? "primary" : "secondary";
}

export function openModuleRoute(href: Href) {
  if (getModuleNavigationLevel(href) === "primary") {
    router.navigate(href);
    return;
  }

  router.push(href);
}
