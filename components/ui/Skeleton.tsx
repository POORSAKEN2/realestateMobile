import { Fragment, type ReactNode } from "react";
import { View } from "react-native";

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <View className={`rounded-lg bg-slate-200 ${className}`} />;
}

export function SkeletonGroup({
  accessibilityLabel,
  children,
  className = "",
}: {
  accessibilityLabel: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      className={className}
    >
      {children}
    </View>
  );
}

export function SkeletonList({
  count = 3,
  renderItem,
}: {
  count?: number;
  renderItem: (index: number) => ReactNode;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <Fragment key={index}>{renderItem(index)}</Fragment>
      ))}
    </>
  );
}

export function SkeletonMetricCard({ className = "" }: { className?: string }) {
  return (
    <View
      className={`min-h-[132px] rounded-[24px] border border-primary/20 bg-white p-4 shadow-sm shadow-primary/10 ${className}`}
    >
      <SkeletonBlock className="h-10 w-10 rounded-2xl" />
      <SkeletonBlock className="mt-4 h-5 w-3/4" />
      <SkeletonBlock className="mt-2 h-3 w-1/2" />
    </View>
  );
}

export function SkeletonListCard({
  className = "",
  leading = true,
}: {
  className?: string;
  leading?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 rounded-[22px] border border-primary/20 bg-white p-4 shadow-sm shadow-primary/10 ${className}`}
    >
      {leading ? <SkeletonBlock className="h-12 w-12 rounded-2xl" /> : null}
      <View className="min-w-0 flex-1 gap-2">
        <SkeletonBlock className="h-4 w-2/3" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-1/2" />
      </View>
      <SkeletonBlock className="h-6 w-14 rounded-full" />
    </View>
  );
}
