import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { updateFinancialProfile, handleGetUserStats, getUserHistory,updateExpense, updateIncome, deleteIncome, deleteExpense } from "../controllers/userController.js";

const router = express.Router();

//router.post("/add-income", protect, addIncome);
//router.get("/me", protect, getUserProfile);
//router.put("/goal", protect, updateUserGoal);
router.put("/update", protect, updateFinancialProfile);
router.get("/getStatus", protect, handleGetUserStats);
router.get("/history", protect, getUserHistory);
router.patch("/updateIncome/:id", protect, updateIncome);
router.patch("/updateExpense/:id", protect, updateExpense);
router.delete("/deleteIncome/:id", protect, deleteIncome);
router.delete("/deleteExpense/:id", protect, deleteExpense);

export default router;


