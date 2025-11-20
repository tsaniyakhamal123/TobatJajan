import dotenv from "dotenv";
dotenv.config();

// Baru impor modul lainnya
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";
import userRoutes from "./routes/userRoutes.js";


connectDB();


const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/user", userRoutes);


app.get("/", (req, res) => res.send("TobatJajan API running 🚀"));

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running locally on port ${PORT}`));
}

export default app;