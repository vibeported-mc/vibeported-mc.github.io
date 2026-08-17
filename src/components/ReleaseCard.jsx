import { formatDate, formatSize } from "../lib/releases.js";

export default function ReleaseCard({ release }) {
  return (
    <article className="card">
      <div className="card-head">
        <h3>
          {release.mod} <span className="modver">{release.modVersion}</span>
        </h3>
        {release.prerelease && <span className="badge warn">pre-release</span>}
        {release.fake && <span className="badge warn">fake</span>}

        <div className="head-links">
          <a className="tagchip link" href={`https://github.com/vibeported-mc/${release.repo}`}>
            Fork
          </a>
          <a
            className="tagchip link"
            href={release.upstream}
            target="_blank"
            rel="noopener noreferrer"
          >
            Upstream ↗
          </a>
        </div>
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
        {release.license && (
          <a
            className="tagchip link"
            href={release.license.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Licensed ${release.license.name} — inherited from the original project`}
          >
            {release.license.spdxId}
          </a>
        )}
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
      </div>

      {release.extras.length > 0 && (
        <details className="extras">
          <summary>{release.extras.length} more artifact(s)</summary>
          <ul>
            {release.extras.map((a) => (
              <li key={a.name}>
                <a href={a.url}>{a.name}</a>{" "}
                <span className="muted">{formatSize(a.size)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
