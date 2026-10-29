const { getDb } = require("./connection");
const { oid, escapeRegex } = require("./util");

const col = () => getDb().collection("posts");

async function create(doc) {
  const full = { ...doc, likes: [], createdAt: new Date() };
  const r = await col().insertOne(full);
  return { ...full, _id: r.insertedId };
}

async function findById(id) {
  const _id = oid(id);
  return _id ? col().findOne({ _id }) : null;
}

async function findByIds(ids) {
  const list = ids.map(oid).filter(Boolean);
  return list.length ? col().find({ _id: { $in: list } }).toArray() : [];
}

// authorIds === null -> every author. Newest first.
async function list({ authorIds = null, tag = null, limit = 50, skip = 0 } = {}) {
  const filter = {};
  if (authorIds) filter.authorId = { $in: authorIds };
  if (tag) filter.hashtags = { $regex: `^${escapeRegex(tag)}$`, $options: "i" };
  return col().find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
}

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

async function setLike(id, userId, liked) {
  const _id = oid(id);
  if (!_id) return null;
  const update = liked ? { $addToSet: { likes: userId } } : { $pull: { likes: userId } };
  return col().findOneAndUpdate({ _id }, update, { returnDocument: "after" });
}

const idsByAuthor = async (authorId) =>
  (await col().find({ authorId }, { projection: { _id: 1 } }).toArray()).map((p) => p._id);

const deleteByAuthor = (authorId) => col().deleteMany({ authorId });

const pullLikesBy = (userId) => col().updateMany({ likes: userId }, { $pull: { likes: userId } });

async function search(q, limit = 6) {
  const rx = new RegExp(escapeRegex(q), "i");
  return col()
    .find({ $or: [{ title: rx }, { text: rx }, { hashtags: rx }, { "verse.reference": rx }, { "verse.text": rx }] })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

// Distinct hashtags containing q, most used first.
async function searchHashtags(q, limit = 6) {
  const rx = new RegExp(escapeRegex(q), "i");
  return col()
    .aggregate([
      { $unwind: "$hashtags" },
      { $match: { hashtags: rx } },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: limit },
    ])
    .toArray();
}

async function topHashtags(authorIds = null, limit = 10) {
  const match = authorIds ? { authorId: { $in: authorIds } } : {};
  return col()
    .aggregate([
      { $match: match },
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: limit },
    ])
    .toArray();
}

const countByAuthor = (authorId) => col().countDocuments({ authorId });

module.exports = {
  create, findById, findByIds, list, updateById, deleteById, setLike, idsByAuthor,
  deleteByAuthor, pullLikesBy, search, searchHashtags, topHashtags, countByAuthor,
};
