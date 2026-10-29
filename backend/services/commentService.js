const comments = require("../db/comments");
const v = require("../utils/validate");
const { notFound } = require("../utils/errors");
const { assertOwnerOrAdmin } = require("./permissions");
const { presentComments } = require("./presenters");
const postService = require("./postService");

async function list(postId) {
  const post = await postService.load(postId);
  return presentComments(await comments.listByPost(post._id));
}

async function add(postId, user, body = {}) {
  const post = await postService.load(postId);
  const text = v.text(body.text, { field: "Comment", required: true, max: 500 });
  const created = await comments.create({ postId: post._id, authorId: user._id, text });
  return (await presentComments([created]))[0];
}

async function update(id, user, body = {}) {
  const comment = await comments.findById(id);
  if (!comment) throw notFound("Comment not found.");
  assertOwnerOrAdmin(user, comment.authorId);
  const text = v.text(body.text, { field: "Comment", required: true, max: 500 });
  const updated = await comments.updateText(comment._id, text);
  return (await presentComments([updated]))[0];
}

async function remove(id, user) {
  const comment = await comments.findById(id);
  if (!comment) throw notFound("Comment not found.");
  assertOwnerOrAdmin(user, comment.authorId);
  await comments.deleteById(comment._id);
}

module.exports = { list, add, update, remove };
