import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const semver = /^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$/;
const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
const versions = JSON.parse(await readFile("versions.json", "utf8"));
const tag = process.env.GITHUB_REF_NAME ?? "";
if (!/^v\\d+\\.\\d+\\.\\d+$/.test(tag)) throw new Error("release must be a strict vX.Y.Z tag");
if (!semver.test(manifest.version)) throw new Error("manifest version must be strict semver");
if (tag.slice(1) !== manifest.version) throw new Error("tag and manifest version differ");
if (manifest.id !== "agentos" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.id) || manifest.id.includes("obsidian")) {
  throw new Error("invalid BRAT plugin id");
}
if (manifest.isDesktopOnly !== false) throw new Error("BRAT build must be mobile-compatible");
if (versions[manifest.version] !== manifest.minAppVersion) throw new Error("versions.json mismatch");

const assets = ["manifest.json", "main.js", "styles.css"];
const hashes = new Map();
for (const asset of assets) {
  const bytes = await readFile(asset);
  if (bytes.length === 0) throw new Error(asset + " is empty");
  hashes.set(asset, createHash("sha256").update(bytes).digest("hex"));
}
const main = await readFile("main.js", "utf8");
for (const forbidden of ["pluginRelease", "/v1/plugin/release", "atomicPluginRelease", "Hidden File Sync", "Customisation Sync"]) {
  if (main.includes(forbidden)) throw new Error("forbidden plugin self-update/distribution marker: " + forbidden);
}

const previousManifest = JSON.parse(execFileSync("git", ["show", "HEAD^:manifest.json"], { encoding: "utf8" }));
if (!semver.test(previousManifest.version)) throw new Error("previous manifest version is not semver");
const parse = (value) => value.split(".").map(Number);
const current = parse(manifest.version);
const previous = parse(previousManifest.version);
if (current[0] < previous[0] || (current[0] === previous[0] && (current[1] < previous[1] || (current[1] === previous[1] && current[2] <= previous[2])))) {
  throw new Error("release must advance the previous version");
}
const previousMain = execFileSync("git", ["show", "HEAD^:main.js"]);
const previousStyles = execFileSync("git", ["show", "HEAD^:styles.css"]);
if (Buffer.compare(previousMain, await readFile("main.js")) === 0 && Buffer.compare(previousStyles, await readFile("styles.css")) === 0) {
  throw new Error("previous-to-next upgrade has no changed bundle asset");
}
console.log("BRAT-compatible release", manifest.version, "assets", Object.fromEntries(hashes));
