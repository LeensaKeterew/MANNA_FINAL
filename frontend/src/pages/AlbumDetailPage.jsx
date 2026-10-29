import Hashtag from "../components/Hashtag";
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Feed from "../components/Feed";
import AlbumForm from "../components/AlbumForm";
import useFetch from "../hooks/useFetch";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import "./AlbumDetailPage.css";

export default function AlbumDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const albumReq = useFetch(`/api/albums/${id}`);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [actionError, setActionError] = useState("");

  const album = albumReq.data?.album;
  // Only fetched while the "Add posts" panel is open.
  const ownerPosts = useFetch(isAdding && album ? `/api/users/${album.ownerId}/posts?limit=200` : null);

  const shell = (content) => (
    <div className="app-shell">
      <NavBar />
      <div className="app-body">{content}</div>
    </div>
  );

  if (albumReq.loading) return shell(<p className="status-message">Loading album&hellip;</p>);
  if (albumReq.error || !album) return shell(<p className="status-message">{albumReq.error || "Album not found."}</p>);

  const canManage = album.ownerId === user.id || user.role === "admin";
  const inAlbum = new Set(album.posts.map((p) => p.id));
  const addable = (ownerPosts.data?.posts || []).filter((p) => !inAlbum.has(p.id));

  const run = async (fn) => {
    setActionError("");
    try {
      await fn();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this album? The posts inside it are kept.")) return;
    run(async () => {
      await api.del(`/api/albums/${id}`);
      navigate(`/profile/${album.ownerId}`);
    });
  };

  const handleAdd = (postId) =>
    run(async () => {
      await api.post(`/api/albums/${id}/posts`, { postId });
      albumReq.reload();
    });

  const handleRemove = (postId) =>
    run(async () => {
      await api.del(`/api/albums/${id}/posts/${postId}`);
      albumReq.reload();
    });

  return shell(
    <main className="album-detail">
      <Link to={`/profile/${album.ownerId}`} className="album-back-link">
        &larr; Back to profile
      </Link>

      {actionError && <div className="auth-error">{actionError}</div>}

      {isEditing ? (
        <AlbumForm
          album={album}
          posts={album.posts}
          onSaved={() => {
            setIsEditing(false);
            albumReq.reload();
          }}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          <h1>{album.name}</h1>
          <p className="album-detail-count">
            {album.posts.length} {album.posts.length === 1 ? "post" : "posts"} &middot; by {album.owner.name}
          </p>
          {album.description && <p>{album.description}</p>}
          {album.hashtags.length > 0 && (
            <div className="post-detail-hashtags">
              {album.hashtags.map((tag) => (
                <Hashtag key={tag} tag={tag} />
              ))}
            </div>
          )}
          {canManage && (
            <div className="inline-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsEditing(true)}>Edit album</button>
              <button type="button" className="btn-secondary" onClick={() => setIsAdding((v) => !v)}>
                {isAdding ? "Close" : "Add posts"}
              </button>
              <button type="button" className="btn-secondary" onClick={handleDelete}>Delete album</button>
            </div>
          )}
        </>
      )}

      {isAdding && canManage && (
        <div className="profile-posts">
          <h4>Add posts</h4>
          {ownerPosts.loading && <p className="status-message">Loading posts&hellip;</p>}
          {ownerPosts.error && <div className="auth-error">{ownerPosts.error}</div>}
          {ownerPosts.data && addable.length === 0 && <p className="empty-state">Every post is already in this album.</p>}
          {addable.map((p) => (
            <div className="request-row" key={p.id}>
              <img src={p.image} alt="" />
              <strong>{p.title}</strong>
              <button type="button" className="btn-secondary" onClick={() => handleAdd(p.id)}>Add</button>
            </div>
          ))}
        </div>
      )}

      <Feed
        posts={album.posts}
        emptyText="This album has no posts yet."
        renderExtra={
          canManage
            ? (post) => (
                <button type="button" className="btn-secondary album-remove-btn" onClick={() => handleRemove(post.id)}>
                  Remove from album
                </button>
              )
            : undefined
        }
      />
    </main>
  );
}
