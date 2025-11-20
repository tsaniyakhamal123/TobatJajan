// src/pages/InsertPage.tsx

import React, { useState } from "react";
import axios from "axios";
import styles from "./inser.module.css";
import logoChar from "../assets/images/char.png";

const API_URL = "/api/user/update";
const token = localStorage.getItem("token");

function InsertPage() {
  const [monthlyIncome, setIncome] = useState("");
  const [goalSaving, setGoal] = useState("");
  const [goalDescription, setDescription] = useState("");
  const [longTime, setLongTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showBubble, setShowBubble] = useState(false);

  const [aiOutput, setAiOutput] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setAiOutput(null);

    try {
      const isAnyFilled =
        monthlyIncome !== "" ||
        goalSaving !== "" ||
        goalDescription !== "" ||
        longTime !== "";

      if (isAnyFilled) {
        const res = await axios.put(
          API_URL,
          {
            monthlyIncome,
            goalSaving,
            goalDescription,
            longTime,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.data.advice) {
          setAiOutput(JSON.stringify(res.data.advice, null, 2));
          setLoading(false);
          return;
        }

        setSuccess("Halo selamat datang di TobatJajan!");
      }
    } catch (err: any) {
      console.log("Update error diabaikan:", err);
    } finally {
      setLoading(false);

      if (!aiOutput) {
        window.location.href = "/dashboard";
      }
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>

        {/* TITLE DIPISAH */}
        <h2 className={styles.initialTitle}>Initial Level</h2>

        {/* LOGO + BUBBLE */}
        <div className={styles.logoWrapper}>

          {/* Avatar */}
          <img
            src={logoChar}
            alt="Logo"
            className={styles.logo}
            onClick={() => setShowBubble(!showBubble)}
            style={{ cursor: "pointer" }}
          />

          {/* Bubble Chat */}
          {showBubble && (
            <div className={styles.chatBubbleModern}>
              <h3 className={styles.chatTitle}>Hai! 👋</h3>
              <p className={styles.chatDesc}>
                Masukkan pendapatan bulanan dan wishlist kamu.  
                TobatJajan bakal bantuin kamu buat nabung! 💚
              </p>

              <div className={styles.chatButtons}>
                <button
                  className={styles.chatPrimary}
                  onClick={() => setShowBubble(false)}
                >
                  Close
                </button>
              </div>

              <div className={styles.chatTail}></div>
            </div>
          )}
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>Pendapatan Bulanan</label>
          <input
            className={styles.input}
            type="number"
            placeholder="monthlyIncome"
            value={monthlyIncome}
            onChange={(e) => setIncome(e.target.value)}
          />

          <label className={styles.label}>Wishlist Price</label>
          <input
            className={styles.input}
            type="number"
            placeholder="wishlist price"
            value={goalSaving}
            onChange={(e) => setGoal(e.target.value)}
          />

          <label className={styles.label}>Wishlist (deskripsi)</label>
          <input
            className={styles.input}
            type="text"
            placeholder="wishlist description"
            value={goalDescription}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className={styles.label}>Target Waktu (misal: 3 bulan)</label>
          <input
            className={styles.input}
            type="text"
            placeholder="ex: 3 bulan"
            value={longTime}
            onChange={(e) => setLongTime(e.target.value)}
          />

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <button className={styles.button} disabled={loading}>
            {loading ? "Loading..." : "Next"}
          </button>
        </form>
      </div>

      {/* POPUP AI */}
      {aiOutput && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupBox}>
            <div className={styles.popupImageWrapper}>
              <img src={logoChar} alt="char" className={styles.popupImage} />
            </div>

            <h3 className={styles.popupTitle}>Saran dari TobatJajan ✨</h3>

            <pre className={styles.popupAdvice}>{aiOutput}</pre>

            <button
              className={styles.popupClose}
              onClick={() => setAiOutput(null)}
            >
              Tutup
            </button>

            <button
              className={styles.popupDashboard}
              onClick={() => (window.location.href = "/dashboard")}
            >
              Lanjut ke Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InsertPage;
