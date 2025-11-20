// src/pages/dashboard.tsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "./dashboard.module.css";
import logo from "../assets/images/logo.png";
import char from "../assets/images/char.png";
import AdvicePopup from "../components/AdvicePopup";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

interface Activity {
  _id: string;
  type: "income" | "expense";
  category?: string;
  source?: string;
  description: string;
  amount: number;
  date: string;
}

interface MonthlyReview {
  summary: string;
  nextChallenge: string;
  level: number;
}

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

// =====================
// API URLS (perbaikan: getStatus & history = token based)
// =====================
const API_URL_GETSTATUS = "http://localhost:5000/api/user/getStatus";
const API_URL_HISTORY = "http://localhost:5000/api/user/history";

const API_URL_EXPENSE_BASE = "http://localhost:5000/api/expense";
const API_URL_INCOME_BASE = "http://localhost:5000/api/income";

const API_URL_EXPENSE_ITEM = "http://localhost:5000/api/user/updateExpense/:id";
const API_URL_INCOME_ITEM = "http://localhost:5000/api/user/updateIncome/:id";

// Delete endpoints (memerlukan transaction id)
const API_URL_DELETE_INCOME = "http://localhost:5000/api/user/deleteIncome/:id";
const API_URL_DELETE_EXPENSE = "http://localhost:5000/api/user/deleteExpense/:id";

const API_URL_MONTHLYREVIEW = "http://localhost:5000/api/ai/review";
const API_URL_CHAT = "http://localhost:5000/api/ai/chat";

function Dashboard() {
  const navigate = useNavigate();

  // =====================
  // STATE TRANSACTION
  // =====================
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // USER STATS
  const [sname, setSname] = useState("User");
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<Activity[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);

  // POPUPS
  const [advicePopupOpen, setAdvicePopupOpen] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");

  // EDIT POPUP
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("income");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // MONTHLY REVIEW
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewData, setReviewData] = useState<MonthlyReview | null>(null);

  // CHATBOT STATE
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [chatWindowOpen, setChatWindowOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: "bot", text: "Halo! Aku asisten keuanganmu. Ada yang bisa dibantu hari ini?" }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const XP_FOR_NEXT_LEVEL = 100;

  // Animation config for framer-motion
  const floatAnimation: any = {
    y: [0, -10, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "loop" as const,
      ease: "easeInOut",
    },
  };

  const incomeCategories = ["Gaji pokok", "Uang Saku", "Freelance", "Project", "Tunjangan", "lain lain"];
  const expenseCategories = ["Makan & Minum", "Transportasi", "Belanja / Lifestyle", "Tagihan & Langganan", "Edukasi", "Tabungan & Investasi", "Hiburan", "Kesehatan & Self Care", "lain lain"];
  const availableCategories = type === "income" ? incomeCategories : expenseCategories;

  // =====================
  // HELPERS & FETCH
  // =====================
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // safe resolver hanya mengganti :id kalau ada
  const resolveUrlWithTransactionId = (template: string, id: string) => {
    if (!id) return template;
    if (template.includes(":id")) return template.replace(":id", id);
    return `${template}/${id}`;
  };

  // ------------------------------------
  // NOTE: getStatus & history are token-based endpoints (no :id in URL)
  // ------------------------------------
  const fetchUserStatus = async () => {
    setStatusLoading(true);
    try {
      const url = API_URL_GETSTATUS; // token-based endpoint
      console.log("[DEBUG] fetchUserStatus URL:", url);
      console.log("[DEBUG] fetchUserStatus Headers:", getAuthHeader());

      const res = await axios.get(url, { headers: getAuthHeader() });
      const data = res.data || {};
      setXp(data.xp ?? data.user?.xp ?? 0);
      setLevel(data.level ?? data.user?.level ?? 1);
      setStreak(data.streak ?? data.user?.streak ?? 0);
      setBalance(data.balance ?? data.user?.balance ?? 0);

      const nameFromRes = data.name ?? data.user?.name ?? localStorage.getItem("name");
      if (nameFromRes) setSname(nameFromRes);
    } catch (err: any) {
      console.error("[ERROR] fetchUserStatus:", err?.response ?? err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/login");
      }
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const url = API_URL_HISTORY; // token-based endpoint
      console.log("[DEBUG] fetchHistory URL:", url);
      console.log("[DEBUG] fetchHistory Headers:", getAuthHeader());
      const res = await axios.get(url, { headers: getAuthHeader() });
      const data = res.data || {};
      const incomes = (data.incomes || []).map((i: any) => ({
        _id: i._id,
        type: "income",
        source: i.source || i.category || i.description || "",
        description: i.description || "",
        amount: i.amount || 0,
        date: i.date || new Date().toISOString(),
      }));

      const expenses = (data.expenses || []).map((e: any) => ({
        _id: e._id,
        type: "expense",
        category: e.category || e.description || "",
        description: e.description || "",
        amount: e.amount || 0,
        date: e.date || new Date().toISOString(),
      }));

      const sorted = [...incomes, ...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(sorted);
    } catch (err) {
      console.error("[ERROR] fetchHistory:", err);
      // jika unauthorized -> redirect login
      if ((err as any)?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchUserStatus();
    fetchHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatWindowOpen]);

  // HANDLERS
  const openEditModal = (item: Activity) => {
    setEditOpen(true);
    setEditId(item._id);
    setEditType(item.type);
    setEditAmount(String(item.amount));
    setEditDescription(item.description);
    setEditCategory(item.type === "income" ? (item.source || "") : (item.category || ""));
  };

  const handleDelete = async (id: string, type: "income" | "expense") => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data ${type === "income" ? "pemasukan" : "pengeluaran"} ini?`)) {
      return;
    }

    try {
      const template = type === "income" ? API_URL_DELETE_INCOME : API_URL_DELETE_EXPENSE;
      const url = resolveUrlWithTransactionId(template, id);
      console.log("[DEBUG] DELETE URL:", url, "Headers:", getAuthHeader());

      const res = await axios.delete(url, { headers: getAuthHeader() });

      if (res.data.currentBalance !== undefined) setBalance(res.data.currentBalance);
      if (res.data.currentXP !== undefined) setXp(res.data.currentXP);

      setSuccess("Data berhasil dihapus!");
      fetchHistory();
      if (res.data.currentBalance === undefined) fetchUserStatus();

      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      console.error("Gagal menghapus:", err);
      alert("Gagal menghapus data: " + (err.response?.data?.message || err.message));
    }
  };

  const saveEdit = async () => {
    try {
      const userId = localStorage.getItem("userId"); 
      if (!editAmount || Number(editAmount) <= 0 || !editDescription || !editCategory) {
        return alert("Isi semua field!");
      }

      const body: any = {
        amount: Number(editAmount),
        description: editDescription,
      };

      let url = "";
      if (editType === "income") {
        url = resolveUrlWithTransactionId(API_URL_INCOME_ITEM, editId);
        body.source = editCategory;
      } else {
        url = resolveUrlWithTransactionId(API_URL_EXPENSE_ITEM, editId);
        body.category = editCategory;
      }

      console.log("[DEBUG] PATCH URL:", url, "Body:", body, "Headers:", getAuthHeader());
      await axios.patch(url, body, { headers: getAuthHeader() });

      setEditOpen(false);
      fetchHistory();
      fetchUserStatus();
      setSuccess("Transaksi berhasil diupdate!");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      console.error("Gagal update:", err);
      alert("Gagal update: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");

    const userId = localStorage.getItem("userId"); 
    if (!localStorage.getItem("token")) { setError("Sesi invalid. Login ulang."); setLoading(false); return; }

    if (!amount || Number(amount) <= 0) { setError("Jumlah tidak valid."); setLoading(false); return; }
    if (!description || !category) { setError("Deskripsi dan kategori wajib diisi."); setLoading(false); return; }

    try {
      const amt = Number(amount);
      const url = type === "income" ? API_URL_INCOME_BASE : API_URL_EXPENSE_BASE;
      const body = type === "income"
        ? { amount: amt, description, source: category /*, userId */ }
        : { amount: amt, description, category /*, userId */ };

      console.log("[DEBUG] POST URL:", url, "Body:", body, "Headers:", getAuthHeader());
      const res = await axios.post(url, body, { headers: getAuthHeader() });
      const data = res.data || {};

      if (data.balance !== undefined) setBalance(data.balance);
      if (data.xp !== undefined) setXp(data.xp);
      if (data.level !== undefined) setLevel(data.level);
      if (data.streak !== undefined) setStreak(data.streak);
      if (data.ai) {
        setAiAdvice(data.ai.advice || "");
        if (data.ai.advice) setAdvicePopupOpen(true);
      }
      setAmount(""); setCategory(""); setDescription("");
      fetchUserStatus(); fetchHistory();
      setSuccess(data.message || "Transaksi berhasil!");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Gagal transaksi");
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyReview = async () => {
    try {
      const res = await axios.get(API_URL_MONTHLYREVIEW, { headers: getAuthHeader() });
      const result = res.data.result;
      const newState = res.data.newUserState;
      setReviewData({ summary: result.summary, nextChallenge: result.nextChallenge, level: newState.level });
      setReviewOpen(true);
    } catch (err) {
      console.error("[ERROR] getMonthlyReview:", err);
      alert("Gagal mengambil monthly review");
    }
  };

  // CHATBOT HANDLER
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();

    setChatMessages((prev) => [
      ...prev,
      { sender: "user", text: userText },
      { sender: "bot", text: "Sedang mengetik..." }
    ]);

    setChatInput("");

    try {
      const res = await axios.post(
        API_URL_CHAT,
        { question: userText },
        { headers: getAuthHeader(), timeout: 20000 }
      );

      let botReply = "";
      if (res && res.data) {
        if (typeof res.data.reply === "string" && res.data.reply.trim()) {
          botReply = res.data.reply.trim();
        } else if (typeof res.data.result === "string" && res.data.result.trim()) {
          botReply = res.data.result.trim();
        } else if (res.data.answer && typeof res.data.answer === "string") {
          botReply = res.data.answer.trim();
        } else {
          botReply = `Respon: ${JSON.stringify(res.data)}`;
        }
      } else {
        botReply = "Tidak ada data dari server.";
      }

      setChatMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = { sender: "bot", text: botReply };
        }
        return updated;
      });
    } catch (err: any) {
      let errMsg = "Ups! AI-nya lagi error nih.";
      if (err.response?.data) {
        errMsg = err.response.data.message || err.response.data.error || "Error server";
      }
      setChatMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = { sender: "bot", text: errMsg };
        }
        return updated;
      });
    }
  };

  const handleCharClick = () => {
    if (!chatWindowOpen) setBubbleOpen(!bubbleOpen);
  };

  const openFullChat = () => {
    setBubbleOpen(false);
    setChatWindowOpen(true);
  };

  // RENDER 
  return (
    <div className={styles.pageWrapper}>
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onOpenChat={openFullChat}
      />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <button
            className={styles.hamburgerBtn}
            onClick={() => setMobileSidebarOpen(true)}
          >
            ☰
          </button>

          <img src={logo} className={styles.logo} alt="logo" />
          <h1 className={styles.headerTitle}>halo {sname}!</h1>
        </div>

        <div id="levelSection" className={styles.card} style={{ background: "#85B64C" }}>
          <h2 className={styles.title}>Your Progress</h2>
          {statusLoading ? <p>Loading...</p> : (
            <>
              <div className={styles.progressGrid}>
                <div className={styles.progressItem}><h3>Level</h3><p>{level}</p></div>
                <div className={styles.progressItem}><h3>Streak 🔥</h3><p>{streak}</p></div>
                <div className={styles.progressItem}><h3>Total XP</h3><p>{xp}</p></div>
              </div>
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBar} style={{ width: `${(xp / XP_FOR_NEXT_LEVEL) * 100}%` }} />
              </div>
              <p className={styles.xpText}>{xp}/{XP_FOR_NEXT_LEVEL} xp menuju level berikutnya</p>
            </>
          )}
        </div>

        <div id="balanceSection" className={styles.card} style={{ background: "#558B2F" }}>
          <h2 className={styles.title}>Your Balance</h2>
          <p className={styles.balanceText}>Rp {balance.toLocaleString("id-ID")}</p>
        </div>

        <div id="addTransactionSection" className={styles.card} style={{ background: "#558B2F" }}>
          <h2 className={styles.title}>Add Transaction</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label}>Description</label>
            <input className={styles.input} value={description} onChange={(e) => setDescription(e.target.value)} />
            <label className={styles.label}>Category</label>
            <select className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category</option>
              {availableCategories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <label className={styles.label}>Amount</label>
            <input className={styles.input} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div className={styles.radioGroup}>
              <label className={styles.radioBtn}>
                <input type="radio" checked={type === "income"} onChange={() => { setType("income"); setCategory(""); }} /> income
              </label>
              <label className={styles.radioBtn}>
                <input type="radio" checked={type === "expense"} onChange={() => { setType("expense"); setCategory(""); }} /> expense
              </label>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.success}>{success}</p>}
            <button className={styles.button} disabled={loading}>{loading ? "Loading..." : "Add"}</button>
          </form>
        </div>

        <div id="historySection" className={styles.card} style={{ background: "#558B2F" }}>
          <h2 className={styles.title}>Recent History</h2>
          {history.length === 0 ? <p className={styles.historyPlaceholder}>Belum ada riwayat transaksi</p> : (
            <ul className={styles.historyList}>
              {history.map((item, i) => (
                <li
                  key={i}
                  className={`${styles.historyItem} ${item.type === "income" ? styles.income : styles.expense}`}>
                  <strong>{item.type === "income" ? "+" : "-"}Rp {item.amount.toLocaleString("id-ID")}</strong>
                  {" "}| {item.type === "income" ? item.source : item.category} - {item.description} <br />
                  <span className={styles.historyDate}>{new Date(item.date).toLocaleString("id-ID")}</span>

                  <div style={{ marginTop: "5px" }}>
                    <button className={styles.editBtn} onClick={() => openEditModal(item)}>✏️ Edit</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(item._id, item.type)}>🗑️ Hapus</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div id="reviewSection" className={styles.card} style={{ background: "#558B2F" }}>
          <h2 className={styles.title}>Get Monthly Review</h2>
          <button className={styles.button} onClick={getMonthlyReview}>Get Monthly Review</button>
        </div>
      </div>

      <div className={styles.charContainer}>
        <AnimatePresence>
          {bubbleOpen && (
            <motion.div
              className={styles.speechBubble}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            >
              <strong>Hai {sname}! 👋</strong>
              <p style={{ margin: "5px 0 0", fontSize: "13px" }}>
                Mau curhat keuangan atau tanya saldo?
              </p>
              <div className={styles.bubbleBtnGroup}>
                <button className={`${styles.bubbleBtn} ${styles.btnPrimary}`} onClick={openFullChat}>Chat Yuk!</button>
                <button className={`${styles.bubbleBtn} ${styles.btnSecondary}`} onClick={() => setBubbleOpen(false)}>Nanti</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.img
          src={char}
          alt="Chatbot Char"
          className={styles.charImage}
          animate={floatAnimation}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCharClick}
        />
      </div>

      <AnimatePresence>
        {chatWindowOpen && (
          <motion.div className={styles.chatWindow} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}>
            <div className={styles.chatHeader}>
              <span>Asisten Keuangan 🤖</span>
              <button className={styles.closeChatBtn} onClick={() => setChatWindowOpen(false)}>&times;</button>
            </div>
            <div className={styles.chatBody}>
              {chatMessages.map((msg, i) => (
                <div key={i} className={`${styles.msgRow} ${msg.sender === 'bot' ? styles.bot : styles.user}`}>
                  <div className={styles.msgBubble}>{msg.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form className={styles.chatFooter} onSubmit={handleSendMessage}>
              <input
                className={styles.chatInput}
                placeholder="Ketik pesan..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className={styles.sendBtn}>➤</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {editOpen && (
        <div className={styles.editPopupOverlay}>
          <div className={styles.editPopupBox}>
            <div className={styles.editPopupImageWrapper}><img src={char} alt="char" className={styles.editPopupImage} /></div>
            <h3 className={styles.editPopupTitle}>Edit {editType === "income" ? "Pemasukan" : "Pengeluaran"}</h3>

            <input
              className={styles.editPopupInput}
              placeholder="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />

            <select className={styles.editPopupInput} value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
              <option value="">{editType === "income" ? "Pilih sumber" : "Pilih kategori"}</option>
              {(editType === "income" ? incomeCategories : expenseCategories).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <input
              className={styles.editPopupInput}
              type="number"
              placeholder="Amount"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
            />

            <button className={styles.editPopupBtnSave} onClick={saveEdit}>Simpan</button>
            <button className={styles.editPopupBtnCancel} onClick={() => setEditOpen(false)}>Batal</button>
          </div>
        </div>
      )}

      {advicePopupOpen && <AdvicePopup advice={aiAdvice} onClose={() => setAdvicePopupOpen(false)} />}
      {reviewOpen && reviewData && (
        <AdvicePopup advice={`Level: ${reviewData.level}\n\nSummary: ${reviewData.summary}\n\nNext Challenge: ${reviewData.nextChallenge}`} onClose={() => setReviewOpen(false)} />
      )}
    </div>
  );
}

export default Dashboard;
