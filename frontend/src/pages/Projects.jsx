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

  const liveProjects = [
    {
      id: "audio-separator",
      title: "Audio Source Separator",
      description:
        "Separate music into vocals, drums, bass, and other tracks using AI. Also supports speech transcription with speaker detection.",
      tags: ["AI", "Audio", "Demucs", "Whisper"],
      wip: true,
    },
  ];

  const allProjects = [...liveProjects, ...projects];

  return (
    <div className="projects-page">
      <h1>Projects</h1>
      {allProjects.length === 0 ? (
        <p className="empty">Projects coming soon!</p>
      ) : (
        <div className="project-grid">
          {allProjects.map((p) => (
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
              {p.wip ? (
                <span className="wip-badge">Work in progress</span>
              ) : (
                p.url && (
                  <a
                    href={p.url}
                    target={p.live ? "_self" : "_blank"}
                    rel="noopener noreferrer"
                  >
                    {p.live ? "Try it live" : "View project"} &rarr;
                  </a>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
