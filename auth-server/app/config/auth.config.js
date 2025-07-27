import dotenv from "dotenv";
dotenv.config();

export default {
  secret: process.env.JWT_SECRET,
  expires: process.env.JWT_EXPIRES || "1d",
};
