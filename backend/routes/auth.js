const router = require("express").Router();
const { asyncHandler } = require("../utils/errors");
const { setAuthCookie, clearAuthCookie } = require("../middleware/auth");
const userService = require("../services/userService");
const { selfUser } = require("../services/presenters");

router.post("/signup", asyncHandler(async (req, res) => {
  const user = await userService.signUp(req.body);
  setAuthCookie(res, user); // registering signs the user in straight away
  res.status(201).json({ ok: true, user: selfUser(user) });
}));

const signin = asyncHandler(async (req, res) => {
  const user = await userService.signIn(req.body);
  setAuthCookie(res, user);
  res.json({ ok: true, user: selfUser(user) });
});
router.post("/signin", signin);
router.post("/login", signin);

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// Always 200 so the browser console stays clean when nobody is logged in.
router.get("/me", (req, res) => {
  res.json({ ok: true, user: req.user ? selfUser(req.user) : null });
});

module.exports = router;
