import axios from "axios";
import Expense from "../models/Expense.js";
import Advice from "../models/Advice.js";

// Generate saran AI berdasarkan expense user
export const generateAdvice = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id });
    if (expenses.length === 0)
      return res.status(400).json({ message: "No expense data found" });

    const summary = expenses
      .map((e) => `${e.category}: Rp${e.amount}`)
      .join(", ");

    const prompt = `
You are a friendly financial coach named TobatJajan for Gen Z users.
Analyze this user's spending and generate:
1. A short spending summary.
2. 2-3 practical money-saving tips in Bahasa Indonesia.
3. One fun weekly challenge name (e.g. “Misi Tobat Mingguan”).

User's expenses:
${summary}
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const message = response.data.choices[0].message.content;
    const advice = new Advice({ userId: req.user._id, message });
    await advice.save();

    res.json({ advice: message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
