const { getDb } = require("./connection");
const { oid } = require("./util");

const col = () => getDb().collection("reportReasons");

async function create({ name, description = "" }) {
  const doc = { name, nameLower: name.toLowerCase(), description, createdAt: new Date() };
  const r = await col().insertOne(doc);
  return { ...doc, _id: r.insertedId };
}

const list = () => col().find({}).sort({ createdAt: 1 }).toArray();
const findByName = (name) => col().findOne({ nameLower: String(name).toLowerCase() });

async function findById(id) {
  const _id = oid(id);
  return _id ? col().findOne({ _id }) : null;
}

async function findByIds(ids) {
  const list_ = ids.map(oid).filter(Boolean);
  return list_.length ? col().find({ _id: { $in: list_ } }).toArray() : [];
}

module.exports = { create, list, findByName, findById, findByIds };
