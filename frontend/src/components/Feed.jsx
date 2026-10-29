import PostCard from "./PostCard";

// Renders a list of posts as PostCards. `renderExtra(post)` can add controls
// under a card (e.g. "Remove from album").
export default function Feed({ posts = [], emptyText = "Nothing to show yet.", renderExtra }) {
  if (!posts.length) return <p className="empty-state">{emptyText}</p>;
  return (
    <>
      {posts.map((post) =>
        renderExtra ? (
          <div key={post.id}>
            <PostCard post={post} />
            {renderExtra(post)}
          </div>
        ) : (
          <PostCard key={post.id} post={post} />
        )
      )}
    </>
  );
}
