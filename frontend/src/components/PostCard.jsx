import { useState } from "react";
import { Link } from "react-router-dom";
import Hashtag from "./Hashtag";
import Image from "./Image";
import LikeButton from "./LikeButton";
import "./PostCard.css";

export default function PostCard({ post }) {
  const author = post.author;
  const [revealed, setRevealed] = useState(false);

  // Posts with more than two open reports are hidden until the viewer chooses to look.
  if (post.hidden && !revealed) {
    return (
      <article className="post-card post-card-hidden">
        <div className="post-card-body">
          <h3>This post was reported</h3>
          <p>Several people have reported this post and it is waiting for review.</p>
          <button type="button" className="btn-secondary" onClick={() => setRevealed(true)}>
            View anyway
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="post-card">
      <Link to={`/post/${post.id}`}>
        <Image src={post.image} alt={post.title} className="post-card-image" />
      </Link>
      <div className="post-card-body">
        <div className="post-card-author">
          <img src={author.avatar} alt={author.name} />
          <div>
            <strong>{author.name}</strong>
            <span>{post.date}</span>
          </div>
        </div>

        <Link to={`/post/${post.id}`} className="post-card-title">
          <h3>{post.title}</h3>
        </Link>
        <p className="post-card-text">{post.text}</p>

        {post.verse.reference && (
          <div className="post-card-verse">
            &ldquo;{post.verse.text}&rdquo; &mdash; {post.verse.reference}
          </div>
        )}

        {post.hashtags?.length > 0 && (
          <div className="post-card-hashtags">
            {post.hashtags.map((tag) => (
              <Hashtag key={tag} tag={tag} />
            ))}
          </div>
        )}

        {post.commentPreview?.length > 0 && (
          <div className="post-card-comments">
            {post.commentPreview.map((c) => (
              <p key={c.id}><strong>{c.author.name}</strong> {c.text}</p>
            ))}
            <Link to={`/post/${post.id}`} className="post-card-viewall">
              View all {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
            </Link>
          </div>
        )}

        <div className="post-card-footer">
          <LikeButton postId={post.id} initialLiked={post.likedByMe} initialCount={post.likes} />
          <span>{"\ud83d\udcac"} {post.commentCount} comments</span>
        </div>
      </div>
    </article>
  );
}
