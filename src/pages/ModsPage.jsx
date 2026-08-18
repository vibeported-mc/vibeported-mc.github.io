import { useEffect, useMemo, useState } from "react";
import FilterPanel from "../components/FilterPanel.jsx";
import Pagination from "../components/Pagination.jsx";
import ReleaseCard from "../components/ReleaseCard.jsx";
import { compareVersionsDesc, groupReleases } from "../lib/releases.js";

// Comparators take groups and read the current build, so ordering follows what each card
// actually shows rather than the superseded builds folded inside it.
const SORTS = {
  newest: {
    label: "Newest",
    cmp: (a, b) => new Date(b.latest.publishedAt) - new Date(a.latest.publishedAt),
  },
  oldest: {
    label: "Oldest",
    cmp: (a, b) => new Date(a.latest.publishedAt) - new Date(b.latest.publishedAt),
  },
  name: { label: "Name (A–Z)", cmp: (a, b) => a.latest.mod.localeCompare(b.latest.mod) },
  mc: {
    label: "Minecraft version",
    cmp: (a, b) => compareVersionsDesc(a.latest.mcVersion, b.latest.mcVersion),
  },
};

const PAGE_SIZES = [20, 40, 60, 100];

function useToggleSet() {
  const [set, setSet] = useState(() => new Set());
  const toggle = (value) =>
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  return [set, toggle, () => setSet(new Set())];
}

// Counts what the filters will actually yield: one per card, not per underlying build.
function countBy(groups, key) {
  const out = {};
  for (const g of groups) out[g.latest[key]] = (out[g.latest[key]] ?? 0) + 1;
  return out;
}

export default function ModsPage({ data }) {
  const releases = data.releases;
  // Group key covers mcVersion and loader, so a group is uniform in both and the filters
  // below can decide on the latest release alone.
  const groups = useMemo(() => groupReleases(releases), [releases]);

  const [query, setQuery] = useState("");
  const [mcVersions, toggleMc, clearMc] = useToggleSet();
  const [loaders, toggleLoader, clearLoaders] = useToggleSet();
  const [sort, setSort] = useState("newest");
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [page, setPage] = useState(1);

  const mcOptions = useMemo(
    () => [...new Set(releases.map((r) => r.mcVersion))].sort(compareVersionsDesc),
    [releases],
  );
  const loaderOptions = useMemo(
    () => [...new Set(releases.map((r) => r.loader))].sort(),
    [releases],
  );

  const mcCounts = useMemo(() => countBy(groups, "mcVersion"), [groups]);
  const loaderCounts = useMemo(() => countBy(groups, "loader"), [groups]);

  const filtered = useMemo(() => {
    // Search matches the mod name only, as intended — not tags, authors or descriptions.
    const q = query.trim().toLowerCase();
    const out = groups.filter(({ latest: r }) => {
      if (q && !r.mod.toLowerCase().includes(q)) return false;
      if (mcVersions.size && !mcVersions.has(r.mcVersion)) return false;
      if (loaders.size && !loaders.has(r.loader)) return false;
      return true;
    });
    return out.sort(SORTS[sort].cmp);
  }, [groups, query, mcVersions, loaders, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Any change to the result set or page size can leave the current page out of range.
  useEffect(() => {
    setPage(1);
  }, [query, mcVersions, loaders, pageSize, sort]);

  const pageItems = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const activeCount = mcVersions.size + loaders.size + (query ? 1 : 0);

  function clearAll() {
    setQuery("");
    clearMc();
    clearLoaders();
  }

  function goto(p) {
    setPage(Math.min(Math.max(1, p), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-head">
          <span>Filters</span>
          {activeCount > 0 && (
            <button type="button" className="clear" onClick={clearAll}>
              Clear {activeCount}
            </button>
          )}
        </div>

        <FilterPanel
          title="Game version"
          options={mcOptions}
          selected={mcVersions}
          onToggle={toggleMc}
          counts={mcCounts}
          searchable
        />
        <FilterPanel
          title="Loader"
          options={loaderOptions}
          selected={loaders}
          onToggle={toggleLoader}
          counts={loaderCounts}
          collapsedCount={6}
        />
      </aside>

      <main className="results">
        <input
          type="search"
          className="search"
          placeholder="Search mods by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search mods by name"
        />

        <div className="toolbar">
          <label className="select">
            <span>Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORTS).map(([id, s]) => (
                <option key={id} value={id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="select">
            <span>View</span>
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <span className="count">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </span>

          <div className="toolbar-pager">
            <Pagination page={page} totalPages={totalPages} onChange={goto} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="muted empty">Nothing matches those filters.</p>
        ) : (
          <div className="grid">
            {pageItems.map((g) => (
              <ReleaseCard key={g.key} release={g.latest} older={g.older} />
            ))}
          </div>
        )}

        <div className="bottom-pager">
          <Pagination page={page} totalPages={totalPages} onChange={goto} />
        </div>
      </main>
    </div>
  );
}
