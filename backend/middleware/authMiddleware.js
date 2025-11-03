import jwt from "jsonwebtoken";
import User from "../models/User.js";

// middleware untuk proteksi route
export const protect = async (req, res, next) => {
  let token;

  try {
    // cek apakah token dikirim di header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      // verifikasi token pakai secret dari .env
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ambil user dari database tanpa password
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      next(); // lanjut ke controller berikutnya
    } else {
      return res.status(401).json({ message: "Not authorized, no token" });
    }
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};
