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
        {user ? (
          <div style={{ position: "relative" }}>
            <button
              style={profileButtonStyle}
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#222",
                color: "#f7df02",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 12,
                marginRight: 8
              }}>
                {getInitials(user)}
              </div>
              <span style={{ marginRight: 4 }}>{user.split('@')[0]}</span>
              <svg 
                width="12" 
                height="12" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                style={{ transform: isProfileDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
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