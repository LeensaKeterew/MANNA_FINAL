import { useState } from "react";
import { api } from "../api";

// Like / unlike toggle backed by POST/DELETE /api/posts/:id/like.
export default function LikeButton({ postId, initialLiked = false, initialCount = 0 }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = liked ? await api.del(`/api/posts/${postId}/like`) : await api.post(`/api/posts/${postId}/like`);
      setLiked(data.likedByMe);
      setCount(data.likes);
    } catch {
      /* leave the counter as it was */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`like-toggle ${liked ? "liked" : ""}`}
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this post" : "Like this post"}
    >
      {liked ? "\u2764\ufe0f" : "\ud83e\udd0d"} {count} {count === 1 ? "like" : "likes"}
    </button>
  );
}
