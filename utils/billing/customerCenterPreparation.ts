export const CUSTOMER_CENTER_PREPARATION_TIMEOUT_MS = 15_000;

// Bound SDK preparation only. An open Customer Center must not time out while
// someone is reviewing a subscription or completing a store action.
export async function prepareCustomerCenterWithTimeout(
  prepare: () => Promise<void>,
  timeoutMs = CUSTOMER_CENTER_PREPARATION_TIMEOUT_MS,
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.resolve().then(prepare),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "Subscription management could not start. Check your connection and try again.",
              ),
            ),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
