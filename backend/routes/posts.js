const router = require("express").Router();
const { asyncHandler } = require("../utils/errors");
const { requireAuth } = require("../middleware/auth");
const postService = require("../services/postService");
const commentService = require("../services/commentService");
const reportService = require("../services/reportService");

router.use(requireAuth);

router.get("/", asyncHandler(async (req, res) => {
  res.json({ ok: true, posts: await postService.list(req.user, req.query) });
}));

router.post("/", asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, post: await postService.create(req.user, req.body) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await postService.get(req.params.id, req.user)) });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  res.json({ ok: true, post: await postService.update(req.params.id, req.user, req.body) });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await postService.remove(req.params.id, req.user);
  res.json({ ok: true });
}));

router.post("/:id/like", asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await postService.setLike(req.params.id, req.user, true)) });
}));

router.delete("/:id/like", asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await postService.setLike(req.params.id, req.user, false)) });
}));

router.get("/:id/comments", asyncHandler(async (req, res) => {
  res.json({ ok: true, comments: await commentService.list(req.params.id) });
}));

router.post("/:id/comments", asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, comment: await commentService.add(req.params.id, req.user, req.body) });
}));

router.post("/:id/report", asyncHandler(async (req, res) => {
  await reportService.reportPost(req.user, req.params.id, req.body);
  res.status(201).json({ ok: true });
}));

module.exports = router;
