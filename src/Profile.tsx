import React, { useState } from "react";
import { useAuth } from "./AuthContext";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.split('@')[0] || 'User',
    email: user || '',
    bio: 'AI Assistant enthusiast',
    location: 'Earth',
    joinedDate: 'January 2024'
  });

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    margin: "20px 0"
  };

  const buttonStyle = {
    padding: "8px 16px",
    borderRadius: 6,
    border: "none",
    background: "#f7df02",
    color: "#222",
    fontWeight: 600,
    cursor: "pointer",
    marginRight: 8
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 14,
    marginBottom: 12
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: "#222", marginBottom: 32 }}>
        Profile
      </h1>

      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f7df02, #ffd700)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 700,
              color: "#222",
              marginRight: 20
            }}
          >
            {profileData.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: "#222", margin: 0 }}>
              {profileData.name}
            </h2>
            <p style={{ color: "#666", margin: "4px 0 0 0" }}>{profileData.email}</p>
          </div>
        </div>

        {isEditing ? (
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Name</label>
            <input
              style={inputStyle}
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
            />

            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Bio</label>
            <textarea
              style={{...inputStyle, minHeight: 60, resize: "vertical"}}
              value={profileData.bio}
              onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
            />

            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Location</label>
            <input
              style={inputStyle}
              value={profileData.location}
              onChange={(e) => setProfileData({...profileData, location: e.target.value})}
            />

            <div>
              <button onClick={handleSave} style={buttonStyle}>
                Save Changes
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                style={{...buttonStyle, background: "#f0f0f0"}}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#222", marginBottom: 8 }}>Bio</h3>
              <p style={{ color: "#666", lineHeight: 1.5 }}>{profileData.bio}</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#222", marginBottom: 8 }}>Location</h3>
              <p style={{ color: "#666" }}>{profileData.location}</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#222", marginBottom: 8 }}>Member Since</h3>
              <p style={{ color: "#666" }}>{profileData.joinedDate}</p>
            </div>

            <button onClick={() => setIsEditing(true)} style={buttonStyle}>
              Edit Profile
            </button>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "#222", marginBottom: 16 }}>
          Account Stats
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div style={{ textAlign: "center", padding: 16, background: "#f8f9fa", borderRadius: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#f7df02" }}>12</div>
            <div style={{ color: "#666", fontSize: 14 }}>Tasks Completed</div>
          </div>
          <div style={{ textAlign: "center", padding: 16, background: "#f8f9fa", borderRadius: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#f7df02" }}>5</div>
            <div style={{ color: "#666", fontSize: 14 }}>Active Tasks</div>
          </div>
          <div style={{ textAlign: "center", padding: 16, background: "#f8f9fa", borderRadius: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#f7df02" }}>8h</div>
            <div style={{ color: "#666", fontSize: 14 }}>Time Saved</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 