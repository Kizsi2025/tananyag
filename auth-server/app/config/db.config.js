import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB kapcsolat él");
  } catch (err) {
    console.error("❌ MongoDB-hiba:", err.message);
    process.exit(1);
  }
};
