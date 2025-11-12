import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addIncome, getUserProfile, updateUserGoal, updateFinancialProfile } from "../controllers/userController.js";

const router = express.Router();

router.post("/add-income", protect, addIncome);
router.get("/me", protect, getUserProfile);
router.put("/goal", protect, updateUserGoal);
router.put("/update", protect, updateFinancialProfile);

export default router;


