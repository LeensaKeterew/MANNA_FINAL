import { useState } from "react";
import { timeAgo } from "../utils/time";

// Comment list + add-comment form. Delete shows for the comment's author and admins.
export default function Comments({ comments = [], currentUser, onAddComment, onEditComment, onDeleteComment }) {
  const [newComment, setNewComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || busy) return;
    setBusy(true);
    const ok = await onAddComment?.(newComment.trim());
    if (ok) setNewComment("");
    setBusy(false);
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setDraft(c.text);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true);
    const ok = await onEditComment?.(editingId, draft.trim());
    if (ok) setEditingId(null);
    setBusy(false);
  };

  return (
    <section className="post-detail-comments">
      <h3>Comments</h3>
      {comments.length === 0 && <p className="empty-state">No comments yet. Be the first.</p>}
      {comments.map((c) => (
        <div className="comment" key={c.id}>
          <img src={c.author.avatar} alt={c.author.name} />
          <div>
            <strong>{c.author.name}</strong>
            <span className="comment-time">{timeAgo(c.createdAt)}</span>
            {c.edited && <span className="comment-time"> (edited)</span>}
            {(c.authorId === currentUser.id || currentUser.role === "admin") && (
              <>
                <button type="button" className="comment-edit" onClick={() => startEdit(c)}>
                  Edit
                </button>
                <button type="button" className="comment-delete" onClick={() => onDeleteComment?.(c.id)}>
                  Delete
                </button>
              </>
            )}
            {editingId === c.id ? (
              <form className="comment-edit-form" onSubmit={saveEdit}>
                <input type="text" value={draft} maxLength={500} autoFocus onChange={(e) => setDraft(e.target.value)} />
                <button type="submit" className="btn-secondary" disabled={busy}>Save</button>
                <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
              </form>
            ) : (
              <p>{c.text}</p>
            )}
          </div>
        </div>
      ))}

      <form className="comment-form" onSubmit={handleAddComment}>
        <input
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          maxLength={500}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button type="submit" className="btn-secondary" disabled={busy}>Post</button>
      </form>
    </section>
  );
}
