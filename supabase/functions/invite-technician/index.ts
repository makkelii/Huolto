import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { createInvitationHandler } from "./handler.ts";
const url = Deno.env.get("SUPABASE_URL")!,
  key = Deno.env.get("SUPABASE_ANON_KEY")!,
  secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const userClient = (authorization: string) =>
  createClient(url, key, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
// Service credentials remain in Edge memory and are never returned to callers.
const admin = () =>
  createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
Deno.serve(
  createInvitationHandler({
    origin: Deno.env.get("APP_ORIGIN") || "https://585.fi",
    verify: async (authorization) => {
      const {
        data: { user },
        error,
      } = await userClient(authorization).auth.getUser();
      return !error && Boolean(user);
    },
    reserve: async (authorization, organizationId, email) => {
      const { data, error } = await userClient(authorization).rpc(
        "reserve_private_invitation",
        { p_org: organizationId, p_email: email },
      );
      return error ? null : data;
    },
    send: async (email, redirectTo) => {
      const { error } = await admin().auth.admin.inviteUserByEmail(email, {
        redirectTo,
      });
      return !error;
    },
    cancel: async (id) => {
      const { error } = await admin()
        .from("private_invitations")
        .delete()
        .eq("id", id)
        .is("accepted_at", null);
      if (error) throw error;
    },
  }),
);
