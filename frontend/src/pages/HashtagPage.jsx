import { useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import Feed from "../components/Feed";
import useFetch from "../hooks/useFetch";
import "./HomePage.css";

// Every post carrying one hashtag, newest first (GET /api/posts?tag=#name).
export default function HashtagPage() {
  const { tag } = useParams();
  const label = `#${tag}`;
  const req = useFetch(`/api/posts?tag=${encodeURIComponent(label)}`);
  const posts = req.data?.posts || [];

  return (
    <div className="app-shell">
      <NavBar />
      <div className="app-body">
        <main className="home-feed">
          <h1>{label}</h1>
          <p className="home-subtitle">
            {req.data ? `${posts.length} ${posts.length === 1 ? "post" : "posts"} tagged ${label}` : "Posts with this hashtag"}
          </p>
          {req.loading && <p className="status-message">Loading posts&hellip;</p>}
          {req.error && <div className="auth-error">{req.error}</div>}
          {!req.loading && !req.error && <Feed posts={posts} emptyText={`No posts use ${label} yet.`} />}
        </main>
      </div>
    </div>
  );
}
