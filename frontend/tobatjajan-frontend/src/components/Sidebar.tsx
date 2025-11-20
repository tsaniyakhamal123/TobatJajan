// src/components/Sidebar.tsx
import React, { useState } from "react";
import styles from "./Sidebar.module.css";
import { useNavigate } from "react-router-dom";
import logoutIcon from "../assets/images/logout.png";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: () => void;
}

function Sidebar({ isOpen, onClose, onOpenChat }: SidebarProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleLogout = () => {
    if (window.confirm("Yakin mau logout?")) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const handleItemClick = (id?: string, action?: string) => {
    // Chatbot
    if (action === "chat") {
      onOpenChat();
    } 
    // Initial Level → Navigate ke /insert
    else if (action === "initial") {
      navigate("/insert");
    }
    // Scroll ke section
    else if (id) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    // Tutup sidebar pada ukuran mobile
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  const menuItems = [
    { label: "Balance", id: "balanceSection" },
    { label: "Level", id: "levelSection" },
    { label: "Add Transaction", id: "addTransactionSection" },
    { label: "Monthly Review", id: "reviewSection" },
    { label: "Chatbot", action: "chat" },
    { label: "History / Edit", id: "historySection" },

    // === TOMBOL BARU ===
    { label: "Initial Level", action: "initial" },
  ];

  return (
    <>
      <div 
        className={`${styles.overlay} ${isOpen ? styles.show : ""}`} 
        onClick={onClose} 
      />

      <div 
        className={`
          ${styles.sidebar} 
          ${isOpen ? styles.mobileOpen : ""} 
          ${isExpanded ? styles.expanded : styles.collapsed}
        `}
      >
        <div className={styles.toggleBtn} onClick={() => setIsExpanded(!isExpanded)}>
          ☰
        </div>

        <nav className={styles.menu}>
          <div style={{ padding: '0 10px 20px', display: window.innerWidth <= 768 ? 'block' : 'none' }}>
            <h3>Menu</h3>
          </div>

          {menuItems.map((item, index) => (
            <div
              key={index}
              className={styles.menuItem}
              onClick={() => handleItemClick(item.id, item.action)}
            >
              <span>•</span>
              <span className={styles.menuText}>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className={styles.bottomSection}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <img src={logoutIcon} alt="Logout" className={styles.logoutIcon} />
            <span className={styles.logoutText}>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
