import Expense from "../models/Expense.js";
import User from "../models/User.js";
import { updateGamification } from "../services/expenseLogic.js";

import { runAIMicroGamificationEvent } from "./aiController.js";

 /* 💸 CATAT KEUANGAN (EXPENSE)
 * Ini akan user.balance -= amount
 */
export const addExpense = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.aiInsights?.xpRules) {
      return res.status(400).json({
        message: "Gamifikasi belum siap. Coba lagi sebentar."
      });
    }

    const { amount, description, category } = req.body;

    const expense = new Expense({
      userId: user.id,
      amount,
      description,
      category,
    });

    await expense.save();

    user.balance -= amount;

    const ai = await runAIMicroGamificationEvent(user, "expense", expense);

    user.xp += ai.xpAdjustment;
    user.streak += ai.streakEffect;
    user.level = Math.floor(user.xp / 100) + 1;
    user.aiInsights.lastAdvice = ai.advice;
    await user.save();
    res.status(201).json({
      message: "Pengeluaran berhasil dicatat!",
      newExpense: expense,
      balance: user.balance,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      ai,
    });

  } catch (err) {
    res.status(500).json({ message: "Gagal mencatat pengeluaran", error: err.message });
  }
};


// GET semua pengeluaran milik user
export const getMyExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data pengeluaran", error: err.message });
  }
};

// Update pengeluaran
export const updateExpense = async (req, res) => {
  const { id } = req.params;
  const { category, amount, description } = req.body;

  try {
    const expense = await Expense.findOne({ _id: id, userId: req.user._id });

    if (!expense) {
      return res.status(404).json({ message: "Data pengeluaran tidak ditemukan 😢" });
    }
    expense.category = category || expense.category;
    expense.amount = amount || expense.amount;
    expense.description = description || expense.description;

    await expense.save();
    const gamify = await updateGamification(req.user._id, expense);
    res.status(200).json({
      message: "Pengeluaran berhasil diperbarui ✨",
      updatedExpense: expense,
      xpChange: gamify.xpChange,
      newLevel: gamify.newLevel,
      newStreak: gamify.newStreak,
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal memperbarui pengeluaran", error: err.message });
  }
};

