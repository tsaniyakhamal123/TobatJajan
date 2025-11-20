import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {runGamificationInitialization, monthlyEvaluation, chatWithFinancialAi,} from "../controllers/aiController.js";
const router = express.Router();

// User setup awal: income, goal → AI hitung XP rule
router.post("/init", protect, runGamificationInitialization);
// Generate advice manual (klik tombol)
//router.get("/advice", protect, generateAdvice);
// Akhir bulan: AI review progress & update XP rules baru
router.get("/review", protect, monthlyEvaluation);
router.post("/chat", protect, chatWithFinancialAi);
export default router;
