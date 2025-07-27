import { Router } from "express";
import { signup, signin } from "../controllers/auth.controller.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = Router();

router.post("/signup", signup);
router.post("/signin", signin);

// Példa védett végpont
router.get("/profile", verifyToken, (req, res) => {
  res.json({ msg: `Üdv, ${req.user.email}!`, id: req.user.id });
});

export default router;
