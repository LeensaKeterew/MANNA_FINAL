import Hashtag from "./Hashtag";
import "./Sidebar.css";

export default function Sidebar({
  feedMode,
  onFeedModeChange,
  sort,
  onSortChange,
  hashtags,
  fallbackHashtags = [],
}) {
  // Falls back to the list passed down by the page if no feed-derived
  // hashtags were supplied (keeps Sidebar usable on its own elsewhere).
  const tags = hashtags && hashtags.length ? hashtags : fallbackHashtags;

  return (
    <aside className="sidebar">
      {onFeedModeChange && (
        <div className="sidebar-section">
          <h4>Feed</h4>
          <div className="feed-toggle">
            <button
              className={feedMode === "local" ? "active" : ""}
              onClick={() => onFeedModeChange("local")}
            >
              Local
            </button>
            <button
              className={feedMode === "global" ? "active" : ""}
              onClick={() => onFeedModeChange("global")}
            >
              Global
            </button>
          </div>
        </div>
      )}

      {onSortChange && (
        <div className="sidebar-section">
          <h4>Sort by</h4>
          <div className="feed-toggle sort-toggle">
            {[["newest", "Newest"], ["liked", "Most liked"], ["commented", "Most commented"]].map(([key, label]) => (
              <button key={key} className={sort === key ? "active" : ""} onClick={() => onSortChange(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sidebar-section">
        <h4>Trending</h4>
        <div className="hashtag-list">
          {tags.map((tag) => (
            <Hashtag key={tag} tag={tag} />
          ))}
        </div>
      </div>
    </aside>
  );
}
