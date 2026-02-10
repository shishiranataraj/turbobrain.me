import { useEffect, useState } from "react";
import MarkdownEditor from "../components/MarkdownEditor";

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);

  // Projects state
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({ title: "", description: "", url: "", tags: "", order: 0 });

  useEffect(() => {
    fetch("/api/auth/check", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setAuthenticated(data.authenticated))
      .finally(() => setChecking(false));
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
    } else {
      setError("Invalid password");
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAuthenticated(false);
    setEditing(null);
    setEditingProject(null);
  };

  // --- Posts ---
  const loadPosts = async () => {
    const res = await fetch("/api/posts", { credentials: "include" });
    setPosts(await res.json());
  };

  const handleSave = async (data) => {
    if (editing === "new") {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
    } else {
      await fetch(`/api/posts/${editing.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
    }
    setEditing(null);
    loadPosts();
  };

  const handleDeletePost = async (slug) => {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/posts/${slug}`, { method: "DELETE", credentials: "include" });
    loadPosts();
  };

  const startEditPost = async (slug) => {
    const res = await fetch(`/api/posts/${slug}`, { credentials: "include" });
    setEditing(await res.json());
  };

  // --- Projects ---
  const loadProjects = async () => {
    const res = await fetch("/api/projects", { credentials: "include" });
    setProjects(await res.json());
  };

  const openProjectForm = (project) => {
    if (project) {
      setEditingProject(project.id);
      setProjectForm({
        title: project.title,
        description: project.description,
        url: project.url,
        tags: project.tags.join(", "),
        order: project.order,
      });
    } else {
      setEditingProject("new");
      setProjectForm({ title: "", description: "", url: "", tags: "", order: 0 });
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    const body = { ...projectForm, order: Number(projectForm.order) || 0 };
    if (editingProject === "new") {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
    } else {
      await fetch(`/api/projects/${editingProject}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
    }
    setEditingProject(null);
    loadProjects();
  };

  const handleDeleteProject = async (id) => {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE", credentials: "include" });
    loadProjects();
  };

  useEffect(() => {
    if (authenticated) {
      loadPosts();
      loadProjects();
    }
  }, [authenticated]);

  if (checking) return <p>Loading...</p>;

  if (!authenticated) {
    return (
      <div className="admin-login">
        <h1>Admin</h1>
        <form onSubmit={login}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="submit">Login</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="admin-page">
        <h1>{editing === "new" ? "New Post" : `Editing: ${editing.title}`}</h1>
        <MarkdownEditor
          post={editing === "new" ? null : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin</h1>
        <button onClick={logout} className="btn-secondary">Logout</button>
      </div>

      <div className="admin-tabs">
        <button className={tab === "posts" ? "tab active" : "tab"} onClick={() => setTab("posts")}>Posts</button>
        <button className={tab === "projects" ? "tab active" : "tab"} onClick={() => setTab("projects")}>Projects</button>
      </div>

      {tab === "posts" && (
        <>
          <div className="admin-section-header">
            <button onClick={() => setEditing("new")}>New Post</button>
          </div>
          <div className="admin-posts">
            {posts.length === 0 ? (
              <p className="empty">No posts yet.</p>
            ) : (
              posts.map((post) => (
                <div key={post.slug} className="admin-post-row">
                  <div>
                    <strong>{post.title}</strong>
                    <span className={`badge ${post.published ? "published" : "draft"}`}>
                      {post.published ? "published" : "draft"}
                    </span>
                  </div>
                  <div>
                    <button onClick={() => startEditPost(post.slug)}>Edit</button>
                    <button onClick={() => handleDeletePost(post.slug)} className="btn-danger">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {tab === "projects" && (
        <>
          <div className="admin-section-header">
            <button onClick={() => openProjectForm(null)}>New Project</button>
          </div>

          {editingProject && (
            <form className="project-form" onSubmit={handleSaveProject}>
              <input
                type="text"
                placeholder="Project title"
                value={projectForm.title}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                rows={3}
              />
              <input
                type="text"
                placeholder="URL (e.g. https://github.com/...)"
                value={projectForm.url}
                onChange={(e) => setProjectForm({ ...projectForm, url: e.target.value })}
              />
              <input
                type="text"
                placeholder="Tags (comma separated, e.g. Python, AI, Flask)"
                value={projectForm.tags}
                onChange={(e) => setProjectForm({ ...projectForm, tags: e.target.value })}
              />
              <input
                type="number"
                placeholder="Display order"
                value={projectForm.order}
                onChange={(e) => setProjectForm({ ...projectForm, order: e.target.value })}
              />
              <div className="editor-actions">
                <button type="submit" disabled={!projectForm.title.trim()}>Save</button>
                <button type="button" onClick={() => setEditingProject(null)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          <div className="admin-posts">
            {projects.length === 0 ? (
              <p className="empty">No projects yet.</p>
            ) : (
              projects.map((p) => (
                <div key={p.id} className="admin-post-row">
                  <div>
                    <strong>{p.title}</strong>
                    {p.tags.length > 0 && (
                      <span className="badge published">{p.tags.join(", ")}</span>
                    )}
                  </div>
                  <div>
                    <button onClick={() => openProjectForm(p)}>Edit</button>
                    <button onClick={() => handleDeleteProject(p.id)} className="btn-danger">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
