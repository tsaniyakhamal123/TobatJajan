// src/components/AdvicePopup.tsx
import React from "react";
import "./AdvicePopup.css";
import char from "../assets/images/char.png";

interface AdvicePopupProps {
  advice?: string;
  summary?: string;
  challenge?: string;
  level?: number;
  mode?: "advice" | "review";
  onClose: () => void;
}

export default function AdvicePopup({
  advice,
  summary,
  challenge,
  level,
  mode = "advice",
  onClose,
}: AdvicePopupProps) {
  return (
    <div className="overlay">
      <div className="popup-box">
        <img src={char} alt="char" className="popup-char" />

        {mode === "advice" ? (
          <>
            <h2 className={`popup-title ${mode === "advice" ? "advice" : ""}`}>
                {mode === "advice" ? "AI Advice 💬" : "Monthly Review 🎉"}
                </h2>
            <p className="popup-text">{advice}</p>
          </>
        ) : (
          <>
            <h2 className="popup-title">Monthly Review 🎉</h2>

            <p className="popup-level">
              Level kamu sekarang: <strong>{level}</strong>
            </p>

            <div className="popup-section">
              <h3 className="popup-sub">📌 Summary</h3>
              <p className="popup-text">{summary}</p>
            </div>

            <div className="popup-section">
              <h3 className="popup-sub">🎯 Next Challenge</h3>
              <p className="popup-text">{challenge}</p>
            </div>
          </>
        )}

        <button className="popup-close" onClick={onClose}>
          Tutup
        </button>
      </div>
    </div>
  );
}
