import { useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import ActivityFeed from "../components/ActivityFeed";
import useFetch from "../hooks/useFetch";
import "./HomePage.css";

// Local feed = you + your friends. Global feed = everyone. The feed is activity (new posts, new
// albums, photos added to albums) and can be sorted newest / most liked / most commented
// (GET /api/feed?scope=local|global&sort=newest|liked|commented).
export default function HomePage() {
  const [feedMode, setFeedMode] = useState("local");
  const [sort, setSort] = useState("newest");
  const feed = useFetch(`/api/feed?scope=${feedMode}&sort=${sort}`);
  const trending = useFetch(`/api/hashtags/trending?scope=${feedMode}`);

  const items = feed.data?.items || [];
  const trendingTags = useMemo(() => (trending.data?.hashtags || []).map((h) => h.tag), [trending.data]);

  return (
    <div className="app-shell">
      <NavBar />
      <div className="app-body home-body">
        <Sidebar feedMode={feedMode} onFeedModeChange={setFeedMode} sort={sort} onSortChange={setSort} hashtags={trendingTags} />
        <main className="home-feed">
          <h1>Home</h1>
          <p className="home-subtitle">Discover and share recipes with food that feeds the soul and body</p>

          {feed.loading && <p className="status-message">Loading your feed&hellip;</p>}
          {feed.error && <div className="auth-error">{feed.error}</div>}
          {!feed.loading && !feed.error && (
            <ActivityFeed
              items={items}
              emptyText={
                feedMode === "local"
                  ? "No posts from you or your friends yet. Add some friends or share a recipe!"
                  : "No posts have been shared yet."
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}
