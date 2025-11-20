// services/expenseLogic.js
import User from "../models/User.js";

const EXPENSE_CATEGORIES = new Set([
  "Makan & Minum",
  "Transportasi",
  "Belanja / Lifestyle",
  "Tagihan & Langganan",
  "Edukasi",
  "Hiburan",
  "Kesehatan & Perawatan Diri",
  "lain lain",
]);

export const updateGamification = async (userId, newExpense) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  if (!user.aiInsights?.xpRules) throw new Error("AI Rules not initialized");

  const xpRules = user.aiInsights.xpRules;
  const monthlyIncome = user.monthlyIncome || 0;

  let baseXP = xpRules[newExpense.category] ?? xpRules["lain lain"] ?? 1;

  if (EXPENSE_CATEGORIES.has(newExpense.category)) {
    baseXP = -Math.abs(baseXP);
  } else {
    baseXP = Math.abs(baseXP); 
  }

  let impactFactor = 0.6; 
  if (monthlyIncome > 0) {
      const impactRatio = newExpense.amount / monthlyIncome;
      if (impactRatio >= 0.5) impactFactor = 1.7;
      else if (impactRatio >= 0.3) impactFactor = 1.4;
      else if (impactRatio >= 0.1) impactFactor = 1.2;
      else if (impactRatio >= 0.05) impactFactor = 1.0;
      else if (impactRatio >= 0.02) impactFactor = 0.8;
  }

  let difficultyMultiplier = 1.0; 
  if (monthlyIncome > 0 && user.goalSaving > 0) {
      const savingDifficulty = user.goalSaving / monthlyIncome;
      if (savingDifficulty > 2.0) difficultyMultiplier = 1.5;
      else if (savingDifficulty > 1.0) difficultyMultiplier = 1.2;
  }

  const xpChange = Math.round(baseXP * impactFactor * difficultyMultiplier);
  user.xp = (user.xp || 0) + xpChange;
  if (user.xp < 0) user.xp = 0;
  const newLevel = Math.floor(user.xp / 100) + 1;

  const newStreak = newExpense.amount < (monthlyIncome || 0) * 0.05
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
    newXP: user.xp,
    newLevel,
    newStreak,
  };
};