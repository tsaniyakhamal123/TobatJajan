import Income from "../models/Income.js";
import User from "../models/User.js";

export const addIncome = async (req, res) => {
  try {
    const { source, amount, description } = req.body;

    const validSources = ["Gaji Pokok", "Uang Saku", "Freelance", "Project", "Tunjangan", "Lain-lain"];
    if (!validSources.includes(source)) {
      return res.status(400).json({
        message: `Sumber pemasukan tidak valid. Gunakan salah satu dari: ${validSources.join(", ")}`,
      });
    }

    const incomeAmount = Number(amount);
    if (isNaN(incomeAmount) || incomeAmount <= 0) {
      return res.status(400).json({ message: "Nominal pemasukan harus berupa angka positif" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    const newIncome = new Income({
      userId: user._id,
      source,
      amount: incomeAmount,
      description: description?.trim(),
    });

    await newIncome.save();

    user.balance = (user.balance || 0) + incomeAmount;
    user.income = (user.income || 0) + incomeAmount; 
    await user.save();

    res.status(201).json({
      message: "Pemasukan berhasil ditambahkan",
      income: newIncome,
      newBalance: user.balance,
    });
  } catch (err) {
    res.status(500).json({
      message: "Gagal menambah pemasukan",
      error: err.message,
    });
  }
};

// GET semua income user
export const getUserIncome = async (req, res) => {
  try {
    const income = await Income.find({ userId: req.user._id }).sort({ date: -1 });
    res.status(200).json(income);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data pemasukan", error: err.message });
  }
};
