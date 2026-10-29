import { useMemo, useState } from "react";
import { api } from "../api";
import "../pages/CreatePostPage.css";
import "./AlbumForm.css";

// "#Food" and "#food" are the same tag.
const tagKey = (tag) => tag.trim().replace(/^#/, "").toLowerCase();

// Count every hashtag used by the album's posts (each post counts a tag once), drop the
// ones already typed in the input, and sort from most to least frequent.
function buildSuggestions(posts, typedText) {
  const counts = new Map(); // lower-case tag -> { tag, count }
  for (const post of posts || []) {
    const seenInPost = new Set();
    for (const raw of post.hashtags || []) {
      const key = tagKey(raw);
      if (!key || seenInPost.has(key)) continue;
      seenInPost.add(key);
      const entry = counts.get(key);
      if (entry) entry.count += 1;
      else counts.set(key, { key, tag: `#${raw.trim().replace(/^#/, "")}`, count: 1 });
    }
  }
  const typed = new Set(typedText.split(/[\s,]+/).filter(Boolean).map(tagKey));
  return [...counts.values()]
    .filter((entry) => !typed.has(entry.key))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

// Create (no `album`) or edit (`album`) form: name, description, hashtags.
// `posts` (optional) are the album's posts; their hashtags are offered as clickable suggestions.
export default function AlbumForm({ album, posts = [], onSaved, onCancel }) {
  const [fields, setFields] = useState({
    name: album?.name || "",
    description: album?.description || "",
    hashtags: (album?.hashtags || []).join(" "),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setFields({ ...fields, [key]: e.target.value });

  const suggestions = useMemo(() => buildSuggestions(posts, fields.hashtags), [posts, fields.hashtags]);

  // Clicking a chip appends the tag to the hashtag input (the chip then disappears).
  const addSuggestion = (tag) =>
    setFields((prev) => ({ ...prev, hashtags: prev.hashtags.trim() ? `${prev.hashtags.trim()} ${tag}` : tag }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!fields.name.trim()) {
      setError("Give your album a name.");
      return;
    }
    setBusy(true);
    try {
      const body = { name: fields.name, description: fields.description, hashtags: fields.hashtags };
      const data = album ? await api.put(`/api/albums/${album.id}`, body) : await api.post("/api/albums", body);
      onSaved?.(data.album);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1>{album ? "Edit Album" : "Create an Album"}</h1>
      {error && <div className="auth-error">{error}</div>}
      <form className="create-post-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="album-name">Name</label>
          <input id="album-name" type="text" maxLength={80} value={fields.name} onChange={update("name")} required />
        </div>
        <div className="field">
          <label htmlFor="album-description">Description</label>
          <textarea id="album-description" rows={3} maxLength={500} value={fields.description} onChange={update("description")} />
        </div>
        <div className="field">
          <label htmlFor="album-hashtags">Hashtags</label>
          <input id="album-hashtags" type="text" placeholder="#FaithFood #GardenHarvest" value={fields.hashtags} onChange={update("hashtags")} />
          {suggestions.length > 0 && (
            <div className="hashtag-suggestions">
              <p className="hashtag-suggestions-title">Suggested from your posts</p>
              <div className="hashtag-suggestions-list">
                {suggestions.map(({ key, tag, count }) => (
                  <button
                    key={key}
                    type="button"
                    className="hashtag-pill hashtag-chip"
                    onClick={() => addSuggestion(tag)}
                    aria-label={`Add ${tag}, used in ${count} ${count === 1 ? "post" : "posts"}`}
                  >
                    {tag}
                    <small className="hashtag-chip-count">{count}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="create-post-actions">
          <button type="button" className="btn-secondary" onClick={() => onCancel?.()}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>{album ? "Save" : "Create"}</button>
        </div>
      </form>
    </>
  );
}
