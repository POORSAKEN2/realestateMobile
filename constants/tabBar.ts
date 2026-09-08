export const tabBarLayout = {
  contentHeight: 64,
  addButtonSize: 64,
  addButtonOffset: 16,
  contentGap: 12,
} as const;

/** Clear the bar and its raised center button, including the home indicator. */
export function getTabBarContentInset(bottomSafeArea: number) {
  const buttonOverhang = Math.max(
    0,
    tabBarLayout.addButtonSize / 2 - tabBarLayout.addButtonOffset,
  );

  return (
    tabBarLayout.contentHeight +
    Math.max(0, bottomSafeArea) +
    buttonOverhang +
    tabBarLayout.contentGap
  );
}
