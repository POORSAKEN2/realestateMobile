export type OnboardingContent = {
  eyebrow: string;
  title: string;
  description: string;
};

export const onboardingScreens: OnboardingContent[] = [
  {
    eyebrow: "Step 1 of 7",
    title: "Your Personal\nReal Estate Manager",
    description: "Search homes, units, and lots—all in one app.",
  },
  {
    eyebrow: "Step 2 of 7",
    title: "Organize Properties",
    description:
      "Add properties, update details, and keep everything organized.",
  },
  {
    eyebrow: "Step 3 of 7",
    title: "Manage Tenants",
    description: "Track tenants, lease dates, and upcoming tasks with ease.",
  },
  {
    eyebrow: "Step 4 of 7",
    title: "Track Finances",
    description:
      "Track expenses, monitor returns, and make smarter property decisions.",
  },
  {
    eyebrow: "Step 5 of 7",
    title: "Work Smarter",
    description:
      "Manage documents, bookings, support, and updates—all in one clean workspace.",
  },
  {
    eyebrow: "Step 6 of 7",
    title: "Personalize Your Dashboard",
    description:
      "See nearby properties, local activity, and area-specific insights on your dashboard.",
  },
  {
    eyebrow: "Step 7 of 7",
    title: "You're All Set!",
    description:
      "Manage properties, tenants, leases, and finances from one dashboard.",
  },
];
