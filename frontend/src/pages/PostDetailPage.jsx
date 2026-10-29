import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Post from "../components/Post";
import EditPost from "../components/EditPost";
import Comments from "../components/Comments";
import ReportPost from "../components/ReportPost";
import useFetch from "../hooks/useFetch";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import "../components/PostCard.css";
import "../components/Sidebar.css";
import "./PostDetailPage.css";

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const postReq = useFetch(`/api/posts/${id}`);
  const commentsReq = useFetch(`/api/posts/${id}/comments`);
  const [isEditing, setIsEditing] = useState(false);
  const [actionError, setActionError] = useState("");

  const shell = (content) => (
    <div className="app-shell">
      <NavBar />
      <div className="app-body post-detail-body">{content}</div>
    </div>
  );

  if (postReq.loading) return shell(<p className="status-message">Loading post&hellip;</p>);
  if (postReq.error || !postReq.data) {
    return shell(<p className="status-message">{postReq.error || "Post not found."}</p>);
  }

  const { post, albums } = postReq.data;
  const comments = commentsReq.data?.comments || [];
  const isOwner = post.authorId === user.id;
  const canManage = isOwner || user.role === "admin";

  const run = async (fn) => {
    setActionError("");
    try {
      return await fn();
    } catch (err) {
      setActionError(err.message);
      return false;
    }
  };

  const handleAddComment = (text) =>
    run(async () => {
      const data = await api.post(`/api/posts/${id}/comments`, { text });
      commentsReq.setData((d) => ({ ...d, comments: [...(d?.comments || []), data.comment] }));
      postReq.setData((d) => ({ ...d, post: { ...d.post, commentCount: d.post.commentCount + 1 } }));
      return true;
    });

  const handleEditComment = (commentId, text) =>
    run(async () => {
      const data = await api.put(`/api/comments/${commentId}`, { text });
      commentsReq.setData((d) => ({ ...d, comments: d.comments.map((c) => (c.id === commentId ? data.comment : c)) }));
      return true;
    });

  const handleDeleteComment = (commentId) =>
    run(async () => {
      await api.del(`/api/comments/${commentId}`);
      commentsReq.setData((d) => ({ ...d, comments: d.comments.filter((c) => c.id !== commentId) }));
      postReq.setData((d) => ({ ...d, post: { ...d.post, commentCount: Math.max(0, d.post.commentCount - 1) } }));
      return true;
    });

  const handleDelete = () => {
    if (!window.confirm("Delete this post? Its comments will be removed too.")) return;
    run(async () => {
      await api.del(`/api/posts/${id}`);
      navigate("/home");
    });
  };

  const handleSaveEdit = async (fields) => {
    const data = await api.put(`/api/posts/${id}`, fields);
    postReq.setData((d) => ({ ...d, post: data.post }));
    setIsEditing(false);
  };

  return shell(
    <>
      <main className="post-detail">
        {actionError && <div className="auth-error">{actionError}</div>}
        {post.hidden && <div className="auth-error">This post has been reported and is waiting for review.</div>}
        {isEditing ? (
          <EditPost post={post} onSave={handleSaveEdit} onCancel={() => setIsEditing(false)} />
        ) : (
          <Post
            post={post}
            isOwner={canManage}
            commentCount={post.commentCount}
            onEdit={() => setIsEditing(true)}
            onDelete={handleDelete}
          />
        )}

        {commentsReq.error ? (
          <div className="auth-error">{commentsReq.error}</div>
        ) : (
          <Comments
            comments={comments}
            currentUser={user}
            onAddComment={handleAddComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
          />
        )}
      </main>

      {(albums.length > 0 || !isOwner) && (
        <aside className="post-detail-sidebar">
          {albums.length > 0 && (
            <>
              <h4>{albums.length === 1 ? "In this album" : "In these albums"}</h4>
              <ul className="post-album-list">
                {albums.map((a) => (
                  <li key={a.id}>
                    <Link to={`/album/${a.id}`} className="album-placeholder-link">
                      {a.name} &rarr;
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {!isOwner && <ReportPost postId={post.id} />}
        </aside>
      )}
    </>
  );
}
