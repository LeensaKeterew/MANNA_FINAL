import { useState } from "react";
import "../pages/CreatePostPage.css";

// Edit an existing post. Owners can change the title, description, verse and hashtags;
// the image cannot be replaced after posting.
export default function EditPost({ post, onSave, onCancel }) {
  const [fields, setFields] = useState({
    title: post.title || "",
    text: post.text || "",
    verseText: post.verse?.text || "",
    verseReference: post.verse?.reference || "",
    hashtags: (post.hashtags || []).join(" "),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setFields({ ...fields, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fields.title.trim() || !fields.text.trim()) {
      setError("Give your post a title and a bit of text.");
      return;
    }

    setBusy(true);
    try {
      await onSave?.({
        title: fields.title,
        text: fields.text,
        verse: { text: fields.verseText, reference: fields.verseReference },
        hashtags: fields.hashtags,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {error && <div className="auth-error">{error}</div>}

      <form className="create-post-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="edit-title">Title</label>
          <input
            id="edit-title"
            type="text"
            placeholder="e.g. Honey & Herb Roasted Chicken"
            value={fields.title}
            onChange={update("title")}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="edit-text">Description</label>
          <textarea
            id="edit-text"
            rows={4}
            placeholder="Tell the story behind the dish..."
            value={fields.text}
            onChange={update("text")}
            required
          />
        </div>

        <div className="create-post-row">
          <div className="field">
            <label htmlFor="edit-verseText">Verse (optional)</label>
            <input
              id="edit-verseText"
              type="text"
              placeholder="Taste and see that the Lord is good..."
              value={fields.verseText}
              onChange={update("verseText")}
            />
          </div>

          <div className="field">
            <label htmlFor="edit-verseReference">Reference</label>
            <input
              id="edit-verseReference"
              type="text"
              placeholder="Psalm 34:8"
              value={fields.verseReference}
              onChange={update("verseReference")}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="edit-hashtags">Hashtags</label>
          <input
            id="edit-hashtags"
            type="text"
            placeholder="#FaithFood #GardenHarvest"
            value={fields.hashtags}
            onChange={update("hashtags")}
          />
        </div>

        <div className="create-post-actions">
          <button type="button" className="btn-secondary" onClick={() => onCancel?.()}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            Save
          </button>
        </div>
      </form>
    </>
  );
}
