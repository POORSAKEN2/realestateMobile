export type OnboardingContent = {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
};

export const onboardingScreens: OnboardingContent[] = [
  {
    eyebrow: 'Step 1 of 7',
    title: 'Find properties faster',
    description:
      'Browse homes, units, and lots from a mobile workspace built for real estate searches.',
    accent: 'bg-teal-400',
  },
  {
    eyebrow: 'Step 2 of 7',
    title: 'Compare listings clearly',
    description:
      'Keep price, location, size, and status easy to scan while you narrow down options.',
    accent: 'bg-sky-400',
  },
  {
    eyebrow: 'Step 3 of 7',
    title: 'Track buyer interest',
    description:
      'Stay close to inquiries and follow-ups so promising leads do not slip out of view.',
    accent: 'bg-amber-300',
  },
  {
    eyebrow: 'Step 4 of 7',
    title: 'Save the right details',
    description:
      'Organize listing notes, contact context, and property highlights in one place.',
    accent: 'bg-rose-300',
  },
  {
    eyebrow: 'Step 5 of 7',
    title: 'Plan showings with less friction',
    description:
      'Prepare for visits with a cleaner view of property context before each appointment.',
    accent: 'bg-violet-300',
  },
  {
    eyebrow: 'Step 6 of 7',
    title: 'Work from anywhere',
    description:
      'Use a focused mobile flow for field work, client conversations, and quick checks.',
    accent: 'bg-lime-300',
  },
  {
    eyebrow: 'Step 7 of 7',
    title: 'Start your real estate workspace',
    description:
      'Your app foundation is ready. Continue to sign in and connect the next product pieces.',
    accent: 'bg-cyan-300',
  },
];
