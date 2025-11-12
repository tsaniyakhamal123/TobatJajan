import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const aiInsightsSchema = new mongoose.Schema({
  lastAdvice: { type: String },
  lastChallenge: { type: String },
  xpFormulaHint: { type: String },
  xpFormula: { type: String }, // optional formula text from LLM
  xpRules: { type: mongoose.Schema.Types.Mixed, default: {} }, // store as object
  lastUpdate: { type: Date },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  balance: { type: Number, default: 0 }, // running balance
  monthlyIncome: { type: Number, default: 0 }, // declared monthly income
  goalSaving: { type: Number, default: 0 },
  goalDescription: { type: String },

  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  badges: { type: [String], default: [] },

  aiInsights: { type: aiInsightsSchema, default: {} },
  lastExpenseDate: { type: Date }, 
}, {
  timestamps: true,
});

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model("User", userSchema);
