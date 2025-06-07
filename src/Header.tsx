import React from "react";
import { Link } from "react-router-dom";
import AuthButtons from "./AuthButtons";

const Header: React.FC = () => (
  <header style={{
    width: "100%",
    height: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    borderBottom: "none",
    background: "#f7df02",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
    fontFamily: "Inter, Segoe UI, Arial, sans-serif",
    zIndex: 10
  }}>
    <div style={{ marginLeft: 32 }}>
      <Link to="/" style={{ textDecoration: "none" }}>
        <button style={{
          background: "#fff",
          color: "#222",
          border: "none",
          borderRadius: 8,
          padding: "10px 22px",
          fontWeight: 600,
          fontSize: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          cursor: "pointer",
          transition: "background 0.2s"
        }}>Home</button>
      </Link>
    </div>
    <div style={{
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      fontWeight: 900,
      fontSize: 28,
      letterSpacing: 2,
      color: "#222",
      fontFamily: "Inter, Segoe UI, Arial, sans-serif"
    }}>
      <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
        easydo.ai
      </Link>
    </div>
    <AuthButtons />
  </header>
);

export default Header;