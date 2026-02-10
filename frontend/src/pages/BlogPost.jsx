import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Markdown from "react-markdown";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setPost)
      .catch(() => setError(true));
  }, [slug]);

  if (error) {
    return (
      <div className="blog-post">
        <p>Post not found.</p>
        <Link to="/blog">Back to blog</Link>
      </div>
    );
  }

  if (!post) return <p>Loading...</p>;

  return (
    <div className="blog-post">
      <Link to="/blog" className="back-link">
        &larr; Back to blog
      </Link>
      <h1>{post.title}</h1>
      <time>
        {new Date(post.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
      <div className="markdown-body">
        <Markdown>{post.content}</Markdown>
      </div>
    </div>
  );
}
