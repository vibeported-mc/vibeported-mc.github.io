const BASE = import.meta.env.BASE_URL;

const TABS = [
  { id: "mods", label: "Mods" },
  { id: "dev", label: "Dev info" },
];

export default function Nav({ route }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a className="brand" href="#/mods">
          <img className="brand-icon" src={`${BASE}icon.png`} alt="" width="32" height="32" />
          <span className="brand-name">
            vibeported<span className="dot">.</span>
          </span>
        </a>

        <div className="tabs">
          {TABS.map((tab) => (
            <a
              key={tab.id}
              className={`tab ${route === tab.id ? "on" : ""}`}
              href={`#/${tab.id}`}
              aria-current={route === tab.id ? "page" : undefined}
            >
              {tab.label}
            </a>
          ))}
        </div>

        <a
          className="nav-link"
          href="https://github.com/vibeported-mc"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
    </nav>
  );
}
