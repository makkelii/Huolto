import { it, expect, vi } from "vitest";
import { createInvitationHandler } from "../supabase/functions/invite-technician-brunbar/handler";
const fixture = () => ({
  origin: "https://brunbar.fi",
  verify: vi.fn(async () => true),
  reserve: vi.fn(async (): Promise<string | null> => "invitation-id"),
  send: vi.fn(async () => true),
  cancel: vi.fn(async () => {}),
});
const request = (
  body: unknown = {},
  authorization: string | null = "Bearer verified-test-token",
  origin = "https://brunbar.fi",
) =>
  new Request("https://edge.example.invalid/invite-technician", {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      ...(authorization ? { authorization } : {}),
    },
    body: JSON.stringify(body),
  });
it("rejects missing or invalid bearer tokens before reservation or delivery", async () => {
  const p = fixture();
  const handle = createInvitationHandler(p);
  expect((await handle(request({}, null))).status).toBe(401);
  p.verify.mockResolvedValue(false);
  expect((await handle(request())).status).toBe(401);
  expect(p.reserve).not.toHaveBeenCalled();
  expect(p.send).not.toHaveBeenCalled();
});
it("rejects foreign browser origins", async () => {
  const p = fixture();
  expect(
    (
      await createInvitationHandler(p)(
        request({}, "Bearer test", "https://evil.example.invalid"),
      )
    ).status,
  ).toBe(403);
  expect(p.verify).not.toHaveBeenCalled();
});
it("never sends an invitation if membership/slot reservation is denied", async () => {
  const p = fixture();
  p.reserve.mockResolvedValue(null);
  expect(
    (
      await createInvitationHandler(p)(
        request({
          organizationId: "foreign-org",
          email: "tech@example.invalid",
        }),
      )
    ).status,
  ).toBe(403);
  expect(p.send).not.toHaveBeenCalled();
});
it("uses server-selected redirect and ignores role/redirect supplied by caller", async () => {
  const p = fixture();
  expect(
    (
      await createInvitationHandler(p)(
        request({
          organizationId: "org",
          email: "TECH@example.invalid",
          role: "owner",
          redirect: "https://evil.example.invalid",
        }),
      )
    ).status,
  ).toBe(200);
  expect(p.send).toHaveBeenCalledWith(
    "tech@example.invalid",
    "https://brunbar.fi/?auth=invite",
  );
  expect(p.reserve).toHaveBeenCalledWith(
    "Bearer verified-test-token",
    "org",
    "tech@example.invalid",
  );
});
it("revokes unused invitation reservation when delivery fails", async () => {
  const p = fixture();
  p.send.mockResolvedValue(false);
  expect(
    (
      await createInvitationHandler(p)(
        request({ organizationId: "org", email: "tech@example.invalid" }),
      )
    ).status,
  ).toBe(502);
  expect(p.cancel).toHaveBeenCalledWith("invitation-id");
});

it("rejects the legacy production origin for the independent brunbar function", async () => {
  const p = fixture();
  const response = await createInvitationHandler(p)(
    request({}, "Bearer token", "https://585.fi"),
  );
  expect(response.status).toBe(403);
  expect(p.verify).not.toHaveBeenCalled();
  expect(p.send).not.toHaveBeenCalled();
});
