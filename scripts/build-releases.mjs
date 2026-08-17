// Collects every release from the ported mod repositories into public/releases.json,
// which the app reads at runtime. Run manually (npm run releases) or from the deploy workflow.
//
// Uses GraphQL rather than REST /repos/{o}/{r}/releases: that REST endpoint has been observed
// returning an empty array for repositories whose releases exist and are visible to both
// GraphQL and REST /releases/latest. GraphQL is also what `gh release list` uses, and it fetches
// every repository in a single request. It requires a token — GITHUB_TOKEN in CI, or
// `gh auth token` locally.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ORG = "vibeported-mc";

// Descriptions and attribution live here rather than in the app, so the generated JSON is
// the single source of truth for everything rendered.
const MODS = [
  {
    repo: "ImmersiveAircraft",
    name: "Immersive Aircraft",
    author: "Luke100000",
    upstream: "https://github.com/Luke100000/ImmersiveAircraft",
    description:
      "Simple aircraft — biplanes, airships, gyrodynes and more — for getting around without elytra.",
  },
  {
    repo: "owo-lib",
    name: "owo-lib",
    author: "wisp-forest",
    upstream: "https://github.com/wisp-forest/owo-lib",
    description:
      "Library mod providing UI, config and networking utilities. Required by Alloy Forgery.",
    library: true,
  },
  {
    repo: "emi",
    name: "EMI",
    author: "emilyploszaj",
    upstream: "https://github.com/emilyploszaj/emi",
    description:
      "Item and recipe viewer — searchable index, recipe trees and crafting hints.",
  },
  {
    repo: "alloy-forgery",
    name: "Alloy Forgery",
    author: "wisp-forest",
    upstream: "https://github.com/wisp-forest/alloy-forgery",
    description:
      "Multiblock forges for alloying metals, with datapack-driven recipes and EMI integration.",
  },
];

// <mod version>-<minecraft version>-<loader>[-build.<n>] — the scheme every release tag uses.
const TAG_RE = /^(\d+\.\d+\.\d+)-(\d+\.\d+(?:\.\d+)?)-([a-z]+)(?:-build\.(\d+))?$/;

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error(
    "GITHUB_TOKEN is required (GraphQL has no anonymous access).\n" +
      "Locally:  $env:GITHUB_TOKEN = (gh auth token)",
  );
  process.exit(1);
}

// One aliased query per repository, so the whole catalogue costs a single request.
const query = `query {
${MODS.map(
  (m, i) => `  r${i}: repository(owner: "${ORG}", name: "${m.repo}") {
    releases(first: 100, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes {
        tagName
        name
        isDraft
        isPrerelease
        publishedAt
        url
        releaseAssets(first: 50) { nodes { name downloadUrl size } }
      }
    }
  }`,
).join("\n")}
}`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query }),
});

if (!res.ok) {
  throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
}

const payload = await res.json();
if (payload.errors?.length) {
  throw new Error(`GraphQL errors: ${payload.errors.map((e) => e.message).join("; ")}`);
}

function classify(assets) {
  const jars = assets.filter((a) => a.name.endsWith(".jar"));
  return {
    // The installable jar is the one that is neither sources nor the api-only artifact.
    primary:
      jars.find((a) => !a.name.includes("-sources") && !a.name.endsWith("-api.jar")) ?? null,
    extras: jars.filter((a) => a.name.includes("-sources") || a.name.endsWith("-api.jar")),
  };
}

const releases = [];
const problems = [];

MODS.forEach((mod, i) => {
  const nodes = payload.data?.[`r${i}`]?.releases?.nodes ?? [];
  if (nodes.length === 0) {
    problems.push(`${mod.repo}: no releases returned`);
  }

  for (const rel of nodes) {
    if (rel.isDraft) continue;

    const match = TAG_RE.exec(rel.tagName);
    if (!match) {
      // Keep going, but surface it: a tag outside the scheme cannot be classified by
      // loader or Minecraft version, so the filters would not see it.
      problems.push(`${mod.repo}: tag "${rel.tagName}" does not match the release scheme`);
      continue;
    }
    const [, modVersion, mcVersion, loader, build] = match;
    const { primary, extras } = classify(rel.releaseAssets?.nodes ?? []);

    releases.push({
      repo: mod.repo,
      mod: mod.name,
      author: mod.author,
      upstream: mod.upstream,
      description: mod.description,
      library: Boolean(mod.library),
      tag: rel.tagName,
      title: rel.name || rel.tagName,
      modVersion,
      mcVersion,
      loader,
      build: build === undefined ? null : Number(build),
      prerelease: rel.isPrerelease,
      publishedAt: rel.publishedAt,
      releaseUrl: rel.url,
      download: primary
        ? { name: primary.name, url: primary.downloadUrl, size: primary.size }
        : null,
      extras: extras.map((a) => ({ name: a.name, url: a.downloadUrl, size: a.size })),
    });
  }
});

releases.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

const out = {
  generatedAt: new Date().toISOString(),
  org: ORG,
  mods: MODS.map(({ repo, name, author, upstream, description, library }) => ({
    repo,
    name,
    author,
    upstream,
    description,
    library: Boolean(library),
  })),
  releases,
};

const target = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "releases.json");
await mkdir(dirname(target), { recursive: true });
await writeFile(target, JSON.stringify(out, null, 2) + "\n", "utf8");

console.log(`wrote ${releases.length} releases across ${MODS.length} mods -> public/releases.json`);
for (const p of problems) console.warn(`warning: ${p}`);

// A mod with no releases at all is usually a broken token or a renamed repository rather
// than an intentional state, so make it visible in CI instead of shipping a thin page.
if (releases.length < MODS.length) {
  console.error(
    `\nexpected at least one release per mod (${MODS.length}), got ${releases.length}. Failing so a bad fetch is not deployed.`,
  );
  process.exit(1);
}
