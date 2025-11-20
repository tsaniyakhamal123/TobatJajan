// controllers/aiInitController.js
import dotenv from "dotenv";
import OpenAI from "openai";
import User from "../models/User.js";
import Income from "../models/Income.js";
import Expense from "../models/Expense.js";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Membuat XP rules awal berdasarkan profile user.
 */
export const runGamificationInitialization = async (user) => {
  try {
    console.log(`[Init] Gamifikasi pertama kali untuk ${user.email}`);

    const userProfile = {
      monthlyIncome: user.monthlyIncome || 0,
      goalSaving: user.goalSaving || 0,
      goalDescription: user.goalDescription || "menabung",
      longTime: user.longTime || "durasi waktu menabung",
    };

    const systemPrompt = `
Kamu adalah TobatJajan, asisten finansial.
Output HANYA JSON:
{
  "xpRules": {},
  "advice": ""
}

DATA:
${JSON.stringify(userProfile, null, 2)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Buatkan xpRules personal saya." }
      ]
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    const userToUpdate = await User.findById(user._id);
    if (!userToUpdate) throw new Error("User tidak ditemukan");

    userToUpdate.aiInsights = {
      xpFormulaHint: "XP dihitung berdasarkan kategori, saving ratio, dan durasi longTime.",
      xpRules: parsed.xpRules,
      lastAdvice: parsed.advice,
      lastUpdate: new Date(),
    };

    userToUpdate.xp = 0;
    userToUpdate.level = 1;
    userToUpdate.streak = 0;
    userToUpdate.badges = [];

    await userToUpdate.save();

    console.log(`Done init gamifikasi untuk ${user.email}`);

    return parsed;  

  } catch (err) {
    console.error("Init error:", err.message);
    return null; 
  }
};


/**
 * AI untuk menghitung XP, streak, dan advice setiap ada income/expense.
 */
export const runAIMicroGamificationEvent = async (user, type, payload) => {
  try {
    const systemPrompt = `
Kamu adalah TobatJajan, mentor finansial Gen Z.
Tugasmu adalah memberi evaluasi SINGKAT untuk event keuangan.

Output WAJIB JSON:
{
  "xpAdjustment": <angka>,
  "streakEffect": <1 | 0 | -1>,
  "levelEffect": 0,
  "advice": "kalimat singkat"
}

===========================
DATA USER:
${JSON.stringify({
  balance: user.balance,
  monthlyIncome: user.monthlyIncome,
  goalSaving: user.goalSaving,
  savingRatio: user.goalSaving / (user.monthlyIncome || 1),
  xp: user.xp,
  level: user.level,
  streak: user.streak,
  xpRules: user.aiInsights?.xpRules || {}
}, null, 2)}

===========================
EVENT:
${JSON.stringify({
  type,
  amount: payload.amount,
  category: payload.category || "",
  description: payload.description,
  date: new Date().toISOString(),
}, null, 2)}

===========================
LOGIKA WAJIB:
1. xpRules digunakan sebagai bobot utama.
2. Jika expense penting → XP kecil (atau negatif jika merusak goal saving).
3. Jika income → XP positif (besar jika nominal signifikan).
4. StreakEffect:
   - +1 jika event mendukung tujuan saving
   - 0 jika netral
   - -1 jika overspending parah
5. Advice:
   - maksimal 1 kalimat
   - relevan dengan kondisi user
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Berikan evaluasi event ini." }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);

  } catch (err) {
    console.error("AI Event error:", err);
    return {
      xpAdjustment: 0,
      streakEffect: 0,
      levelEffect: 0,
      advice: "Lanjutkan aktivitas seperti biasa ya."
    };
  }
};

export const monthlyEvaluation = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const incomes = await Income.find({ userId: user._id });
    const expenses = await Expense.find({ userId: user._id });

    const prompt = `
Kamu adalah TobatJajan, mentor keuangan Gen Z.
User "${user.name}" telah menyelesaikan 1 bulan keuangan.

Data income: ${JSON.stringify(incomes)}
Data expense: ${JSON.stringify(expenses)}

Output JSON:
{
  "xpAdjustment": <angka>,
  "newBadge": "<string opsional>",
  "summary": "",
  "nextChallenge": ""
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" }
    });

    const data = JSON.parse(completion.choices[0].message.content);

    user.xp += data.xpAdjustment;
    user.level = Math.floor(user.xp / 100) + 1;

    if (data.newBadge) {
      user.badges.push(data.newBadge);
    }

    user.aiInsights.lastAdvice = data.summary;
    await user.save();

    res.json({
      message: "Evaluasi bulanan selesai",
      result: data,
      newUserState: {
        xp: user.xp,
        level: user.level,
        badges: user.badges,
      },
    });

  } catch (err) {
    res.status(500).json({ message: "Gagal melakukan evaluasi", error: err.message });
  }
};

//AI untuk chatbot
export const chatWithFinancialAi = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Pertanyaan wajib diisi" });
    }

    const incomes = await Income.find({ userId });
    const expenses = await Expense.find({ userId });

    const user = await User.findById(userId);
    const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpense;

    const expenseByCategory = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

    const expenseDetails = Object.entries(expenseByCategory)
      .map(([cat, amt]) => `- ${cat}: Rp ${amt.toLocaleString("id-ID")}`)
      .join("\n");
    const systemPrompt = `
      Kamu adalah asisten keuangan pribadi yang bernama hematBuddy dari tobatJajan yang pintar, ramah, dan gaul untuk user bernama ${user.name || "Teman"}.

      Berikut adalah data keuangan user saat ini:
      - Total Pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}
      - Total Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}
      - Saldo Saat Ini: Rp ${balance.toLocaleString("id-ID")}

      Rincian Pengeluaran per Kategori:
      ${expenseDetails}

      Tugasmu:
      1. Jawab pertanyaan user berdasarkan data keuangan di atas.
      2. Beri warning halus kalau saldo tipis.
      3. Beri insight kalau ada kategori boros.
      4. Jawab santai, singkat, bahasa sehari-hari.
      5. Jangan rekomendasi investasi spesifik.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      max_tokens: 150,
    });

    const aiResponse = completion.choices[0].message.content;

    res.status(200).json({
      reply: aiResponse,
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ message: "Maaf, AI lagi pusing (server error)." });
  }
};

