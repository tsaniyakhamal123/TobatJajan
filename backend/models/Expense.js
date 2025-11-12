import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: {
    type: String,
    required: true,
    enum: [
      "Makan & Minum",
      "Transportasi",
      "Belanja / Lifestyle",
      "Tagihan & Langganan",
      "Edukasi",
      "Tabungan & Investasi",
      "Hiburan",
      "Kesehatan & Self Care",
      "lain lain",
    ],
  },
  amount: { type: Number, required: true },
  description: String,
  date: { type: Date, default: Date.now },
  xpEarned: { type: Number, default: 0 },
});

export default mongoose.model("Expense", expenseSchema);
