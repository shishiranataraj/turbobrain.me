import { useEffect, useState } from "react";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="projects-page">
      <h1>Projects</h1>
      {projects.length === 0 ? (
        <p className="empty">Projects coming soon!</p>
      ) : (
        <div className="project-grid">
          {projects.map((p) => (
            <div key={p.id} className="project-card">
              <h2>{p.title}</h2>
              <p>{p.description}</p>
              {p.tags.length > 0 && (
                <div className="tags">
                  {p.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {p.url && (
                <a href={p.url} target="_blank" rel="noopener noreferrer">
                  View project &rarr;
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
