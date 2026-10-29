import { Link, useSearchParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import Feed from "../components/Feed";
import Hashtag from "../components/Hashtag";
import useFetch from "../hooks/useFetch";
import "./HomePage.css";
import "./ProfilePage.css";
import "./SearchPage.css";

// Full search results, grouped: people, posts, albums and hashtags (GET /api/search?q=&full=1).
export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const req = useFetch(q ? `/api/search?q=${encodeURIComponent(q)}&full=1` : null);
  const { users = [], posts = [], albums = [], hashtags = [] } = req.data || {};
  const nothing = req.data && !users.length && !posts.length && !albums.length && !hashtags.length;

  return (
    <div className="app-shell">
      <NavBar />
      <div className="app-body">
        <main className="home-feed">
          <h1>{q ? <>Results for &ldquo;{q}&rdquo;</> : "Search"}</h1>
          {!q && <p className="empty-state">Type something in the search bar to find people, posts, albums and hashtags.</p>}
          {req.loading && <p className="status-message">Searching&hellip;</p>}
          {req.error && <div className="auth-error">{req.error}</div>}
          {nothing && <p className="empty-state">Nothing matched &ldquo;{q}&rdquo;.</p>}

          {users.length > 0 && (
            <section className="search-section">
              <h2>People ({users.length})</h2>
              {users.map((u) => (
                <div className="request-row" key={u.id}>
                  <img src={u.avatar} alt={u.name} />
                  <Link to={`/profile/${u.id}`}><strong>{u.name}</strong> <span>@{u.username}</span></Link>
                </div>
              ))}
            </section>
          )}

          {hashtags.length > 0 && (
            <section className="search-section">
              <h2>Hashtags ({hashtags.length})</h2>
              <div className="search-tags">
                {hashtags.map((h) => (
                  <span key={h.tag} className="search-tag">
                    <Hashtag tag={h.tag} /> <span className="search-count">{h.count} {h.count === 1 ? "post" : "posts"}</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {albums.length > 0 && (
            <section className="search-section">
              <h2>Albums ({albums.length})</h2>
              <div className="posts-grid">
                {albums.map((a) => (
                  <Link to={`/album/${a.id}`} key={a.id} className="posts-grid-item album-grid-item">
                    <img src={a.cover} alt={a.name} />
                    <span className="album-grid-title">{a.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {posts.length > 0 && (
            <section className="search-section">
              <h2>Posts ({posts.length})</h2>
              <Feed posts={posts} />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
