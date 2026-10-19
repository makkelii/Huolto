import { readFile, readdir, access } from "node:fs/promises";
import { resolve, join } from "node:path";
export async function verifyRootBuild(directory = "dist") {
  const html = await readFile(join(directory, "index.html"), "utf8");
  const paths = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((p) => p.includes("/assets/"));
  if (
    paths.length === 0 ||
    paths.some((p) => !p.startsWith("/assets/") || p.includes(".."))
  )
    throw Error("Build must use root-relative /assets/ paths.");
  for (const path of paths) await access(join(directory, path.slice(1)));
  for (const file of await readdir(join(directory, "assets"))) {
    if (!file.endsWith(".js")) continue;
    const source = await readFile(join(directory, "assets", file), "utf8");
    if (source.includes("585.fi") || source.includes("/huolto/"))
      throw Error("Legacy application deployment URL found in browser bundle.");
  }
  return { directory: resolve(directory), assetReferences: paths.length };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)
) {
  console.log(await verifyRootBuild(process.argv[2] || "dist"));
}
