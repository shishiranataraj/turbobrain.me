export default function Socials() {
  const links = [
    { name: "GitHub", url: "https://github.com/shishiranataraj", icon: "GH" },
    { name: "LinkedIn", url: "https://www.linkedin.com/in/shishira-nataraj/", icon: "LI" },
    { name: "X / Twitter", url: "https://x.com/Shishira_N", icon: "X" },
    { name: "Email", url: "mailto:shishira_nataraj@live.com", icon: "@" },
  ];

  return (
    <div className="socials-page">
      <h1>Let's connect</h1>
      <p>Find me on the internet:</p>
      <div className="social-grid">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-card"
          >
            <span className="social-icon">{link.icon}</span>
            <span>{link.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
