
import User from "../models/User.js";
import Income from "../models/Income.js";
import Expense from "../models/Expense.js";
import { runGamificationInitialization } from "./aiController.js"; 
import { updateGamification } from "../services/expenseLogic.js";

/**
 * 🚀 KONTROLER UNTUK 'PUT /profile/financials'
 * HANYA untuk 'set nilai awal' Gaji dan Goals.
 * TIDAK ada 'balance' di sini.
 */

export const updateFinancialProfile = async (req, res) => {
  try {
    const { monthlyIncome, goalSaving, goalDescription, longTime } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    user.monthlyIncome = monthlyIncome ?? user.monthlyIncome;
    user.goalSaving = goalSaving ?? user.goalSaving;
    user.goalDescription = goalDescription ?? user.goalDescription;
    user.longTime = longTime ?? user.longTime;

    await user.save();
    const aiOutput = await runGamificationInitialization(user);

    return res.json({
      message: "Profil keuangan disimpan!",
      data: {
        monthlyIncome: user.monthlyIncome,
        goalSaving: user.goalSaving,
        goalDescription: user.goalDescription,
        longTime: user.longTime,
      },
      advice: aiOutput?.advice || "",
    });

  } catch (err) {
    return res.status(500).json({
      message: "Gagal menyimpan profil",
      error: err.message
    });
  }
};



export const handleGetUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userStats = await User.findById(userId).select("name xp level streak balance");
    if (!userStats) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    res.status(200).json(userStats);
  } catch (err) {
    console.error("Error saat mengambil stats user:", err.message);
    res.status(500).json({ message: "Gagal mengambil data statistik", error: err.message });
  }
};


export const getUserHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const incomes = await Income.find({ userId }).sort({ date: -1 });
    const expenses = await Expense.find({ userId }).sort({ date: -1 });

    return res.json({
      message: "Riwayat transaksi berhasil diambil!",
      incomes,
      expenses,
    });

  } catch (err) {
    return res.status(500).json({
      message: "Gagal mengambil riwayat",
      error: err.message,
    });
  }
};

// UPDATE INCOME
export const updateIncome = async (req, res) => {
  try {
    const id = req.params.id;
    const { amount, description, source } = req.body;

    if (!amount || !description || !source) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    const oldIncome = await Income.findById(id);
    if (!oldIncome) return res.status(404).json({ message: "Income tidak ditemukan" });

    const diff = amount - oldIncome.amount; // selisih perubahan

    const updatedIncome = await Income.findByIdAndUpdate(
      id,
      { amount, description, source },
      { new: true }
    );

    await User.findByIdAndUpdate(oldIncome.userId, {
      $inc: { balance: diff }
    });

    res.json({ message: "Income berhasil diupdate", updatedIncome });
  } catch (error) {
    res.status(500).json({ message: "Gagal update income", error: error.message });
  }
};

// UPDATE EXPENSE
export const updateExpense = async (req, res) => {
  try {
    const id = req.params.id;
    const { amount, description, category } = req.body;

    if (!amount || !description || !category) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    const oldExpense = await Expense.findById(id);
    if (!oldExpense) return res.status(404).json({ message: "Expense tidak ditemukan" });

    const diff = amount - oldExpense.amount;

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      { amount, description, category },
      { new: true }
    );

    await User.findByIdAndUpdate(oldExpense.userId, {
      $inc: { balance: -diff }
    });

    res.json({ message: "Expense berhasil diupdate", updatedExpense });
  } catch (error) {
    res.status(500).json({ message: "Gagal update expense", error: error.message });
  }
};


// --- DELETE INCOME ---
export const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; 
    const income = await Income.findById(id);

    if (!income) {
      return res.status(404).json({ message: "Data pemasukan tidak ditemukan" });
    }
    if (income.userId.toString() !== userId) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    const user = await User.findById(userId);
    if (user) {
      user.balance -= income.amount;
      await user.save();
    }

    await income.deleteOne();

    res.status(200).json({ 
      message: "Pemasukan berhasil dihapus", 
      currentBalance: user.balance 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- DELETE EXPENSE ---
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ message: "Data pengeluaran tidak ditemukan" });
    }

    if (expense.userId.toString() !== userId) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }

    const user = await User.findById(userId);
    if (user) {
      user.balance += expense.amount; 
      if (expense.xpEarned > 0) {
        user.xp -= expense.xpEarned;
        if (user.xp < 0) user.xp = 0; 
      }
      
      await user.save();
    }

    await expense.deleteOne();

    res.status(200).json({ 
      message: "Pengeluaran berhasil dihapus", 
      currentBalance: user.balance,
      currentXP: user.xp
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};