import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const blackButtonStyle = {
    padding: "6px 16px",
    borderRadius: 6,
    border: "none",
    background: "#222",
    color: "#fff",
    fontWeight: 600,
    fontSize: 16,
    textDecoration: "none" as const,
    marginRight: 8,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    cursor: "pointer"
  };

  const logoutButtonStyle = {
    ...blackButtonStyle,
    background: "#f7df02",
    color: "#222",
    marginRight: 0
  };

  // If not logged in, clicking Tasks redirects to login
  const handleTasksClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      navigate("/login");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px",
        background: "#f7df02",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Link
        to="/"
        style={{
          fontWeight: 700,
          fontSize: 22,
          color: "#222",
          textDecoration: "none",
          letterSpacing: 1,
        }}
      >
        easydoAI
      </Link>
      <div>
        <Link to="/tasks" style={blackButtonStyle} onClick={handleTasksClick}>
          Tasks
        </Link>
        {user ? (
          <>
            <span style={{ marginRight: 16, color: "#222", fontWeight: 500 }}>{user}</span>
            <button onClick={handleLogout} style={logoutButtonStyle}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={blackButtonStyle}>
              Login
            </Link>
            <Link to="/signup" style={blackButtonStyle}>
              Signup
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;