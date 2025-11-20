import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const aiInsightsSchema = new mongoose.Schema({
  lastAdvice: { type: String },
  lastChallenge: { type: String },
  xpFormulaHint: { type: String },
  xpFormula: { type: String },
  xpRules: { type: mongoose.Schema.Types.Mixed, default: {} }, 
  lastUpdate: { type: Date },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  balance: { type: Number, default: 0 }, 
  monthlyIncome: { type: Number, default: 0 }, 
  goalSaving: { type: Number, default: 0 },
  goalDescription: { type: String },
  longTime:{type: String},

  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  badges: { type: [String], default: [] },

  aiInsights: { type: aiInsightsSchema, default: {} },
  lastExpenseDate: { type: Date }, 
}, {
  timestamps: true,
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model("User", userSchema);
