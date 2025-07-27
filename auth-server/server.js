import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./app/config/db.config.js";
import authRoutes from "./app/routes/auth.routes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);      // URL-alap

app.get("/", (_, res) => res.send("Auth API OK"));

const PORT = process.env.PORT || 8080;
(async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`🚀 Szerver fut: http://localhost:${PORT}`));
})();
