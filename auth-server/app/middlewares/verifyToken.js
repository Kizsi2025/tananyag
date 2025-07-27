import jwt from "jsonwebtoken";
import cfg from "../config/auth.config.js";

export default function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "Nincs token" });

  try {
    req.user = jwt.verify(token, cfg.secret); // payload -> req.user
    next();
  } catch {
    return res.status(403).json({ msg: "Érvénytelen vagy lejárt token" });
  }
}
