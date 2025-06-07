import React from "react";
import { Link } from "react-router-dom";

const buttonStyle: React.CSSProperties = {
  background: "#222",
  color: "#f7df02",
  border: "none",
  borderRadius: 8,
  padding: "10px 22px",
  fontWeight: 600,
  fontSize: 16,
  marginLeft: 8,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  cursor: "pointer",
  transition: "background 0.2s"
};

const AuthButtons: React.FC = () => (
  <div style={{ marginRight: 32 }}>
    <Link to="/login"><button style={buttonStyle}>Login</button></Link>
    <Link to="/signup"><button style={buttonStyle}>Sign Up</button></Link>
  </div>
);

export default AuthButtons;