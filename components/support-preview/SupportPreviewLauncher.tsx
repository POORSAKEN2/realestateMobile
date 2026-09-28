import { useState } from "react";
import { Modal } from "react-native";
import supportPreview from "@raze-support-preview";
import { Button } from "../ui/buttons/Button";

export function SupportPreviewLauncher() {
  const [visible, setVisible] = useState(false);
  if (!supportPreview.enabled) return null;
  return (
    <>
      <Button
        title="RAZE Support preview"
        variant="secondary"
        onPress={() => setVisible(true)}
      />
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        {visible ? (
          <supportPreview.Screen onClose={() => setVisible(false)} />
        ) : null}
      </Modal>
    </>
  );
}
