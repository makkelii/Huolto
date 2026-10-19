// Reject privileged credentials before they can enter a browser bundle.
export function validatePublicConfig(
  url: string | undefined,
  key: string | undefined,
) {
  if (!url && !key) return;
  if (!url || !key)
    throw Error(
      "Both public Supabase URL and publishable/anon key are required.",
    );
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(parsed.hostname)
  )
    throw Error("Supabase URL must use HTTPS.");
  if (key.startsWith("sb_secret_"))
    throw Error("Secret keys are forbidden in frontend configuration.");
  if (key.split(".").length === 3) {
    let role;
    try {
      role = JSON.parse(
        atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      ).role;
    } catch {
      throw Error("Invalid public anon key.");
    }
    if (role !== "anon")
      throw Error("Only an anon JWT may be embedded in the frontend.");
  }
}
