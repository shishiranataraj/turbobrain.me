import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landing">
      <div className="hero">
        <h1>
          turbo<span className="accent">brain</span>.me
        </h1>
        <p className="tagline">Shishira Nataraj — Applied AI Engineer</p>
        <p className="subtitle">
          From training CNNs to detect COVID to building AR apps in Flutter —
          I don't pick lanes, I pick problems. Bengaluru-based, hyperfocus-fuelled,
          and mass-collecting side projects since 2016.
        </p>
        <div className="fun-facts">
          <span>GPT4All tinkerer</span>
          <span>Computer vision nerd</span>
          <span>Raspberry Pi hoster</span>
          <span>Competitive programmer</span>
          <span>25 repos and counting</span>
        </div>
        <div className="hero-links">
          <Link to="/blog" className="btn">
            Read the blog
          </Link>
          <Link to="/projects" className="btn btn-secondary">
            See projects
          </Link>
        </div>
      </div>
    </div>
  );
}
