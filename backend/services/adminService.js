const users = require("../db/users");
const posts = require("../db/posts");
const albums = require("../db/albums");
const comments = require("../db/comments");
const { badRequest, notFound } = require("../utils/errors");
const { selfUser, presentPosts, presentAlbums, presentComments, userMap, publicUser } = require("./presenters");
const userService = require("./userService");

async function listUsers() {
  const rows = await users.list();
  return rows.map(selfUser);
}

async function updateUser(admin, id, body) {
  const target = await users.findById(id);
  if (!target) throw notFound("User not found.");
  if (body.role === "user" && target.role === "admin" && (await users.countAdmins()) <= 1) {
    throw badRequest("There must be at least one administrator.");
  }
  return selfUser(await userService.updateUser(target, body, { allowRole: true }));
}

async function deleteUser(admin, id) {
  const target = await users.findById(id);
  if (!target) throw notFound("User not found.");
  if (target._id.equals(admin._id)) throw badRequest("Use Settings to delete your own account.");
  if (target.role === "admin" && (await users.countAdmins()) <= 1) {
    throw badRequest("There must be at least one administrator.");
  }
  await userService.deleteUser(target._id);
}

const listPosts = async (admin) => presentPosts(await posts.list({ limit: 200 }), admin);
const listAlbums = async () => presentAlbums(await albums.listAll());

async function listComments() {
  const rows = await comments.listRecent(200);
  const [presented, postRows] = await Promise.all([presentComments(rows), posts.findByIds(rows.map((c) => c.postId))]);
  const titles = Object.fromEntries(postRows.map((p) => [p._id.toString(), p.title]));
  return presented.map((c) => ({ ...c, postTitle: titles[c.postId] || "Deleted post" }));
}

// Recent posts, albums and comments merged into one newest-first stream.
async function activity() {
  const [postRows, albumRows, commentRows] = await Promise.all([
    posts.list({ limit: 30 }),
    albums.listAll(30),
    comments.listRecent(30),
  ]);
  const people = await userMap([
    ...postRows.map((p) => p.authorId),
    ...albumRows.map((a) => a.ownerId),
    ...commentRows.map((c) => c.authorId),
  ]);
  const actor = (id) => publicUser(people[id.toString()]);
  const events = [
    ...postRows.map((p) => ({ type: "post", id: p._id.toString(), actor: actor(p.authorId), summary: p.title, createdAt: p.createdAt })),
    ...albumRows.map((a) => ({ type: "album", id: a._id.toString(), actor: actor(a.ownerId), summary: a.name, createdAt: a.createdAt })),
    ...commentRows.map((c) => ({ type: "comment", id: c._id.toString(), actor: actor(c.authorId), summary: c.text, createdAt: c.createdAt })),
  ];
  return events.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 40);
}

module.exports = { listUsers, updateUser, deleteUser, listPosts, listAlbums, listComments, activity };
