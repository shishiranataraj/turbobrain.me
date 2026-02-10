import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  const links = [
    { to: "/", label: "home" },
    { to: "/blog", label: "blog" },
    { to: "/projects", label: "projects" },
    { to: "/socials", label: "socials" },
  ];

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        turbobrain<span className="accent">.me</span>
      </Link>
      <div className="nav-links">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={pathname === link.to ? "active" : ""}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
