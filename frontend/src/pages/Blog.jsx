import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="blog-page">
      <h1>Blog</h1>
      {posts.length === 0 ? (
        <p className="empty">No posts yet. Check back soon!</p>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <Link to={`/blog/${post.slug}`} key={post.slug} className="post-card">
              <h2>{post.title}</h2>
              {post.summary && <p>{post.summary}</p>}
              <time>
                {new Date(post.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
