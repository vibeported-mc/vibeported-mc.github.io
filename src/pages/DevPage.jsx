import { formatDate } from "../lib/releases.js";

export default function DevPage({ data }) {
  return (
    <div className="prose">
      <h2>Dev info</h2>
      <p className="lead">
        Everything needed to build against these ports, and the conventions the releases follow.
        Each mod is credited to its original author on its card, along with the licence it is
        redistributed under; upstream authors who would like a port removed can open an issue on
        the relevant repository.
      </p>

      <h3>Version numbering</h3>
      <p>Every release tag has the same shape, which is what the filters on the Mods tab read:</p>
      <pre>
        <code>{`<mod version>-<minecraft version>-<loader>[-build.<n>]

1.4.7-26.2-fabric-build.0     mod 1.4.7, Minecraft 26.2, first build
0.13.1-26.2.1-fabric          mod 0.13.1, Minecraft 26.2.1, no build counter`}</code>
      </pre>
      <p>
        Dashes and dots only, never <code>+</code>. A trailing <code>+</code> means "any newer
        version" to Gradle, and <code>+</code> inside a repository URL path is widely mis-decoded
        as a space. Note that Fabric Loader treats everything after the first <code>-</code> as a
        semver pre-release, which its <code>x.y.x</code> style ranges still accept — but stricter
        predicates such as <code>&gt;=0.13.1</code> would not.
      </p>

      <h3>Maven artifacts</h3>
      <p>
        The library ports are also published to this organisation's GitHub Packages, which is how
        Alloy Forgery consumes owo-lib and EMI.
      </p>
      <div className="notice">
        <strong>A token is required, even though everything here is public.</strong>
        GitHub Packages' Maven registry rejects unauthenticated reads with <code>401</code>{" "}
        regardless of repository or package visibility. You need a token carrying the{" "}
        <code>read:packages</code> scope. The jars on the Mods tab need no token at all — prefer
        those if you only want to play.
      </div>
      <pre>
        <code>{`# add the scope to an existing gh login
gh auth refresh -h github.com -s read:packages`}</code>
      </pre>
      <pre>
        <code>{`repositories {
    maven {
        url = "https://maven.pkg.github.com/vibeported-mc/owo-lib"
        credentials {
            username = System.getenv("GITHUB_ACTOR")
            password = System.getenv("GITHUB_TOKEN")
        }
    }
    maven {
        url = "https://maven.pkg.github.com/vibeported-mc/emi"
        credentials {
            username = System.getenv("GITHUB_ACTOR")
            password = System.getenv("GITHUB_TOKEN")
        }
    }
}

dependencies {
    modImplementation "io.wispforest:owo-lib:0.13.1-26.2-fabric-build.0"
    compileOnly       "dev.emi:emi-fabric:1.1.24-26.2-fabric-build.0"
}`}</code>
      </pre>

      <h3>How releases are produced</h3>
      <p>
        Each fork carries one workflow. Branch builds are manual only; pushing a tag matching the
        scheme above builds the mod, publishes any Maven artifacts, and attaches the jars to a
        GitHub Release. This site is rebuilt by its own manual workflow, which reads every release
        over the GitHub GraphQL API and bakes them into a static index.
      </p>

      <footer>
        Release index generated {formatDate(data.generatedAt)}. Sources at{" "}
        <a href={`https://github.com/${data.org}`}>github.com/{data.org}</a>.
      </footer>
    </div>
  );
}
