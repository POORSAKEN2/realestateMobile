import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export function ModalActionFooter({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView
      className="border-t border-textPrimary/10 bg-white px-5 pb-4 pt-4"
      edges={["bottom"]}
    >
      {children}
    </SafeAreaView>
  );
}
