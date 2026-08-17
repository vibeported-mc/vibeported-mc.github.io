import { useEffect, useMemo, useState } from "react";

const BASE = import.meta.env.BASE_URL;

function formatSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Newest Minecraft version first: compare numerically per component rather than as strings,
// so 26.2.10 sorts above 26.2.2.
function compareVersionsDesc(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pb[i] ?? 0) - (pa[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function Pills({ label, options, value, onChange, formatter = (v) => v }) {
  if (options.length < 2) return null;
  return (
    <div className="filter">
      <span className="filter-label">{label}</span>
      <div className="pills">
        <button
          type="button"
          className={`pill ${value === null ? "on" : ""}`}
          onClick={() => onChange(null)}
        >
          All
        </button>
        {options.map((opt) => (
          <button
            type="button"
            key={opt}
            className={`pill ${value === opt ? "on" : ""}`}
            onClick={() => onChange(value === opt ? null : opt)}
          >
            {formatter(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReleaseCard({ release, isLatest }) {
  return (
    <article className="card">
      <div className="card-head">
        <h3>
          {release.mod} <span className="modver">{release.modVersion}</span>
        </h3>
        {isLatest && <span className="badge">latest</span>}
        {release.prerelease && <span className="badge warn">pre-release</span>}
      </div>

      <p className="by">
        by{" "}
        <a href={release.upstream} target="_blank" rel="noopener noreferrer">
          {release.author}
        </a>{" "}
        — ported here
      </p>

      <p className="desc">{release.description}</p>

      <div className="meta">
        <span className="tagchip">Minecraft {release.mcVersion}</span>
        <span className="tagchip">{release.loader}</span>
        {release.build !== null && <span className="tagchip">build {release.build}</span>}
        {release.library && <span className="tagchip">library</span>}
      </div>

      <p className="published">{formatDate(release.publishedAt)}</p>

      <div className="actions">
        {release.download ? (
          <a className="btn primary" href={release.download.url}>
            Download jar
            <span className="btn-sub">{formatSize(release.download.size)}</span>
          </a>
        ) : (
          <a className="btn" href={release.releaseUrl}>
            View assets
          </a>
        )}
        <a className="btn" href={release.releaseUrl}>
          Release notes
        </a>
        <a className="btn" href={`https://github.com/vibeported-mc/${release.repo}`}>
          Source
        </a>
      </div>

      {release.extras.length > 0 && (
        <details className="extras">
          <summary>{release.extras.length} more artifact(s)</summary>
          <ul>
            {release.extras.map((a) => (
              <li key={a.name}>
                <a href={a.url}>{a.name}</a> <span className="muted">{formatSize(a.size)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [mod, setMod] = useState(null);
  const [loader, setLoader] = useState(null);
  const [mc, setMc] = useState(null);

  useEffect(() => {
    fetch(`${BASE}releases.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`releases.json -> ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const releases = data?.releases ?? [];

  const loaders = useMemo(
    () => [...new Set(releases.map((r) => r.loader))].sort(),
    [releases],
  );
  const mcVersions = useMemo(
    () => [...new Set(releases.map((r) => r.mcVersion))].sort(compareVersionsDesc),
    [releases],
  );
  const mods = useMemo(() => [...new Set(releases.map((r) => r.mod))].sort(), [releases]);

  // The newest release per repo, so a "latest" badge can be shown without re-sorting.
  const latestByRepo = useMemo(() => {
    const seen = {};
    for (const r of releases) if (!seen[r.repo]) seen[r.repo] = r.tag;
    return seen;
  }, [releases]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return releases.filter((r) => {
      if (mod && r.mod !== mod) return false;
      if (loader && r.loader !== loader) return false;
      if (mc && r.mcVersion !== mc) return false;
      if (!q) return true;
      return [r.mod, r.author, r.tag, r.description, r.mcVersion, r.loader]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [releases, query, mod, loader, mc]);

  const anyFilter = query || mod || loader || mc;

  return (
    <div className="wrap">
      <header>
        <h1>
          vibeported<span className="dot">.</span>
        </h1>
        <p className="tagline">
          Unofficial community ports of existing Minecraft mods to newer game versions. Every mod
          here was written by someone else — we only did the version port.
        </p>
        <div className="notice">
          <strong>Not affiliated with the original authors.</strong>
          These are forks published so people can play on new versions before official releases
          exist. All credit for the mods belongs to their authors, linked on each card. Each fork
          keeps the original project's licence — see the <code>LICENSE</code> file in its
          repository. Upstream authors who would like a port removed can open an issue on the
          relevant repository.
        </div>
      </header>

      {error && (
        <div className="notice error">
          <strong>Could not load release data.</strong>
          {error}. The repositories at{" "}
          <a href="https://github.com/vibeported-mc">github.com/vibeported-mc</a> always have the
          authoritative releases.
        </div>
      )}

      {!data && !error && <p className="muted">Loading releases…</p>}

      {data && (
        <>
          <div className="controls">
            <input
              type="search"
              className="search"
              placeholder="Search mods, versions, authors…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search releases"
            />
            <Pills label="Mod" options={mods} value={mod} onChange={setMod} />
            <Pills label="Loader" options={loaders} value={loader} onChange={setLoader} />
            <Pills
              label="Minecraft"
              options={mcVersions}
              value={mc}
              onChange={setMc}
              formatter={(v) => v}
            />
          </div>

          <div className="resultbar">
            <span>
              {filtered.length} of {releases.length} release{releases.length === 1 ? "" : "s"}
            </span>
            {anyFilter && (
              <button
                type="button"
                className="clear"
                onClick={() => {
                  setQuery("");
                  setMod(null);
                  setLoader(null);
                  setMc(null);
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="muted">Nothing matches those filters.</p>
          ) : (
            <div className="grid">
              {filtered.map((r) => (
                <ReleaseCard
                  key={`${r.repo}@${r.tag}`}
                  release={r}
                  isLatest={latestByRepo[r.repo] === r.tag}
                />
              ))}
            </div>
          )}

          <h2>Using the Maven artifacts</h2>
          <p>
            Some of these are libraries and are also published to this organisation's GitHub
            Packages, which is how Alloy Forgery consumes owo-lib and EMI.
          </p>
          <div className="notice">
            <strong>A token is required, even though everything here is public.</strong>
            GitHub Packages' Maven registry rejects unauthenticated reads with{" "}
            <code>401</code> regardless of visibility, so you need a token with the{" "}
            <code>read:packages</code> scope. The jars above need no token — prefer those if you
            just want to play.
          </div>
          <pre>
            <code>{`repositories {
    maven {
        url = "https://maven.pkg.github.com/vibeported-mc/owo-lib"
        credentials {
            username = System.getenv("GITHUB_ACTOR")
            password = System.getenv("GITHUB_TOKEN")
        }
    }
}`}</code>
          </pre>

          <h2>Version numbering</h2>
          <p>Every release tag has the same shape, which is what the filters above read:</p>
          <pre>
            <code>{`<mod version>-<minecraft version>-<loader>[-build.<n>]

1.4.7-26.2-fabric-build.0     mod 1.4.7, Minecraft 26.2, first build
0.13.1-26.2.1-fabric          mod 0.13.1, Minecraft 26.2.1, no build counter`}</code>
          </pre>
          <p>
            Dashes and dots only, never <code>+</code> — a trailing <code>+</code> means "any newer
            version" to Gradle, and <code>+</code> in a repository URL path is widely mis-decoded
            as a space.
          </p>

          <footer>
            Release data generated {formatDate(data.generatedAt)} from the GitHub Releases API.
            Sources at <a href="https://github.com/vibeported-mc">github.com/vibeported-mc</a>.
          </footer>
        </>
      )}
    </div>
  );
}
