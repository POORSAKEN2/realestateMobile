export type OnboardingContent = {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
};

export const onboardingScreens: OnboardingContent[] = [
  {
    eyebrow: "Step 1 of 7",
    title: "Terrane: Your Real Estate Manager",
    description: "Search homes, units, and lots—all in one app.",
    accent: "bg-accent",
  },
  {
    eyebrow: "Step 2 of 7",
    title: "Keep Your Properties Organized",
    description:
      "Add properties, update details, and keep everything organized.",
    accent: "bg-accent",
  },
  {
    eyebrow: "Step 3 of 7",
    title: "Manage Tenants and Leases Easily",
    description: "Track tenants, lease dates, and upcoming tasks with ease.",
    accent: "bg-accent",
  },
  {
    eyebrow: "Step 4 of 7",
    title: "Stay on Top of Expenses",
    description:
      "Track expenses, monitor returns, and make smarter property decisions.",
    accent: "bg-accent",
  },
  {
    eyebrow: "Step 5 of 7",
    title: "Keep Everything in One Place",
    description:
      "Manage documents, bookings, support, and updates—all in one clean workspace.",
    accent: "bg-accent",
  },
  {
    eyebrow: "Step 6 of 7",
    title: "Set Your Dashboard Location",
    description:
      "See nearby properties, local activity, and area-specific insights on your dashboard.",
    accent: "bg-accent",
  },
  {
    eyebrow: "Step 7 of 7",
    title: "You’re All Set",
    description:
      "Manage properties, tenants, leases, and finances from one dashboard.",
    accent: "bg-accent",
  },
];
