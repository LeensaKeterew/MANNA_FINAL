const { getDb } = require("./connection");
const { oid, escapeRegex } = require("./util");

const col = () => getDb().collection("albums");

async function create({ ownerId, name, description, hashtags }) {
  const doc = { ownerId, name, description, hashtags, postIds: [], createdAt: new Date() };
  const r = await col().insertOne(doc);
  return { ...doc, _id: r.insertedId };
}

async function findById(id) {
  const _id = oid(id);
  return _id ? col().findOne({ _id }) : null;
}

async function findByIds(ids) {
  const list = ids.map(oid).filter(Boolean);
  return list.length ? col().find({ _id: { $in: list } }).toArray() : [];
}

const listByOwner = (ownerId, { skip = 0, limit = 0 } = {}) =>
  col().find({ ownerId }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
const countByOwner = (ownerId) => col().countDocuments({ ownerId });

async function search(q, limit = 6) {
  const rx = new RegExp(escapeRegex(q), "i");
  return col().find({ $or: [{ name: rx }, { description: rx }] }).sort({ createdAt: -1 }).limit(limit).toArray();
}

const listAll = (limit = 200) => col().find({}).sort({ createdAt: -1 }).limit(limit).toArray();
// Every album that contains the post (a post can be in several albums), oldest first.
const findByPost = (postId) => col().find({ postIds: postId }).sort({ createdAt: 1 }).toArray();

// Albums whose ONLY post is one of the given posts (exactly one post in total).
// Albums that were already empty don't match, so they are never picked up here.
const findOnlyContaining = (postIds) =>
  postIds.length ? col().find({ postIds: { $size: 1, $in: postIds } }).toArray() : Promise.resolve([]);

async function updateById(id, fields) {
  const _id = oid(id);
  if (!_id) return null;
  return col().findOneAndUpdate({ _id }, { $set: fields }, { returnDocument: "after" });
}

async function deleteById(id) {
  const _id = oid(id);
  if (!_id) return false;
  const r = await col().deleteOne({ _id });
  return r.deletedCount === 1;
}

const addPost = (id, postId) =>
  col().findOneAndUpdate({ _id: oid(id) }, { $addToSet: { postIds: postId } }, { returnDocument: "after" });

const removePost = (id, postId) =>
  col().findOneAndUpdate({ _id: oid(id) }, { $pull: { postIds: postId } }, { returnDocument: "after" });

const pullPostFromAll = (postId) => col().updateMany({ postIds: postId }, { $pull: { postIds: postId } });
const deleteByOwner = (ownerId) => col().deleteMany({ ownerId });

module.exports = {
  create, findById, findByIds, listByOwner, countByOwner, search, listAll, findByPost, findOnlyContaining, updateById, deleteById,
  addPost, removePost, pullPostFromAll, deleteByOwner,
};
