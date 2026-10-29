const { getDb } = require("./connection");

const col = () => getDb().collection("activities");

// Photos added to the same album within this window are shown as one "added N photos" item.
const BATCH_WINDOW_MS = 30 * 60 * 1000;

const logPost = (actorId, postId) => col().insertOne({ type: "post", actorId, postId, createdAt: new Date() });
const logAlbum = (actorId, albumId) => col().insertOne({ type: "album", actorId, albumId, createdAt: new Date() });

async function logAlbumPhoto(actorId, albumId, postId) {
  const merged = await col().findOneAndUpdate(
    { type: "album_photos", actorId, albumId, createdAt: { $gte: new Date(Date.now() - BATCH_WINDOW_MS) } },
    { $addToSet: { postIds: postId }, $set: { createdAt: new Date() } },
    { sort: { createdAt: -1 } }
  );
  if (!merged) await col().insertOne({ type: "album_photos", actorId, albumId, postIds: [postId], createdAt: new Date() });
}

// actorIds === null -> everyone. Newest first.
const list = ({ actorIds = null, limit = 50 } = {}) =>
  col().find(actorIds ? { actorId: { $in: actorIds } } : {}).sort({ createdAt: -1 }).limit(limit).toArray();

// Removes a photo from "added photos" items (all albums, or just one); empty items disappear.
async function pullPhoto(postId, albumId = null) {
  await col().updateMany(
    { type: "album_photos", postIds: postId, ...(albumId ? { albumId } : {}) },
    { $pull: { postIds: postId } }
  );
  await col().deleteMany({ type: "album_photos", postIds: { $size: 0 } });
}

async function removePost(postId) {
  await col().deleteMany({ type: "post", postId });
  await pullPhoto(postId);
}

const removePosts = async (postIds) => {
  for (const id of postIds) await removePost(id);
};
const removeAlbum = (albumId) => col().deleteMany({ albumId });
const removeByActor = (actorId) => col().deleteMany({ actorId });

module.exports = {
  logPost, logAlbum, logAlbumPhoto, list, pullPhoto, removePost, removePosts, removeAlbum, removeByActor,
};
