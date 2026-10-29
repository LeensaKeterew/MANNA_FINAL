const { getDb } = require("./connection");
const { oid } = require("./util");

const col = () => getDb().collection("reports");

async function create({ postId, reporterId, reasonId, details }) {
  const doc = { postId, reporterId, reasonId, details, status: "open", createdAt: new Date() };
  const r = await col().insertOne(doc);
  return { ...doc, _id: r.insertedId };
}

async function list(status = null) {
  return col().find(status ? { status } : {}).sort({ createdAt: -1 }).toArray();
}

async function findById(id) {
  const _id = oid(id);
  return _id ? col().findOne({ _id }) : null;
}

async function resolve(id, adminId, note = "") {
  const _id = oid(id);
  if (!_id) return null;
  return col().findOneAndUpdate(
    { _id },
    { $set: { status: "resolved", resolvedAt: new Date(), resolvedBy: adminId, resolutionNote: note } },
    { returnDocument: "after" }
  );
}

// Only open reports count, so an admin resolving them brings the post back.
async function openCountsByPosts(postIds) {
  if (!postIds.length) return {};
  const rows = await col()
    .aggregate([{ $match: { postId: { $in: postIds }, status: "open" } }, { $group: { _id: "$postId", n: { $sum: 1 } } }])
    .toArray();
  return Object.fromEntries(rows.map((r) => [r._id.toString(), r.n]));
}

async function resolveByPost(postId, adminId, note = "") {
  const _id = oid(postId);
  if (!_id) return 0;
  const r = await col().updateMany(
    { postId: _id, status: "open" },
    { $set: { status: "resolved", resolvedAt: new Date(), resolvedBy: adminId, resolutionNote: note } }
  );
  return r.modifiedCount;
}

const deleteByPost = (postId) => col().deleteMany({ postId });
const deleteByPosts = (postIds) => (postIds.length ? col().deleteMany({ postId: { $in: postIds } }) : null);
const deleteByReporter = (reporterId) => col().deleteMany({ reporterId });

module.exports = { create, list, findById, resolve, openCountsByPosts, resolveByPost, deleteByPost, deleteByPosts, deleteByReporter };
