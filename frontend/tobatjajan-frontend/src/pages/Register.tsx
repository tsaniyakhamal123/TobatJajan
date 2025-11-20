// src/pages/Register.tsx

import React, { useState } from "react";
import axios from "axios";
import styles from "./Register.module.css";
import logoTobatJajan from "../assets/images/logo.png";
import { FiEye, FiEyeOff } from "react-icons/fi";
const API_URL = "http://localhost:5000/api/auth/register";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(API_URL, {
        name,
        email,
        password,
      });

      setSuccess("Registrasi berhasil!");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>
        <div className={styles.logoWrapper}>
          <img src={logoTobatJajan} alt="Logo" className={styles.logo} />
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>nama</label>
          <input
            className={styles.input}
            type="text"
            placeholder="nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className={styles.label}>email</label>
          <input
            className={styles.input}
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className={styles.label}>password</label>

          <div className={styles.passwordWrapper}>
            <input
              className={styles.passwordInput}
              type={showPassword ? "text" : "password"}
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <span
            className={styles.eyeIcon}
            onClick={() => setShowPassword(!showPassword)}
            >
                {showPassword ? <FiEyeOff size={20}/> : <FiEye size={20}/> }
                </span>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <button className={styles.button} disabled={loading}>
            {loading ? "Loading..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
