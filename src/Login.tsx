import React from "react";

const Login: React.FC = () => (
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
    <form>
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Email:</label>
        <input type="email" required style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #ddd",
          fontSize: 16
        }} />
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Password:</label>
        <input type="password" required style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #ddd",
          fontSize: 16
        }} />
      </div>
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

export default Login;