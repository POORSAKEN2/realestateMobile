import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

// Shared trailing clearance for scrollable content near modal footer actions.
export const MODAL_ACTION_FOOTER_CONTENT_HEIGHT = 40;

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
