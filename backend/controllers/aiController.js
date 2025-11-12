import dotenv from "dotenv";
import OpenAI from "openai";
import User from "../models/User.js";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


export const initializeGamification = async (req, res, isInternal = false) => {
  try {
    // Logic Anda untuk mendapatkan user (tidak diubah)
    const user = req.user || (await User.findById(req.user._id));
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    const userProfile = {
      monthlyIncome: user.monthlyIncome || 0,
      goalSaving: user.goalSaving || 0,
      goalDescription: user.goalDescription || "menabung",
    };

    // System prompt Anda (tidak diubah)
    const systemPrompt = `
Kamu adalah asisten finansial bernama TobatJajan.

Tugasmu adalah membuat sistem gamifikasi keuangan yang PERSONALISASI berdasarkan kondisi pengguna.
Kamu harus mengembalikan respons dalam format JSON murni sesuai instruksi di bawah ini.

---

📊 DATA PENGGUNA:
${JSON.stringify(userProfile, null, 2)}

Keterangan:
- monthlyIncome: pendapatan bulanan (dalam rupiah)
- goalSaving: target tabungan utama
- goalDescription: tujuan finansial pengguna

---

💡 ATURAN DASAR:
1. Hitung rasio kesulitan menabung (savingDifficultyRatio):
   savingDifficultyRatio = goalSaving / monthlyIncome
   Gunakan klasifikasi berikut:
   - > 2.0 → sangat sulit → XP reward besar untuk investasi, penalti besar untuk belanja konsumtif.
   - 1.0–2.0 → menantang → XP seimbang, tetap beri insentif menabung dan edukasi.
   - 0.5–1.0 → wajar → XP moderat, penalti ringan.
   - < 0.5 → mudah → XP rendah untuk tabungan, tapi beri ruang untuk hiburan.

2. Hitung dampak nominal transaksi (impactFactor):
   - >=50% dari income → 1.7
   - >=30% → 1.4
   - >=10% → 1.2
   - >=5% → 1.0
   - >=2% → 0.8
   - <2% → 0.6

3. XP final = baseXP(category) × impactFactor × kesulitan.

4. Level naik setiap 100 XP.
5. Jika pengeluaran <5% pendapatan → streak +1.
6. Jika streak ≥7 hari → beri badge “Tobat Jajan Sejati 🔥”.

---

🎮 OUTPUT YANG DIHARAPKAN (JSON MURNI):
{
  "xp": number,
  "level": number,
  "streak": number,
  "badges": [string],
  "xpFormulaHint": string,
  "xpRules": {
    "Makan & Minum": number,
    "Transportasi": number,
    "Belanja / Lifestyle": number,
    "Tagihan & Langganan": number,
    "Edukasi": number,
    "Tabungan & Investasi": number,
    "Hiburan": number,
    "Kesehatan & Perawatan Diri": number
  },
  "advice": string
}

Pastikan output hanya JSON valid tanpa tambahan teks atau markdown.
Gunakan pemahaman finansial logis berdasarkan data user di atas untuk menyesuaikan XP dan nasihatnya.
`;

    // --- PERBAIKAN SINTAKS DIMULAI DI SINI ---

    // Menggunakan sintaks yang benar: openai.chat.completions.create
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      // Meminta output JSON secara eksplisit, sesuai permintaan "JSON MURNI"
      response_format: { type: "json_object" }, 
      // Menggunakan struktur 'messages' yang benar
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          // Kita perlu memicu AI untuk merespons
          content: "Buatkan sistem gamifikasi untuk data pengguna saya.", 
        },
      ],
    });

    // Mengambil output dari 'choices' yang benar
    let raw = completion.choices[0]?.message?.content?.trim() || "";
    
    // --- PERBAIKAN SINTAKS SELESAI ---

    // Logic parsing Anda (tidak diubah, walau mungkin tidak perlu lagi
    // jika response_format: { type: "json_object" } bekerja)
    if (raw.startsWith("```")) raw = raw.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(raw);

    // Logic Anda untuk menyimpan data (tidak diubah)
    user.aiInsights = {
      xpFormulaHint: parsed.xpFormulaHint,
      xpRules: parsed.xpRules,
      lastAdvice: parsed.advice,
      lastUpdate: new Date(),
    };
    user.xp = parsed.xp;
    user.level = parsed.level;
    user.streak = parsed.streak;
    user.badges = parsed.badges;
    await user.save();

    // Logic respons Anda (tidak diubah)
    if (!isInternal) {
      res.json({
        message: "Gamifikasi berhasil diinisialisasi berdasarkan profil user 🎮",
        data: parsed,
      });
    }

    return parsed;
  } catch (err) {
    // Logic error handling Anda (tidak diubah)
    if (!isInternal) {
      res.status(500).json({
        message: "Gagal menginisialisasi gamifikasi",
        error: err.message,
      });
    } else {
      console.error("❌ Error auto re-init gamifikasi:", err.message);
    }
  }
};
/**
 * 📅 MONTHLY EVALUATION
 * Dipanggil di akhir bulan atau dengan tombol “Evaluasi Bulanan”
 * AI menilai performa finansial user bulan ini & memberi tantangan baru.
 */
export const monthlyEvaluation = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    const incomes = await Income.find({ userId: user._id, date: { $gte: startOfMonth } });
    const expenses = await Expense.find({ userId: user._id, date: { $gte: startOfMonth } });

    if (incomes.length === 0 && expenses.length === 0)
      return res.status(400).json({ message: "Belum ada data keuangan bulan ini." });

    const totalIncome = incomes.reduce((a, b) => a + b.amount, 0);
    const totalExpense = expenses.reduce((a, b) => a + b.amount, 0);

    const prompt = `
Kamu adalah TobatJajan, mentor keuangan Gen Z.

User "${user.name}" telah menyelesaikan satu bulan finansial.
Berikan evaluasi berdasarkan data:

- Gaji pokok: Rp${user.monthlyIncome}
- Target tabungan: Rp${user.goalSaving}
- Penghasilan bulan ini: Rp${totalIncome}
- Pengeluaran bulan ini: Rp${totalExpense}
- Level saat ini: ${user.level}
- XP: ${user.xp}
- Streak: ${user.streak}
- Badge: ${user.badges.join(", ")}

Output JSON:
{
  "xpAdjustment": <angka, positif jika performa bagus>,
  "newBadge": "<opsional>",
  "summary": "Analisis keuangan singkat bulan ini",
  "nextChallenge": "Tantangan atau misi untuk bulan depan"
}
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = JSON.parse(response.data.choices[0].message.content);

    user.xp += data.xpAdjustment || 0;
    user.level = Math.floor(user.xp / 100) + 1;
    if (data.newBadge && !user.badges.includes(data.newBadge)) {
      user.badges.push(data.newBadge);
    }
    user.aiInsights = {
      lastAdvice: data.summary,
      lastChallenge: data.nextChallenge,
      lastUpdate: new Date(),
    };
    await user.save();

    res.json({
      message: "✅ Evaluasi bulanan selesai",
      result: data,
      newUserState: {
        xp: user.xp,
        level: user.level,
        badges: user.badges,
      },
    });
  } catch (err) {
    console.error("Error monthlyEvaluation:", err);
    res.status(500).json({ message: "Gagal melakukan evaluasi bulanan", error: err.message });
  }
};
