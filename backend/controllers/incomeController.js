import Income from "../models/Income.js";
import User from "../models/User.js";

// ✅ Tambah pemasukan baru
export const addIncome = async (req, res) => {
  const { source, amount, description } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    // Simpan data income
    const newIncome = new Income({
      userId: user._id,
      source,
      amount,
      description,
    });
    await newIncome.save();

    // Update saldo user
    user.balance += amount;
    await user.save();

    res.status(201).json({
      message: "Pemasukan berhasil ditambahkan 💰",
      income: newIncome,
      newBalance: user.balance,
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal menambah pemasukan", error: err.message });
  }
};

// ✅ Ambil semua income user
export const getUserIncome = async (req, res) => {
  try {
    const income = await Income.find({ userId: req.user._id }).sort({ date: -1 });
    res.status(200).json(income);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data pemasukan", error: err.message });
  }
};
