import { pathToFileURL } from "node:url";
export function assertBrunbarDeployment(env) {
  if (env.GITHUB_REPOSITORY !== "makkelii/huoltopilotti-brunbar")
    throw Error(
      "Deployment is forbidden from this repository. Use the dedicated brunbar repository.",
    );
  if (
    env.GITHUB_REF !== "refs/heads/main" ||
    env.GITHUB_EVENT_NAME !== "workflow_dispatch"
  )
    throw Error("Only manual deployment from dedicated main is allowed.");
  if (
    env.BRUNBAR_DEPLOYMENT_APPROVED !== "true" ||
    env.CONFIRM_DOMAIN !== "brunbar.fi"
  )
    throw Error("Explicit brunbar.fi deployment approval is required.");
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY)
    throw Error("Public Supabase configuration is required.");
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  assertBrunbarDeployment(process.env);
  console.log(
    "Dedicated brunbar.fi deployment target verified. No hosting settings changed.",
  );
}
