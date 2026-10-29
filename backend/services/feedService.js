const posts = require("../db/posts");
const albums = require("../db/albums");
const activities = require("../db/activities");
const friends = require("../db/friends");
const users = require("../db/users");
const { badRequest } = require("../utils/errors");
const { presentPosts, presentAlbums, publicUser, userMap } = require("./presenters");

const SORTS = ["newest", "liked", "commented"];

async function authorScope(user, scope) {
  if (!["local", "global"].includes(scope)) throw badRequest("Scope must be local or global.");
  if (scope === "global") return null;
  return [user._id, ...(await friends.friendIds(user._id))];
}

// Turns stored activity rows into feed items. Items whose post or album has since been deleted are dropped.
async function presentActivities(rows, viewer) {
  if (!rows.length) return [];
  const postIds = rows.flatMap((r) => (r.type === "post" ? [r.postId] : r.type === "album_photos" ? r.postIds : []));
  const albumIds = rows.filter((r) => r.type !== "post").map((r) => r.albumId);
  const [postRows, albumRows, people] = await Promise.all([
    posts.findByIds(postIds),
    albums.findByIds(albumIds),
    userMap(rows.map((r) => r.actorId)),
  ]);
  const [presentedPosts, presentedAlbums] = await Promise.all([presentPosts(postRows, viewer), presentAlbums(albumRows)]);
  const postById = Object.fromEntries(presentedPosts.map((p) => [p.id, p]));
  const albumById = Object.fromEntries(presentedAlbums.map((a) => [a.id, a]));

  const items = [];
  for (const r of rows) {
    const base = { id: r._id.toString(), type: r.type, createdAt: r.createdAt, actor: publicUser(people[r.actorId.toString()]) };
    if (r.type === "post") {
      const post = postById[r.postId.toString()];
      if (post) items.push({ ...base, post });
    } else {
      const album = albumById[r.albumId.toString()];
      if (!album) continue;
      if (r.type === "album") items.push({ ...base, album });
      else {
        const photos = r.postIds.map((id) => postById[id.toString()]).filter(Boolean);
        if (photos.length) items.push({ ...base, album, posts: photos });
      }
    }
  }
  return items;
}

// Local = you + your friends. Global = everyone.
// newest: new posts, new albums and photos added to albums, newest first.
// liked / commented: posts only, ranked by that count (ties go to the newer post).
async function feed(user, scope = "local", { sort = "newest", limit = 50 } = {}) {
  if (!SORTS.includes(sort)) throw badRequest("Sort must be newest, liked or commented.");
  const authorIds = await authorScope(user, scope);
  const n = Math.min(Number(limit) || 50, 100);
  if (sort === "newest") return presentActivities(await activities.list({ actorIds: authorIds, limit: n }), user);

  const presented = await presentPosts(await posts.list({ authorIds, limit: 200 }), user);
  const score = (p) => (sort === "liked" ? p.likes : p.commentCount);
  presented.sort((a, b) => score(b) - score(a) || new Date(b.createdAt) - new Date(a.createdAt));
  return presented.slice(0, n).map((p) => ({ id: `post-${p.id}`, type: "post", createdAt: p.createdAt, actor: p.author, post: p }));
}

async function trending(user, scope = "local") {
  const authorIds = await authorScope(user, scope);
  return (await posts.topHashtags(authorIds)).map((t) => ({ tag: t._id, count: t.count }));
}

// People (name, username, email), posts, albums (name, description) and hashtags.
// full = the search results page; otherwise the small autocomplete dropdown.
async function search(user, query, { full = false } = {}) {
  const q = String(query || "").trim();
  const empty = { posts: [], users: [], albums: [], hashtags: [] };
  if (!q) return empty;
  if (q.length > 80) throw badRequest("Search is too long.");
  const bare = q.replace(/^#/, "");
  if (!bare) return empty;
  const n = full ? 20 : 4;
  const [postRows, userRows, albumRows, tagRows] = await Promise.all([
    posts.search(q, full ? 20 : 6),
    users.search(bare, n),
    albums.search(bare, n),
    posts.searchHashtags(bare, n),
  ]);
  return {
    posts: await presentPosts(postRows, user),
    users: userRows.map(publicUser),
    albums: await presentAlbums(albumRows),
    hashtags: tagRows.map((t) => ({ tag: t._id, count: t.count })),
  };
}

module.exports = { feed, trending, search };
