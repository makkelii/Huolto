import { it, expect } from "vitest";
import { validatePublicConfig } from "../src/data/publicConfig";
it("rejects service-role credentials before bundling", () => {
  expect(() =>
    validatePublicConfig("https://project.supabase.co", "sb_secret_example"),
  ).toThrow();
  const service = [
    "header",
    btoa(JSON.stringify({ role: "service_role" })),
    "signature",
  ].join(".");
  expect(() =>
    validatePublicConfig("https://project.supabase.co", service),
  ).toThrow();
});
it("accepts public keys and separate unconfigured demo builds", () => {
  expect(() => validatePublicConfig(undefined, undefined)).not.toThrow();
  expect(() =>
    validatePublicConfig(
      "https://project.supabase.co",
      "sb_publishable_example",
    ),
  ).not.toThrow();
  const anon = [
    "header",
    btoa(JSON.stringify({ role: "anon" })),
    "signature",
  ].join(".");
  expect(() =>
    validatePublicConfig("https://project.supabase.co", anon),
  ).not.toThrow();
});
it("rejects partial configuration and insecure remote endpoints", () => {
  expect(() =>
    validatePublicConfig("https://project.supabase.co", undefined),
  ).toThrow();
  expect(() =>
    validatePublicConfig("http://remote.example.invalid", "public"),
  ).toThrow();
});
