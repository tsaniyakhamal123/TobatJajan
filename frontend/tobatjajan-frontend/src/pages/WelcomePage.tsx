import React, { useState } from "react";
import styles from "./welcomePage.module.css";
import logoChar from "../assets/images/char.png";

function WelcomePage() {
  const [showBubble, setShowBubble] = useState(false);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.charContainer}>
        
        {/* CHAR */}
        <img
          src={logoChar}
          alt="char"
          className={styles.char}
          onClick={() => setShowBubble(!showBubble)}
        />

        {/* BUBBLE */}
        {showBubble && (
          <div className={styles.chatBubbleModern}>
            <h3 className={styles.chatTitle}>Hai! 👋</h3>

            <p className={styles.chatDesc}>
              Halo selamat datang di <b>TobatJajan</b>!  
              Aplikasi ini adalah aplikasi gamifikasi keuangan dengan AI-driven.  
              Apakah kamu sudah pernah login sebelumnya?
            </p>

            <div className={styles.choiceButtons}>
              <button
                className={styles.choiceYes}
                onClick={() => (window.location.href = "/login")}
              >
                Ya
              </button>

              <button
                className={styles.choiceNo}
                onClick={() => (window.location.href = "/register")}
              >
                Tidak
              </button>
            </div>

            <div className={styles.chatTail}></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WelcomePage;
