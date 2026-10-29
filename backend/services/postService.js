const posts = require("../db/posts");
const albums = require("../db/albums");
const activities = require("../db/activities");
const v = require("../utils/validate");
const { badRequest, notFound } = require("../utils/errors");
const { assertOwnerOrAdmin } = require("./permissions");
const { presentPosts } = require("./presenters");
const cascade = require("./cascade");

async function load(id) {
  const post = await posts.findById(id);
  if (!post) throw notFound("Post not found.");
  return post;
}

async function create(user, body = {}) {
  const doc = {
    authorId: user._id,
    title: v.text(body.title, { field: "Title", required: true, max: 120 }),
    text: v.text(body.text, { field: "Description", required: true, max: 2000 }),
    image: v.imageRef(body.image, { field: "Image", required: true }),
    verse: {
      text: v.text(body.verse?.text, { field: "Verse", max: 400 }),
      reference: v.text(body.verse?.reference, { field: "Verse reference", max: 60 }),
    },
    hashtags: v.hashtags(body.hashtags),
  };
  const created = await posts.create(doc);
  await activities.logPost(user._id, created._id);
  return (await presentPosts([created], user))[0];
}

async function get(id, viewer) {
  const post = await load(id);
  const [presented] = await presentPosts([post], viewer);
  const containing = await albums.findByPost(post._id);
  return { post: presented, albums: containing.map((a) => ({ id: a._id.toString(), name: a.name })) };
}

async function update(id, user, body = {}) {
  const post = await load(id);
  assertOwnerOrAdmin(user, post.authorId);
  const fields = {};
  if (body.title !== undefined) fields.title = v.text(body.title, { field: "Title", required: true, max: 120 });
  if (body.text !== undefined) fields.text = v.text(body.text, { field: "Description", required: true, max: 2000 });
  // The image cannot be replaced once a post exists; owners edit the text, verse and hashtags only.
  if (body.hashtags !== undefined) fields.hashtags = v.hashtags(body.hashtags);
  if (body.verse !== undefined) {
    fields.verse = {
      text: v.text(body.verse?.text, { field: "Verse", max: 400 }),
      reference: v.text(body.verse?.reference, { field: "Verse reference", max: 60 }),
    };
  }
  if (!Object.keys(fields).length) throw badRequest("Nothing to update.");
  const updated = await posts.updateById(post._id, fields);
  return (await presentPosts([updated], user))[0];
}

async function remove(id, user) {
  const post = await load(id);
  assertOwnerOrAdmin(user, post.authorId);
  await cascade.deletePost(post._id);
}

async function setLike(id, user, liked) {
  await load(id);
  const updated = await posts.setLike(id, user._id, liked);
  return { likes: updated.likes.length, likedByMe: liked };
}

async function list(user, { tag, limit }) {
  const rows = await posts.list({ tag: tag || null, limit: Math.min(Number(limit) || 50, 100) });
  return presentPosts(rows, user);
}

module.exports = { create, get, update, remove, setLike, list, load };
