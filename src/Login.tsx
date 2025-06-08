import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
const API_BASE = process.env.REACT_APP_API_URL;

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Login failed");
      } else {
        setSuccess("Login successful!");
        login(email);
        navigate("/tasks");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div style={{
      maxWidth: 400,
      margin: "80px auto",
      padding: 32,
      borderRadius: 16,
      background: "#fff",
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      fontFamily: "Inter, Segoe UI, Arial, sans-serif"
    }}>
      <h2 style={{ color: "#222", marginBottom: 24 }}>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Email:</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 16
          }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Password:</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 16
          }} />
        </div>
        {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
        {success && <div style={{ color: "green", marginBottom: 12 }}>{success}</div>}
        <button type="submit" style={{
          width: "100%",
          background: "#f7df02",
          color: "#222",
          border: "none",
          borderRadius: 8,
          padding: "12px 0",
          fontWeight: 700,
          fontSize: 18,
          cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
        }}>Login</button>
      </form>
    </div>
  );
};

export default Login;