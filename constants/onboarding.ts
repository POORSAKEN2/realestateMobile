export type OnboardingContent = {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
};

export const onboardingScreens: OnboardingContent[] = [
  {
    eyebrow: 'Step 1 of 7',
    title: 'RE.M. is Your Mobile Real Estate Manager',
    description:
      'Browse homes, units, and lots from a mobile workspace built for real estate searches.',
    accent: 'bg-teal-400',
  },
  {
    eyebrow: 'Step 2 of 7',
    title: 'Keep Your Properties Organized',
    description:
      'Add your properties, update their details, and keep important information in one easy-to-access place.',
    accent: 'bg-sky-400',
  },
  {
    eyebrow: 'Step 3 of 7',
    title: 'Manage Tenants and Leases Easily',
    description:
      'You can track who’s renting, when leases start or end, and what needs your attention next.',
    accent: 'bg-amber-300',
  },
  {
    eyebrow: 'Step 4 of 7',
    title: 'Stay on Top of Expenses',
    description:
      'R.E.M. helps you understand your expenses, check returns, and make better decisions for your properties.',
    accent: 'bg-rose-300',
  },
  {
    eyebrow: 'Step 5 of 7',
    title: 'Keep Everything in One Place',
    description:
      'No more jumping between folders, notes, and spreadsheets. with R.E.M., you can manage documents, bookings, support requests, and updates in one clean workspace.',
    accent: 'bg-violet-300',
  },
  {
    eyebrow: 'Step 6 of 7',
    title: 'Set Your Dashboard Location',
    description:
      'This helps R.E.M. show the right area, property activity, and location-based details when you open your dashboard.',
    accent: 'bg-lime-300',
  },
  {
    eyebrow: 'Step 7 of 7',
    title: 'You’re All Set',
    description:
      'Start managing your properties, tenants, leases, expenses, and documents from one simple dashboard.',
    accent: 'bg-cyan-300',
  },
];
