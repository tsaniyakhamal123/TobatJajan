import User from "../models/User.js";

export const updateGamification = async (userId, newExpense) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Ambil aturan XP dari hasil inisialisasi AI
  const xpRules = user.aiInsights?.xpRules || {};

  // Ambil XP berdasarkan kategori dari aturan AI
  const xpChange = xpRules[newExpense.category] ?? 0;

  // Update XP, level, streak sesuai logika sederhana
  user.xp = (user.xp || 0) + xpChange;
  if (user.xp < 0) user.xp = 0;
  const newLevel = Math.floor(user.xp / 100) + 1;

  const newStreak = newExpense.amount < (user.monthlyIncome || 0) * 0.05
    ? (user.streak || 0) + 1
    : 0;

  if (newStreak >= 7 && !user.badges.includes("Tobat Jajan Sejati 🔥")) {
    user.badges.push("Tobat Jajan Sejati 🔥");
  }

  user.level = newLevel;
  user.streak = newStreak;

  await user.save();

  newExpense.xpEarned = xpChange;
  await newExpense.save();

  return {
    xpChange,
    newLevel,
    newStreak,
    xpRulesUsed: xpRules,
  };
};
