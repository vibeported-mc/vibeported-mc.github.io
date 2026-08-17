import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

export function formatSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Newest first, comparing each component numerically so 26.2.10 sorts above 26.2.2
// (a plain string compare would put "26.2.10" below "26.2.2").
export function compareVersionsDesc(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pb[i] ?? 0) - (pa[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// Filler releases for exercising pagination and the filter panels during development.
// Only reachable from a dev server with ?fake=<n> in the URL, so a production build can
// never show them even if the parameter is passed.
function makeFakeReleases(count) {
  const mods = [
    ["Placeholder Dynamo", "someone-else"],
    ["Test Conveyors", "another-author"],
    ["Sample Reactor", "third-author"],
    ["Mock Botany", "fourth-author"],
    ["Dummy Optics", "fifth-author"],
  ];
  const mcVersions = ["26.2", "26.2.1", "26.1", "1.21.11", "1.21.9"];
  const loaders = ["fabric", "neoforge", "quilt"];
  const out = [];

  for (let i = 0; i < count; i++) {
    const [name, author] = mods[i % mods.length];
    const mcVersion = mcVersions[i % mcVersions.length];
    const loader = loaders[i % loaders.length];
    const modVersion = `${1 + (i % 4)}.${i % 10}.${(i * 3) % 10}`;
    const build = i % 3 === 0 ? null : i % 7;
    const tag = `${modVersion}-${mcVersion}-${loader}${build === null ? "" : `-build.${build}`}`;
    const repo = `fake-${name.toLowerCase().replace(/\W+/g, "-")}`;

    out.push({
      repo,
      mod: name,
      author,
      upstream: "https://github.com/vibeported-mc",
      description: "Fake entry, generated locally to exercise pagination and filters.",
      library: i % 5 === 0,
      license:
        i % 3 === 0
          ? { spdxId: "MIT", name: "MIT License", url: "http://choosealicense.com/licenses/mit/" }
          : { spdxId: "GPL-3.0", name: "GNU GPLv3", url: "http://choosealicense.com/licenses/gpl-3.0/" },
      tag,
      title: `${name} ${modVersion}`,
      modVersion,
      mcVersion,
      loader,
      build,
      prerelease: i % 11 === 0,
      // Spread the dates so newest/oldest sorting is visibly different.
      publishedAt: new Date(Date.now() - i * 36e5 * 7).toISOString(),
      releaseUrl: "https://github.com/vibeported-mc",
      download: {
        name: `${repo}-${tag}.jar`,
        url: "https://github.com/vibeported-mc",
        size: 200000 + i * 1234,
      },
      extras: [],
      fake: true,
    });
  }
  return out;
}

export function useReleases() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${BASE}releases.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`releases.json -> ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;

        const fakeParam = new URLSearchParams(window.location.search).get("fake");
        if (import.meta.env.DEV && fakeParam !== null) {
          const n = Number(fakeParam);
          const extra = makeFakeReleases(Number.isFinite(n) && n > 0 ? n : 60);
          setData({
            ...json,
            releases: [...json.releases, ...extra].sort(
              (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
            ),
          });
          return;
        }

        setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error };
}
