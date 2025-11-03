import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addIncome } from "../controllers/userController.js";

const router = express.Router();

router.post("/add-income", protect, addIncome);

export default router;
