import Image from "./Image";
import Hashtag from "./Hashtag";
import LikeButton from "./LikeButton";

// The full single-post block: author header, image, title, text, verse,
// hashtags and meta. `isOwner` means "may edit/delete" (owner or admin).
export default function Post({ post, isOwner = false, commentCount = 0, onEdit, onDelete }) {
  const author = post.author;
  return (
    <>
      <div className="post-detail-header">
        <div className="post-card-author">
          <img src={author.avatar} alt={author.name} />
          <div>
            <strong>{author.name}</strong>
            <span>{post.date}</span>
          </div>
        </div>
        {isOwner && (
          <div className="post-detail-owner-actions">
            <button className="btn-secondary" onClick={onEdit}>Edit</button>
            <button className="btn-secondary" onClick={onDelete}>Delete</button>
          </div>
        )}
      </div>

      <Image src={post.image} alt={post.title} className="post-detail-image" />

      <h1>{post.title}</h1>
      <p>{post.text}</p>

      {post.verse.reference && (
        <div className="post-detail-verse">
          <span className="post-detail-verse-label">Bible Verse</span>
          &ldquo;{post.verse.text}&rdquo; &mdash; {post.verse.reference}
        </div>
      )}

      <div className="post-detail-hashtags">
        {post.hashtags.map((tag) => (
          <Hashtag key={tag} tag={tag} />
        ))}
      </div>

      <div className="post-detail-meta">
        <LikeButton key={post.id} postId={post.id} initialLiked={post.likedByMe} initialCount={post.likes} />
        <span>{commentCount} comments</span>
      </div>
    </>
  );
}
