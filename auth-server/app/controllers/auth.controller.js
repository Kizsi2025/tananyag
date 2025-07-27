import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import cfg from "../config/auth.config.js";

export async function signup(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ msg: "Hiányzó mezők" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ msg: "E-mail foglalt" });

    const newUser = await User.create({ email, password });
    return res.status(201).json({ msg: "Regisztráció sikeres" });
  } catch (err) {
    return res.status(500).json({ msg: "Szerverhiba" });
  }
}

export async function signin(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePass(password)))
      return res.status(401).json({ msg: "Hibás adatok" });

    // Token generálás[11][17]
    const token = jwt.sign({ id: user._id, email: user.email }, cfg.secret, {
      expiresIn: cfg.expires,
    });

    return res.json({ token, email: user.email });
  } catch {
    return res.status(500).json({ msg: "Szerverhiba" });
  }
}
