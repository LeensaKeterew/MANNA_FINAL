const router = require("express").Router();
const { asyncHandler } = require("../utils/errors");
const { requireAuth } = require("../middleware/auth");
const commentService = require("../services/commentService");

router.put("/:id", requireAuth, asyncHandler(async (req, res) => {
  res.json({ ok: true, comment: await commentService.update(req.params.id, req.user, req.body) });
}));

router.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  await commentService.remove(req.params.id, req.user);
  res.json({ ok: true });
}));

module.exports = router;
