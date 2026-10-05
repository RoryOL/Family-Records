import { describe, expect, it } from "vitest";
import { shouldOfferIosHomeScreen } from "./homeScreen";

describe("shouldOfferIosHomeScreen", () => {
  it("offers the home-screen steps on iPhone and iPad", () => {
    expect(shouldOfferIosHomeScreen("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", 5)).toBe(true);
    expect(shouldOfferIosHomeScreen("Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)", 5)).toBe(true);
    expect(shouldOfferIosHomeScreen("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);
  });

  it("stays quiet on a desktop browser", () => {
    expect(shouldOfferIosHomeScreen("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false);
    expect(shouldOfferIosHomeScreen("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 0)).toBe(false);
  });
});
