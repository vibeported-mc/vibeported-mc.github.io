import { useEffect, useState } from "react";
import Nav from "./components/Nav.jsx";
import DevPage from "./pages/DevPage.jsx";
import ModsPage from "./pages/ModsPage.jsx";
import { useReleases } from "./lib/releases.js";

const ROUTES = ["mods", "dev"];

// Hash routing rather than a router dependency: this is two tabs on a static host, and
// hash links keep working on GitHub Pages without any redirect rules.
function useHashRoute() {
  const read = () => {
    const raw = window.location.hash.replace(/^#\/?/, "").split("?")[0];
    return ROUTES.includes(raw) ? raw : "mods";
  };
  const [route, setRoute] = useState(read);

  useEffect(() => {
    const onHash = () => setRoute(read());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return route;
}

export default function App() {
  const route = useHashRoute();
  const { data, error } = useReleases();

  return (
    <>
      <Nav route={route} />

      <div className="wrap">
        {route === "mods" && (
          <header className="hero">
            <h1>Minecraft mod ports</h1>
            <p className="tagline">
              Unofficial community ports of existing mods to newer game versions. Every mod here
              was written by someone else — we only did the version port. Each card credits its
              original author and shows the licence it is redistributed under.
            </p>
          </header>
        )}

        {error && (
          <div className="notice error">
            <strong>Could not load release data.</strong>
            {error}. The repositories at{" "}
            <a href="https://github.com/vibeported-mc">github.com/vibeported-mc</a> always have the
            authoritative releases.
          </div>
        )}

        {!data && !error && <p className="muted">Loading releases…</p>}

        {data && route === "mods" && <ModsPage data={data} />}
        {data && route === "dev" && <DevPage data={data} />}
      </div>
    </>
  );
}
