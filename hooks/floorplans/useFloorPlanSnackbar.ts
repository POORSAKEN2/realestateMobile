import { useEffect, useRef } from "react";

import { useSnackbar } from "../useSnackbar";

const IMAGE_UPLOAD_MESSAGE = "Uploading floor plan image…";
const IMAGE_UPLOAD_NOTICE_DURATION = 2000;

export function useFloorPlanSnackbar({
  clearNotice,
  isImageUploading,
  notice,
}: {
  clearNotice: () => void;
  isImageUploading: boolean;
  notice: string;
}) {
  const { dismiss, message, show } = useSnackbar();
  const clearNoticeRef = useRef(clearNotice);
  const uploadWasPending = useRef(false);

  clearNoticeRef.current = clearNotice;

  useEffect(() => {
    if (isImageUploading) {
      uploadWasPending.current = true;
      show(IMAGE_UPLOAD_MESSAGE, {
        autoHideDuration: IMAGE_UPLOAD_NOTICE_DURATION,
      });
      return;
    }

    if (notice) {
      show(notice);
      clearNoticeRef.current();
      uploadWasPending.current = false;
      return;
    }

    if (uploadWasPending.current) {
      dismiss();
      uploadWasPending.current = false;
    }
  }, [dismiss, isImageUploading, notice, show]);

  return {
    dismiss,
    icon:
      message === IMAGE_UPLOAD_MESSAGE
        ? ("cloud-upload-outline" as const)
        : ("check-circle-outline" as const),
    message,
  };
}
