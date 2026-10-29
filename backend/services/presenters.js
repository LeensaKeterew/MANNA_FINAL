const users = require("../db/users");
const comments = require("../db/comments");
const posts = require("../db/posts");
const reports = require("../db/reports");

// A post with more than this many open reports is hidden behind a warning in feeds.
const HIDE_AFTER_REPORTS = 2;

const DEFAULT_AVATAR = "/default-avatar.svg";
const COVER_FALLBACK = "/logo.png";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

function publicUser(u) {
  if (!u) {
    return { id: null, username: "deleted", name: "Deleted user", avatar: DEFAULT_AVATAR, role: "user" };
  }
  return {
    id: u._id.toString(),
    username: u.username,
    name: u.name || u.username,
    avatar: u.avatar || DEFAULT_AVATAR,
    role: u.role,
    createdAt: u.createdAt,
  };
}

// publicUser is what every visitor may see (name and picture). The bio is private.
const profileUser = (u) => ({
  ...publicUser(u),
  bio: u?.bio || "",
  pronouns: u?.pronouns || "",
  socialLinks: u?.socialLinks || [],
});

const selfUser = (u) => ({
  ...profileUser(u),
  email: u.email,
  settings: { ...users.DEFAULT_SETTINGS, ...(u.settings || {}) },
});

async function userMap(ids) {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  const rows = await users.findByIds(unique);
  return Object.fromEntries(rows.map((u) => [u._id.toString(), u]));
}

async function presentPosts(rows, viewer) {
  if (!rows.length) return [];
  const [authors, counts, reportCounts] = await Promise.all([
    userMap(rows.map((p) => p.authorId)),
    comments.countsByPosts(rows.map((p) => p._id)),
    reports.openCountsByPosts(rows.map((p) => p._id)),
  ]);
  // The latest two comments of every post, oldest first, for the preview on feed cards.
  const latest = await comments.latestByPosts(rows.map((p) => p._id), 2);
  const previewRows = Object.values(latest).flat();
  const previewById = Object.fromEntries((await presentComments(previewRows)).map((c) => [c.id, c]));
  const viewerId = viewer ? viewer._id.toString() : null;
  return rows.map((p) => ({
    id: p._id.toString(),
    authorId: p.authorId.toString(),
    author: publicUser(authors[p.authorId.toString()]),
    title: p.title,
    text: p.text,
    image: p.image,
    verse: { text: p.verse?.text || "", reference: p.verse?.reference || "" },
    hashtags: p.hashtags || [],
    likes: (p.likes || []).length,
    likedByMe: viewerId ? (p.likes || []).some((l) => l.toString() === viewerId) : false,
    commentCount: counts[p._id.toString()] || 0,
    commentPreview: (latest[p._id.toString()] || []).map((c) => previewById[c._id.toString()]),
    reportCount: reportCounts[p._id.toString()] || 0,
    hidden: (reportCounts[p._id.toString()] || 0) > HIDE_AFTER_REPORTS,
    createdAt: p.createdAt,
    date: formatDate(p.createdAt),
  }));
}

async function presentComments(rows) {
  const authors = await userMap(rows.map((c) => c.authorId));
  return rows.map((c) => ({
    id: c._id.toString(),
    postId: c.postId.toString(),
    authorId: c.authorId.toString(),
    author: publicUser(authors[c.authorId.toString()]),
    text: c.text,
    createdAt: c.createdAt,
    edited: Boolean(c.editedAt),
  }));
}

// Albums carry a cover (first existing post image) and a post count.
async function presentAlbums(rows) {
  if (!rows.length) return [];
  const allIds = rows.flatMap((a) => a.postIds);
  const [postRows, owners] = await Promise.all([posts.findByIds(allIds), userMap(rows.map((a) => a.ownerId))]);
  const byId = Object.fromEntries(postRows.map((p) => [p._id.toString(), p]));
  return rows.map((a) => {
    const existing = a.postIds.map((id) => byId[id.toString()]).filter(Boolean);
    return {
      id: a._id.toString(),
      ownerId: a.ownerId.toString(),
      owner: publicUser(owners[a.ownerId.toString()]),
      name: a.name,
      description: a.description || "",
      hashtags: a.hashtags || [],
      cover: existing[0]?.image || COVER_FALLBACK,
      postCount: existing.length,
      postIds: existing.map((p) => p._id.toString()),
      createdAt: a.createdAt,
    };
  });
}

module.exports = { DEFAULT_AVATAR, formatDate, publicUser, profileUser, selfUser, userMap, presentPosts, presentComments, presentAlbums };
