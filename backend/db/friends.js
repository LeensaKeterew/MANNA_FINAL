const { getDb } = require("./connection");

const col = () => getDb().collection("friends");

const pair = (a, b) => ({
  $or: [
    { requester: a, recipient: b },
    { requester: b, recipient: a },
  ],
});

const between = (a, b) => col().findOne(pair(a, b));

async function request(from, to) {
  const doc = { requester: from, recipient: to, status: "pending", createdAt: new Date() };
  await col().insertOne(doc);
  return doc;
}

async function accept(requester, recipient) {
  const r = await col().updateOne(
    { requester, recipient, status: "pending" },
    { $set: { status: "accepted", respondedAt: new Date() } }
  );
  return r.matchedCount === 1;
}

async function removeBetween(a, b) {
  const r = await col().deleteOne(pair(a, b));
  return r.deletedCount === 1;
}

async function friendIds(userId) {
  const rows = await col()
    .find({ status: "accepted", $or: [{ requester: userId }, { recipient: userId }] })
    .toArray();
  return rows.map((r) => (r.requester.equals(userId) ? r.recipient : r.requester));
}

const incoming = (userId) =>
  col().find({ recipient: userId, status: "pending" }).sort({ createdAt: -1 }).toArray();

const outgoing = (userId) =>
  col().find({ requester: userId, status: "pending" }).sort({ createdAt: -1 }).toArray();

const deleteAllFor = (userId) =>
  col().deleteMany({ $or: [{ requester: userId }, { recipient: userId }] });

module.exports = { between, request, accept, removeBetween, friendIds, incoming, outgoing, deleteAllFor };
