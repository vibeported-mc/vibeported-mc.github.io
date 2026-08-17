// Compact pager: always shows first and last, a window around the current page, and an
// ellipsis for the gaps — the shape Modrinth uses (1 2 … 3658 ›).
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current]);
  for (const d of [-1, 1]) {
    const p = current + d;
    if (p > 1 && p < total) pages.add(p);
  }
  // Keep the run next to the first/last page contiguous rather than showing "1 … 2".
  if (current <= 3) [2, 3, 4].forEach((p) => p < total && pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => p > 1 && pages.add(p));

  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("gap");
    out.push(p);
    prev = p;
  }
  return out;
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const items = pageList(page, totalPages);

  return (
    <nav className="pager" aria-label="Pagination">
      <button
        type="button"
        className="pagebtn"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      {items.map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="pagegap" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            type="button"
            key={item}
            className={`pagebtn ${item === page ? "on" : ""}`}
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="pagebtn"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
