import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addIncome, getUserIncome } from "../controllers/incomeController.js";

const router = express.Router();

router.post("/", protect, addIncome);
router.get("/", protect, getUserIncome);

export default router;
