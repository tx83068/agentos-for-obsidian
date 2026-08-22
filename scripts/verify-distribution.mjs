import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
const versions = JSON.parse(await readFile("versions.json", "utf8"));
if (manifest.id !== "agentos" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.id)) throw new Error("invalid plugin id");
if (manifest.id.includes("obsidian")) throw new Error("plugin id must not contain obsidian");
if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new Error("manifest version must be semver");
if (manifest.isDesktopOnly !== false) throw new Error("community build must be mobile-compatible");
if (versions[manifest.version] !== manifest.minAppVersion) throw new Error("versions.json mismatch");
for (const name of ["main.js", "manifest.json", "styles.css"]) {
  const bytes = await readFile(name);
  if ((await stat(name)).size === 0) throw new Error(`${name} is empty`);
  if (name === "main.js" && /(?:from|require\()\s*["'](?:node:|electron)/.test(bytes.toString("utf8"))) throw new Error("Node/Electron import in mobile bundle");
  console.log(`${name} sha256=${createHash("sha256").update(bytes).digest("hex")} size=${bytes.length}`);
}
console.log(`verified version=${manifest.version} id=${manifest.id}`);
