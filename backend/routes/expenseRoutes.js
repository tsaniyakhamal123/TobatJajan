import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addExpense, getMyExpenses, updateExpense, } from "../controllers/expenseController.js";

const router = express.Router();

router.post("/", protect, addExpense);
router.get("/", protect, getMyExpenses);
router.put("/:id", protect, updateExpense);

export default router;
