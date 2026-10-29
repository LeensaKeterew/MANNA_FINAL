const router = require("express").Router();
const { asyncHandler } = require("../utils/errors");
const { requireAuth } = require("../middleware/auth");
const albumService = require("../services/albumService");

router.use(requireAuth);

router.post("/", asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, album: await albumService.create(req.user, req.body) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  res.json({ ok: true, album: await albumService.get(req.params.id, req.user) });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  res.json({ ok: true, album: await albumService.update(req.params.id, req.user, req.body) });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await albumService.remove(req.params.id, req.user);
  res.json({ ok: true });
}));

router.post("/:id/posts", asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, album: await albumService.addPost(req.params.id, req.user, req.body?.postId) });
}));

router.delete("/:id/posts/:postId", asyncHandler(async (req, res) => {
  res.json({ ok: true, album: await albumService.removePost(req.params.id, req.user, req.params.postId) });
}));

module.exports = router;
