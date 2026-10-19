import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertBrunbarDeployment } from "./verify-brunbar-deploy.mjs";
import { verifyRootBuild } from "./verify-root-build.mjs";
const approved = {
  GITHUB_REPOSITORY: "makkelii/huoltopilotti-brunbar",
  GITHUB_REF: "refs/heads/main",
  GITHUB_EVENT_NAME: "workflow_dispatch",
  BRUNBAR_DEPLOYMENT_APPROVED: "true",
  CONFIRM_DOMAIN: "brunbar.fi",
  VITE_SUPABASE_URL: "https://test.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};
test("dedicated manual target is accepted", () =>
  assert.doesNotThrow(() => assertBrunbarDeployment(approved)));
for (const [key, value] of [
  ["GITHUB_REPOSITORY", "makkelii/Huolto"],
  ["GITHUB_REPOSITORY", "makkelii/makkelii.github.io"],
  ["GITHUB_REF", "refs/heads/feature"],
  ["GITHUB_EVENT_NAME", "push"],
  ["BRUNBAR_DEPLOYMENT_APPROVED", "false"],
  ["CONFIRM_DOMAIN", "585.fi"],
  ["VITE_SUPABASE_URL", ""],
  ["VITE_SUPABASE_PUBLISHABLE_KEY", ""],
])
  test(`rejects unsafe deployment: ${key}=${value}`, () =>
    assert.throws(() =>
      assertBrunbarDeployment({ ...approved, [key]: value }),
    ));
test("source workflow has no Pages deployment or write capability", async () => {
  const source = await readFile(".github/workflows/deploy.yml", "utf8");
  assert.doesNotMatch(
    source,
    /actions\/deploy-pages|pages:\s*write|id-token:\s*write/,
  );
  const workflow = await readFile(
    ".github/workflows/deploy-brunbar.yml",
    "utf8",
  );
  assert.equal(
    (
      workflow.match(
        /github.repository == 'makkelii\/huoltopilotti-brunbar'/g,
      ) || []
    ).length,
    2,
  );
  assert.match(workflow, /data.cname !== 'brunbar.fi'/);
});
test("CNAME is staged outside public static output", async () => {
  assert.equal(
    (await readFile("deploy/brunbar/CNAME", "utf8")).trim(),
    "brunbar.fi",
  );
  await assert.rejects(readFile("public/CNAME"));
  await assert.rejects(readFile("CNAME"));
});
test("build validator accepts root assets and rejects legacy path or host", async () => {
  const dir = await mkdtemp(join(tmpdir(), "huolto-root-test-"));
  try {
    await mkdir(join(dir, "assets"));
    await writeFile(join(dir, "assets", "app.js"), 'console.log("root")');
    await writeFile(
      join(dir, "index.html"),
      '<script src="/assets/app.js"></script>',
    );
    assert.equal((await verifyRootBuild(dir)).assetReferences, 1);
    await writeFile(
      join(dir, "index.html"),
      '<script src="/huolto/assets/app.js"></script>',
    );
    await assert.rejects(verifyRootBuild(dir));
    await writeFile(
      join(dir, "index.html"),
      '<script src="/assets/app.js"></script>',
    );
    await writeFile(
      join(dir, "assets", "app.js"),
      'const target="https://585.fi/huolto/"',
    );
    await assert.rejects(verifyRootBuild(dir));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
