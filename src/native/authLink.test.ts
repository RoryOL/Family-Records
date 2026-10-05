import { describe, expect, it } from "vitest";
import { authCallbackParams, NATIVE_AUTH_REDIRECT } from "./authLink";

describe("auth callback links", () => {
  it("reads a confirmation code from the app link", () => {
    expect(authCallbackParams(`${NATIVE_AUTH_REDIRECT}?code=abc-123`)).toEqual({
      code: "abc-123",
      accessToken: null,
      refreshToken: null,
    });
  });

  it("reads session tokens from the link hash", () => {
    expect(authCallbackParams(`${NATIVE_AUTH_REDIRECT}#access_token=access&refresh_token=refresh`)).toEqual({
      code: null,
      accessToken: "access",
      refreshToken: "refresh",
    });
  });
});
