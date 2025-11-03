import express from "express";
import { generateAdvice } from "../controllers/aiController.js";
const router = express.Router();

router.post("/advice", generateAdvice);

export default router;
