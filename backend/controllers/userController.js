import User from "../models/User.js";

//buat lihat profil user + XP Progress
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
