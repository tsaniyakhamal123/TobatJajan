import mongoose from "mongoose";

const adviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Advice", adviceSchema);
