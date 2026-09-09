import {
  appleMapsTokenGateway,
  type AppleMapsTokenGateway,
  type AppleMapsTokenResponse,
} from "../../api/mapkit";
import { isAppleMapsUnavailableError } from "../../utils/maps/appleMapsAvailability";

const DEFAULT_MINIMUM_VALIDITY_SECONDS = 5 * 60;

type CachedToken = {
  response: AppleMapsTokenResponse;
  sessionScope: string;
};

type InFlightRequest = {
  promise: Promise<string>;
  sessionScope: string;
};

export type AppleMapsTokenRequestOptions = {
  forceRefresh?: boolean;
  minimumValiditySeconds?: number;
};

export class AppleMapsTokenManager {
  private cache: CachedToken | null = null;
  private generation = 0;
  private inFlightRequest: InFlightRequest | null = null;
  private sessionScope: string | null = null;
  private unavailableError: Error | null = null;

  constructor(
    private readonly gateway: AppleMapsTokenGateway,
    private readonly now: () => number = Date.now,
  ) {}

  async getToken(
    accessToken: string,
    options: AppleMapsTokenRequestOptions = {},
  ): Promise<string> {
    const sessionScope = accessToken.trim();
    if (!sessionScope) {
      throw new Error("An authenticated session is required for Apple Maps.");
    }

    this.selectSession(sessionScope);

    if (this.unavailableError && !options.forceRefresh) {
      throw this.unavailableError;
    }

    const minimumValiditySeconds =
      options.minimumValiditySeconds ?? DEFAULT_MINIMUM_VALIDITY_SECONDS;

    if (
      !options.forceRefresh &&
      this.cache &&
      this.isValidFor(this.cache.response, minimumValiditySeconds)
    ) {
      return this.cache.response.token;
    }

    if (this.inFlightRequest?.sessionScope === sessionScope) {
      return this.inFlightRequest.promise;
    }

    const requestGeneration = this.generation;
    const promise = this.gateway
      .fetchToken(sessionScope)
      .then((response) => {
        if (!this.isValidFor(response, 0)) {
          throw new Error(
            "Apple Maps token endpoint returned an expired token.",
          );
        }

        if (
          this.generation === requestGeneration &&
          this.sessionScope === sessionScope
        ) {
          this.cache = { response, sessionScope };
        }

        return response.token;
      })
      .catch((error: unknown) => {
        if (
          isAppleMapsUnavailableError(error) &&
          this.generation === requestGeneration &&
          this.sessionScope === sessionScope
        ) {
          this.unavailableError =
            error instanceof Error
              ? error
              : new Error("Apple Maps is temporarily unavailable.");
        }

        throw error;
      })
      .finally(() => {
        if (this.inFlightRequest?.promise === promise) {
          this.inFlightRequest = null;
        }
      });

    this.inFlightRequest = { promise, sessionScope };
    return promise;
  }

  getRefreshDelayMs(
    accessToken: string,
    refreshBufferSeconds = DEFAULT_MINIMUM_VALIDITY_SECONDS,
  ): number | null {
    const sessionScope = accessToken.trim();
    if (!this.cache || this.cache.sessionScope !== sessionScope) return null;

    const refreshAtMs =
      (this.cache.response.expires_at - refreshBufferSeconds) * 1000;
    return Math.max(0, refreshAtMs - this.now());
  }

  clear(): void {
    this.generation += 1;
    this.cache = null;
    this.inFlightRequest = null;
    this.sessionScope = null;
    this.unavailableError = null;
  }

  private isValidFor(
    response: AppleMapsTokenResponse,
    minimumValiditySeconds: number,
  ): boolean {
    const nowInSeconds = Math.floor(this.now() / 1000);
    return nowInSeconds < response.expires_at - minimumValiditySeconds;
  }

  private selectSession(sessionScope: string): void {
    if (this.sessionScope === sessionScope) return;

    this.clear();
    this.sessionScope = sessionScope;
  }
}

export const appleMapsTokenManager = new AppleMapsTokenManager(
  appleMapsTokenGateway,
);
