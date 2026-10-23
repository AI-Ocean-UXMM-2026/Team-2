import { afterEach, expect, it, vi } from "vitest";
import { isSameOriginRequest } from "./same-origin";

afterEach(() => vi.unstubAllEnvs());

function request(origin?: string, extra: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/driver", {
    method: "POST",
    headers: { ...(origin === undefined ? {} : { origin }), ...extra },
  });
}

it("allows local same-origin requests", () => {
  vi.stubEnv("URL", "");
  expect(isSameOriginRequest(request("http://localhost:3000"))).toBe(true);
});

it("allows the public Netlify origin when the request URL is internal", () => {
  vi.stubEnv("URL", "https://resolvemate.netlify.app");
  expect(isSameOriginRequest(request("https://resolvemate.netlify.app"))).toBe(true);
});

it("rejects missing, opaque, foreign, lookalike and wrong-protocol origins", () => {
  vi.stubEnv("URL", "https://resolvemate.netlify.app");
  for (const origin of [
    undefined,
    "null",
    "https://evil.example",
    "https://resolvemate.netlify.app.evil.example",
    "http://resolvemate.netlify.app",
  ]) {
    expect(isSameOriginRequest(request(origin))).toBe(false);
  }
});

it("does not trust client-supplied forwarded hosts", () => {
  vi.stubEnv("URL", "https://resolvemate.netlify.app");
  expect(
    isSameOriginRequest(
      request("https://evil.example", {
        "x-forwarded-host": "evil.example",
        "x-forwarded-proto": "https",
      }),
    ),
  ).toBe(false);
});

it("fails closed for an invalid configured URL", () => {
  vi.stubEnv("URL", "invalid");
  expect(isSameOriginRequest(request("https://evil.example"))).toBe(false);
});
