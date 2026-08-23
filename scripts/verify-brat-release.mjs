import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
const versions = JSON.parse(await readFile("versions.json", "utf8"));
const tag = process.env.GITHUB_REF_NAME ?? "";
if (!/^v\d+\.\d+\.\d+$/.test(tag)) throw new Error("release must be a strict vX.Y.Z tag");
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

const parse = (value) => value.split(".").map(Number);
const compare = (left, right) => {
  const a = parse(left);
  const b = parse(right);
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
};
const current = parse(manifest.version);
const history = execFileSync(
  "git",
  ["log", "--all", "--format=%H", "--", "manifest.json", "versions.json", "main.js", "styles.css"],
  { encoding: "utf8" },
).trim().split("\n").filter(Boolean);
const show = (commit, path, encoding = "utf8") => execFileSync("git", ["show", `${commit}:${path}`], { encoding });

let previousRelease;
for (const commit of history) {
  let candidateManifest;
  let candidateVersions;
  try {
    candidateManifest = JSON.parse(show(commit, "manifest.json"));
    candidateVersions = JSON.parse(show(commit, "versions.json"));
    show(commit, "main.js", "buffer");
    show(commit, "styles.css", "buffer");
  } catch {
    continue;
  }
  if (!semver.test(candidateManifest.version) || compare(candidateManifest.version, manifest.version) >= 0) continue;
  if (candidateVersions[candidateManifest.version] !== candidateManifest.minAppVersion) continue;
  previousRelease = { commit, manifest: candidateManifest };
  break;
}

if (!previousRelease) throw new Error("could not find a previous distribution version in Git history");
if (compare(manifest.version, previousRelease.manifest.version) <= 0) {
  throw new Error(`release ${manifest.version} must advance previous distribution ${previousRelease.manifest.version}`);
}
const previousMain = show(previousRelease.commit, "main.js", "buffer");
const previousStyles = show(previousRelease.commit, "styles.css", "buffer");
if (Buffer.compare(previousMain, await readFile("main.js")) === 0 && Buffer.compare(previousStyles, await readFile("styles.css")) === 0) {
  throw new Error("previous-to-next upgrade has no changed bundle asset");
}
console.log(
  "BRAT-compatible release",
  manifest.version,
  "previous distribution",
  previousRelease.manifest.version,
  "at",
  previousRelease.commit,
  "assets",
  Object.fromEntries(hashes),
);
