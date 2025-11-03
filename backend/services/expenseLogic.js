import User from "../models/User.js";

// 🔥 Gamification logic
export const updateGamification = async (userId, newExpense) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  let xpChange = 0;

  // Aturan XP dengan kategori Bahasa Indonesia
  const rules = {
    "Makan & Minum": -5,
    "Transportasi": -2,
    "Belanja / Lifestyle": -10,
    "Tagihan & Langganan": 0,
    "Edukasi": +10,
    "Tabungan & Investasi": +20,
    "Hiburan": -3,
    "Kesehatan & Perawatan Diri": +5,
  };

  xpChange = rules[newExpense.category] || 0;

  user.xp = (user.xp || 0) + xpChange;
  if (user.xp < 0) user.xp = 0;

  const newLevel = Math.floor(user.xp / 100) + 1;
  const newStreak = newExpense.amount < 50000 ? (user.streak || 0) + 1 : 0;

  if (newStreak === 7 && !user.badges.includes("Tobat Jajan Sejati 🔥")) {
    user.badges.push("Tobat Jajan Sejati 🔥");
  }

  user.level = newLevel;
  user.streak = newStreak;

  await user.save();

  newExpense.xpEarned = xpChange;
  await newExpense.save();

  return { xpChange, newLevel, newStreak };
};
