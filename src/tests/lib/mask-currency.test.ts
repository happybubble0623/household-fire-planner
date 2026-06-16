import { describe, expect, it } from "vitest";
import { MASKED_CURRENCY, maskCurrency } from "@/lib/phase1/mask-currency";

describe("maskCurrency", () => {
  it("returns the formatted string untouched when not hidden", () => {
    expect(maskCurrency("$1,234", false)).toBe("$1,234");
    expect(maskCurrency("-$500", false)).toBe("-$500");
    expect(maskCurrency("", false)).toBe("");
  });

  it("replaces the formatted string with the dot mask when hidden", () => {
    expect(maskCurrency("$1,234", true)).toBe(MASKED_CURRENCY);
    expect(maskCurrency("-$500", true)).toBe(MASKED_CURRENCY);
    expect(maskCurrency("$0", true)).toBe(MASKED_CURRENCY);
  });

  it("uses a non-empty dot mask so the layout stays in place", () => {
    expect(MASKED_CURRENCY.length).toBeGreaterThan(0);
  });
});
