const { getDb } = require("./connection");

const col = () => getDb().collection("messages");

async function create({ fromId, toId, text }) {
  const doc = { fromId, toId, text, createdAt: new Date() };
  const r = await col().insertOne(doc);
  return { ...doc, _id: r.insertedId };
}

async function thread(a, b, limit = 200) {
  const rows = await col()
    .find({ $or: [{ fromId: a, toId: b }, { fromId: b, toId: a }] })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return rows.reverse();
}

async function lastBetween(a, b) {
  return col().findOne(
    { $or: [{ fromId: a, toId: b }, { fromId: b, toId: a }] },
    { sort: { createdAt: -1 } }
  );
}

const deleteAllFor = (userId) => col().deleteMany({ $or: [{ fromId: userId }, { toId: userId }] });

module.exports = { create, thread, lastBetween, deleteAllFor };
