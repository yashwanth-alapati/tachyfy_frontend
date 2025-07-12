import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

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

  const profileButtonStyle = {
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid #222",
    background: "transparent",
    color: "#222",
    fontWeight: 500,
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    position: "relative" as const,
    marginRight: 8
  };

  const dropdownStyle = {
    position: "absolute" as const,
    top: "100%",
    right: 0,
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    minWidth: 180,
    zIndex: 1000,
    marginTop: 4
  };

  const dropdownItemStyle = {
    padding: "12px 16px",
    borderBottom: "1px solid #f0f0f0",
    cursor: "pointer",
    fontSize: 14,
    color: "#222",
    textDecoration: "none" as const,
    display: "block",
    transition: "background-color 0.2s"
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
    setIsProfileDropdownOpen(false);
    navigate("/login");
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(false);
    navigate("/profile");
  };

  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    return name.substring(0, 2).toUpperCase();
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
        Tachyfy
      </Link>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Link to="/tasks" style={blackButtonStyle} onClick={handleTasksClick}>
          My Tasks
        </Link>
        {user ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              style={profileButtonStyle}
              onBlur={() => {
                setTimeout(() => setIsProfileDropdownOpen(false), 150);
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#222",
                  color: "#f7df02",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  marginRight: 8
                }}
              >
                {getInitials(user)}
              </div>
              {user}
              <span style={{ marginLeft: 4, fontSize: 12 }}>▼</span>
            </button>
            
            {isProfileDropdownOpen && (
              <div style={dropdownStyle}>
                <div 
                  style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", color: "#666", fontSize: 12 }}
                >
                  Signed in as
                  <div style={{ fontWeight: 600, color: "#222", marginTop: 2 }}>{user}</div>
                </div>
                <Link
                  to="/profile"
                  style={dropdownItemStyle}
                  onClick={handleProfileClick}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  👤 View Profile
                </Link>
                <div
                  style={{...dropdownItemStyle, borderBottom: "none"}}
                  onClick={handleLogout}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  🚪 Sign Out
                </div>
              </div>
            )}
          </div>
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