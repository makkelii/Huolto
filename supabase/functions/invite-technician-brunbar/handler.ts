export type InvitationPorts = {
  origin: string;
  verify: (authorization: string) => Promise<boolean>;
  reserve: (
    authorization: string,
    organizationId: string,
    email: string,
  ) => Promise<string | null>;
  send: (email: string, redirect: string) => Promise<boolean>;
  cancel: (invitationId: string) => Promise<void>;
};
export function createInvitationHandler(ports: InvitationPorts) {
  return async (request: Request) => {
    const headers = {
      "Access-Control-Allow-Origin": ports.origin,
      "Access-Control-Allow-Headers":
        "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
      "Content-Type": "application/json",
    };
    const respond = (status: number, message: string) =>
      new Response(JSON.stringify({ message }), { status, headers });
    if (request.headers.get("origin") !== ports.origin)
      return respond(403, "Forbidden origin");
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return respond(405, "Method not allowed");
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer "))
      return respond(401, "Unauthorized");
    try {
      if (!(await ports.verify(authorization)))
        return respond(401, "Unauthorized");
      const payload = await request.json();
      if (
        typeof payload.email !== "string" ||
        payload.email.length > 254 ||
        typeof payload.organizationId !== "string"
      )
        return respond(400, "Invalid request");
      const email = payload.email.trim().toLowerCase();
      const id = await ports.reserve(
        authorization,
        payload.organizationId,
        email,
      );
      if (!id) return respond(403, "Invitation unavailable");
      let delivered = false;
      try {
        delivered = await ports.send(email, `${ports.origin}/?auth=invite`);
      } catch {
        /* delivery failure; revoke unused authorization below */
      }
      if (!delivered) {
        await ports.cancel(id);
        return respond(502, "Invitation could not be delivered");
      }
      return respond(200, "Invitation sent");
    } catch {
      return respond(400, "Invitation request failed");
    }
  };
}
