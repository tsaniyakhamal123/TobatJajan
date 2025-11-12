import Expense from "../models/Expense.js";
//import User from "../models/User.js";
import { updateGamification } from "../services/expenseLogic.js";

/**
 * Tambahkan pengeluaran baru dan update sistem gamifikasi user
 */
export const addExpense = async (req, res) => {
  try {
    const { category, amount, description } = req.body;

    const newExpense = new Expense({
      userId: req.user._id,
      category,
      amount,
      description,
    });

    await newExpense.save();

    const gamify = await updateGamification(req.user._id, newExpense);

    res.status(201).json({
      message: "Pengeluaran berhasil ditambahkan 💸",
      expense: newExpense,
      xpChange: gamify.xpChange,
      newLevel: gamify.newLevel,
      newStreak: gamify.newStreak,
      xpRulesUsed: gamify.xpRules,
      impactFactor: gamify.impactFactor,
    });
  } catch (err) {
    res.status(500).json({
      message: "Gagal menambahkan pengeluaran",
      error: err.message,
    });
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

    // Update field
    expense.category = category || expense.category;
    expense.amount = amount || expense.amount;
    expense.description = description || expense.description;

    await expense.save();
    // Update sistem gamifikasi berdasarkan pengeluaran baru
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

// Hapus pengeluaran
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!expense) return res.status(404).json({ message: "Data pengeluaran tidak ditemukan" });

    res.status(200).json({ message: "Pengeluaran berhasil dihapus 🗑️" });
  } catch (err) {
    res.status(500).json({ message: "Gagal menghapus pengeluaran", error: err.message });
  }
};
