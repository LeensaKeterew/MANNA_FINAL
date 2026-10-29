import { Link } from "react-router-dom";
import PostCard from "./PostCard";
import { timeAgo } from "../utils/time";
import "./ActivityFeed.css";

// Album activity: "[user] created the album [album]" and "[user] added 2 photos to [album]".
function AlbumActivity({ item }) {
  const { actor, album, posts, type } = item;
  const photos = type === "album_photos" ? posts : [];
  const count = photos.length;
  return (
    <article className="activity-card">
      <div className="post-card-author">
        <img src={actor.avatar} alt={actor.name} />
        <div>
          <strong>
            <Link to={`/profile/${actor.id}`}>{actor.name}</Link>{" "}
            {type === "album" ? "created the album" : `added ${count} ${count === 1 ? "photo" : "photos"} to`}{" "}
            <Link to={`/album/${album.id}`}>{album.name}</Link>
          </strong>
          <span>{timeAgo(item.createdAt)}</span>
        </div>
      </div>

      {type === "album" ? (
        <Link to={`/album/${album.id}`} className="activity-album">
          <img src={album.cover} alt={album.name} />
          <div>
            <strong>{album.name}</strong>
            {album.description && <p>{album.description}</p>}
            <span>{album.postCount} {album.postCount === 1 ? "post" : "posts"}</span>
          </div>
        </Link>
      ) : (
        <div className="activity-photos">
          {photos.map((p) => (
            <Link to={`/post/${p.id}`} key={p.id} title={p.title}>
              <img src={p.hidden ? "/image-placeholder.svg" : p.image} alt={p.title} />
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

// Renders feed items: a post is a normal post card, albums get their own card type.
export default function ActivityFeed({ items = [], emptyText = "Nothing to show yet." }) {
  if (!items.length) return <p className="empty-state">{emptyText}</p>;
  return (
    <>
      {items.map((item) =>
        item.type === "post" ? <PostCard key={item.id} post={item.post} /> : <AlbumActivity key={item.id} item={item} />
      )}
    </>
  );
}
