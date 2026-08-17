import { useMemo, useState } from "react";

// One collapsible sidebar facet: an optional search box, a scrollable checkbox list, and a
// "show all" toggle once the list is longer than `collapsedCount`.
export default function FilterPanel({
  title,
  options,
  selected,
  onToggle,
  searchable = false,
  collapsedCount = 8,
  counts = null,
}) {
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [needle, setNeedle] = useState("");

  const matching = useMemo(() => {
    const q = needle.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, needle]);

  // Selected entries stay visible even when collapsed, so a filter can never be active
  // while hidden from view.
  const visible = useMemo(() => {
    if (showAll || matching.length <= collapsedCount) return matching;
    const head = matching.slice(0, collapsedCount);
    const hiddenSelected = matching.slice(collapsedCount).filter((o) => selected.has(o));
    return [...head, ...hiddenSelected];
  }, [matching, showAll, collapsedCount, selected]);

  const hiddenCount = matching.length - visible.length;

  if (options.length === 0) return null;

  return (
    <section className="panel">
      <button type="button" className="panel-head" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        <span className={`chev ${open ? "up" : ""}`} aria-hidden="true">
          ⌃
        </span>
      </button>

      {open && (
        <div className="panel-body">
          {searchable && options.length > collapsedCount && (
            <input
              type="search"
              className="panel-search"
              placeholder="Search…"
              value={needle}
              onChange={(e) => setNeedle(e.target.value)}
              aria-label={`Search ${title}`}
            />
          )}

          <ul className="opts">
            {visible.map((opt) => (
              <li key={opt}>
                <label className={selected.has(opt) ? "opt on" : "opt"}>
                  <input
                    type="checkbox"
                    checked={selected.has(opt)}
                    onChange={() => onToggle(opt)}
                  />
                  <span className="opt-label">{opt}</span>
                  {counts && <span className="opt-count">{counts[opt] ?? 0}</span>}
                </label>
              </li>
            ))}
          </ul>

          {matching.length === 0 && <p className="panel-empty">No matches.</p>}

          {(hiddenCount > 0 || showAll) && matching.length > collapsedCount && (
            <button type="button" className="show-more" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show fewer" : `Show all ${matching.length}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
