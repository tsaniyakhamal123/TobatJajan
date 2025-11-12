import User from "../models/User.js";
import { initializeGamification } from "./aiController.js";


// GET user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      balance: user.balance,
      monthlyIncome: user.monthlyIncome,
      goalSaving: user.goalSaving,
      goalDescription: user.goalDescription,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      badges: user.badges,
      aiInsights: user.aiInsights,
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil profil", error: err.message });
  }
};

//initialin income awal
export const addIncome = async (req, res) => {
  const { amount, description } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    user.balance += amount;
    await user.save();

    res.status(200).json({
      message: `Saldo berhasil ditambah sebesar Rp${amount}`,
      newBalance: user.balance,
      description,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ✏️ PUT /api/user/goal
// update goal user (tabungan, deskripsi)
export const updateUserGoal = async (req, res) => {
  try {
    const { goalSaving, goalDescription } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    user.goalSaving = goalSaving ?? user.goalSaving;
    user.goalDescription = goalDescription ?? user.goalDescription;

    await user.save();

    res.status(200).json({
      message: "Goal user berhasil diperbarui 💪",
      goalSaving: user.goalSaving,
      goalDescription: user.goalDescription,
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal memperbarui goal", error: err.message });
  }
};

//update financial profile ganti monthly income, goal saving, dan goal description
export const updateFinancialProfile = async (req, res) => {
  try {
    const { monthlyIncome, goalSaving, goalDescription } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    if (monthlyIncome !== undefined) user.monthlyIncome = monthlyIncome;
    if (goalSaving !== undefined) user.goalSaving = goalSaving;
    if (goalDescription) user.goalDescription = goalDescription;
    await user.save();

    req.user = user;
    await initializeGamification(req, res, true);

    res.json({
      message: "Profil keuangan diperbarui dan gamifikasi disesuaikan ulang 🎯",
    });
  } catch (err) {
    res.status(500).json({
      message: "Gagal memperbarui profil keuangan",
      error: err.message,
    });
  }
};
