import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  source: {
    type: String,
    required: true,
    enum: [
      "Gaji pokok",
      "Uang Saku",
      "Freelance",
      "Project",
      "Tunjangan",
      "lain lain",
    ],
  },
  amount: { type: Number, required: true },
  description: String,
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Income", incomeSchema);
