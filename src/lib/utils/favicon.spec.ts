import { describe, expect, test } from "vitest";
import fc from "fast-check";
import { buildFaviconUrl } from "./favicon";

describe(buildFaviconUrl.name, () => {
  test("returns undefined for about:blank", () => {
    expect(buildFaviconUrl("about:blank")).toBeUndefined();
  });

  test("returns undefined for empty string", () => {
    expect(buildFaviconUrl("")).toBeUndefined();
  });

  test("returns undefined for invalid URLs", () => {
    expect(buildFaviconUrl("not-a-url")).toBeUndefined();
    expect(buildFaviconUrl("http://")).toBeUndefined();
    expect(buildFaviconUrl("://invalid")).toBeUndefined();
  });

  test("returns Google favicon URL for valid HTTP URL", () => {
    const result = buildFaviconUrl("http://example.com");
    expect(result).toBe(
      "https://www.google.com/s2/favicons?domain=example.com&sz=32"
    );
  });

  test("returns Google favicon URL for valid HTTPS URL", () => {
    const result = buildFaviconUrl("https://www.google.com/search");
    expect(result).toBe(
      "https://www.google.com/s2/favicons?domain=www.google.com&sz=32"
    );
  });

  test("extracts hostname correctly from URLs with ports", () => {
    const result = buildFaviconUrl("https://localhost:3000/path");
    expect(result).toBe(
      "https://www.google.com/s2/favicons?domain=localhost&sz=32"
    );
  });

  test("handles URLs with subdomains", () => {
    const result = buildFaviconUrl("https://api.github.com/v1/users");
    expect(result).toBe(
      "https://www.google.com/s2/favicons?domain=api.github.com&sz=32"
    );
  });

  test("property: always returns undefined or a string starting with https://www.google.com/s2/favicons", () => {
    fc.assert(
      fc.property(fc.string(), (url) => {
        const result = buildFaviconUrl(url);
        return (
          result === undefined ||
          result.startsWith("https://www.google.com/s2/favicons")
        );
      })
    );
  });

  test("property: idempotent - same input always produces same output", () => {
    fc.assert(
      fc.property(fc.webUrl(), (url) => {
        const result1 = buildFaviconUrl(url);
        const result2 = buildFaviconUrl(url);
        return result1 === result2;
      })
    );
  });
});
