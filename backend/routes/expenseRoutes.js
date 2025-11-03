import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addExpense, getMyExpenses, updateExpense, deleteExpense } from "../controllers/expenseController.js";

const router = express.Router();

router.post("/", protect, addExpense);
router.get("/", protect, getMyExpenses);
router.put("/:id", protect, updateExpense);
router.delete("/:id", protect, deleteExpense);

export default router;
