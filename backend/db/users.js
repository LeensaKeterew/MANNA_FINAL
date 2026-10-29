const { getDb } = require("./connection");
const { oid, escapeRegex } = require("./util");

const col = () => getDb().collection("users");

const DEFAULT_SETTINGS = {
  privateAccount: false,
  showLocation: true,
  allowTagging: true,
  showEmail: false,
  notifyComments: true,
  notifyFollowers: true,
};

async function create({ username, email, password, name, avatar = "", bio = "", role = "user" }) {
  const doc = {
    username,
    usernameLower: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    name: name || username,
    avatar,
    bio,
    role,
    settings: { ...DEFAULT_SETTINGS },
    createdAt: new Date(),
  };
  const result = await col().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

async function findById(id) {
  const _id = oid(id);
  return _id ? col().findOne({ _id }) : null;
}

async function findByIds(ids) {
  const list = ids.map(oid).filter(Boolean);
  return list.length ? col().find({ _id: { $in: list } }).toArray() : [];
}

async function findByLogin(identifier) {
  const v = String(identifier).trim().toLowerCase();
  return col().findOne({ $or: [{ usernameLower: v }, { email: v }] });
}

const findByUsername = (username) => col().findOne({ usernameLower: String(username).toLowerCase() });
const findByEmail = (email) => col().findOne({ email: String(email).toLowerCase() });

async function updateById(id, fields) {
  const _id = oid(id);
  if (!_id) return null;
  const update = { $set: fields };
  // Setting a plain password retires any legacy bcrypt hash on the account.
  if ("password" in fields) update.$unset = { passwordHash: "" };
  return col().findOneAndUpdate({ _id }, update, { returnDocument: "after" });
}

async function deleteById(id) {
  const _id = oid(id);
  if (!_id) return false;
  const r = await col().deleteOne({ _id });
  return r.deletedCount === 1;
}

async function list({ limit = 200 } = {}) {
  return col().find({}).sort({ createdAt: -1 }).limit(limit).toArray();
}

async function search(q, limit = 5) {
  const rx = new RegExp(escapeRegex(q), "i");
  return col().find({ $or: [{ username: rx }, { name: rx }, { email: rx }] }).limit(limit).toArray();
}

const countAdmins = () => col().countDocuments({ role: "admin" });

module.exports = {
  DEFAULT_SETTINGS, create, findById, findByIds, findByLogin, findByUsername, findByEmail,
  updateById, deleteById, list, search, countAdmins,
};
