import { useState } from "react";
import { api } from "../api";
import "../pages/CreatePostPage.css";

// Create-post form, shared by the Create page and the Profile page.
// Image: upload a file (multer on the backend) or paste a link.
export default function CreatePost({ onCreated, onCancel }) {
  const [fields, setFields] = useState({
    title: "",
    image: "",
    text: "",
    verseText: "",
    verseReference: "",
    hashtags: "",
  });
  const [file, setFile] = useState(null);
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
    if (!file && !fields.image.trim()) {
      setError("Add an image: upload a file or paste an image link.");
      return;
    }

    setBusy(true);
    try {
      const image = file ? await api.upload(file) : fields.image.trim();
      const data = await api.post("/api/posts", {
        title: fields.title,
        text: fields.text,
        image,
        verse: { text: fields.verseText, reference: fields.verseReference },
        hashtags: fields.hashtags,
      });
      onCreated?.(data.post);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1>Share a Post</h1>
      <p className="create-post-subtitle">
        Share a recipe and a verse that goes with it, for the local and global feed.
      </p>

      {error && <div className="auth-error">{error}</div>}

      <form className="create-post-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Honey & Herb Roasted Chicken"
            maxLength={120}
            value={fields.title}
            onChange={update("title")}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="imageFile">Upload image</label>
          <input
            id="imageFile"
            className="file-input"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="field">
          <label htmlFor="image">...or image link</label>
          <input
            id="image"
            type="url"
            placeholder="https://..."
            value={fields.image}
            onChange={update("image")}
            disabled={Boolean(file)}
          />
        </div>

        <div className="field">
          <label htmlFor="text">Description</label>
          <textarea
            id="text"
            rows={4}
            placeholder="Tell the story behind the dish..."
            maxLength={2000}
            value={fields.text}
            onChange={update("text")}
            required
          />
        </div>

        <div className="create-post-row">
          <div className="field">
            <label htmlFor="verseText">Verse (optional)</label>
            <input
              id="verseText"
              type="text"
              placeholder="Taste and see that the Lord is good..."
              value={fields.verseText}
              onChange={update("verseText")}
            />
          </div>

          <div className="field">
            <label htmlFor="verseReference">Reference</label>
            <input
              id="verseReference"
              type="text"
              placeholder="Psalm 34:8"
              value={fields.verseReference}
              onChange={update("verseReference")}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="hashtags">Hashtags</label>
          <input
            id="hashtags"
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
            {busy ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </>
  );
}
