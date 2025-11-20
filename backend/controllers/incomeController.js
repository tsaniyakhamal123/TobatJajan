import Income from "../models/Income.js";
import User from "../models/User.js";
import { runAIMicroGamificationEvent } from "./aiController.js";

/**
 * MENCATAT PEMASUKAN (INCOME)
 * Ini akan user.balance += amount
 * 'set nilai awal' balance
 */
export const addIncome = async (req, res) => {
  try {
    const { amount, description, source } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.aiInsights?.xpRules) {
      return res.status(400).json({ message: "Gamifikasi belum siap." });
    }

    const income = new Income({
      userId: user.id,
      amount,
      description,
      source,
    });

    await income.save();

    user.balance += amount;
    const ai = await runAIMicroGamificationEvent(user, "income", income);
    user.xp += ai.xpAdjustment;
    user.streak += ai.streakEffect;
    user.level = Math.floor(user.xp / 100) + 1;
    user.aiInsights.lastAdvice = ai.advice;

    await user.save();

    res.status(201).json({
      message: "Pemasukan berhasil dicatat!",
      newIncome: income,
      balance: user.balance,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      ai,
    });

  } catch (err) {
    res.status(500).json({ message: "Gagal mencatat pemasukan", error: err.message });
  }
}

// GET semua income user
export const getUserIncome = async (req, res) => {
  try {
    const income = await Income.find({ userId: req.user._id }).sort({ date: -1 });
    res.status(200).json(income);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data pemasukan", error: err.message });
  }
};
