import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {initializeGamification, monthlyEvaluation,} from "../controllers/aiController.js";
const router = express.Router();

// User setup awal: income, goal → AI hitung XP rule
router.post("/init", protect, initializeGamification);
// Generate advice manual (klik tombol)
//router.get("/advice", protect, generateAdvice);
// Akhir bulan: AI review progress & update XP rules baru
router.post("/review", protect, monthlyEvaluation);

export default router;
