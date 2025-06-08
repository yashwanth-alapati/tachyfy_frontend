import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const API_BASE = process.env.REACT_APP_API_URL;

const tools = [
  { name: "Google Calendar", id: "calendar" },
  { name: "Gmail", id: "gmail" },
  { name: "Slack", id: "slack" },
  { name: "Notion", id: "notion" },
  { name: "Zoom", id: "zoom" },
  // Add more tools here
];

const TaskChat: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [showTools, setShowTools] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetch(`${API_BASE}/tasks/${id}/messages`)
      .then(res => res.json())
      .then(setMessages);
  }, [id, user, navigate]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages(data.messages);
      setInput("");
    } finally {
      setLoading(false);
    }
  };

  const handleToolClick = (toolId: string) => {
    setShowTools(false);
    setInput(prev => `[${toolId}] ` + prev);
    setSearch("");
  };

  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // You can implement file upload logic here
      alert(`Selected file: ${file.name}`);
    }
  };

  // Filter tools based on search
  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 32 }}>
      <h2>Task Chat</h2>
      <div style={{ marginBottom: 24 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <b>{msg.role === "user" ? "You" : "AI"}:</b> {msg.message}
          </div>
        ))}
        {loading && (
          <div style={{ color: "#888", fontStyle: "italic", marginTop: 12 }}>
            Working...
          </div>
        )}
      </div>
      <form onSubmit={handleSend} style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
          {/* Attach File Button */}
          <button
            type="button"
            onClick={handleAttachClick}
            style={{
              marginRight: 8,
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #ddd",
              background: "#f7df02",
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center"
            }}
            disabled={loading}
          >
            <span role="img" aria-label="attach file" style={{ fontSize: 18, marginRight: 4 }}>➕</span>
            File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          {/* Tools Button */}
          <button
            type="button"
            onClick={() => setShowTools(v => !v)}
            style={{
              marginRight: 8,
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #ddd",
              background: "#f7df02",
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center"
            }}
            disabled={loading}
          >
            <span role="img" aria-label="tools" style={{ fontSize: 18, marginRight: 4 }}>🛠️</span>
            Tools
          </button>
          {showTools && (
            <div style={{
              position: "absolute",
              left: 110,
              top: "110%",
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              zIndex: 10,
              minWidth: 200
            }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tools..."
                style={{
                  width: "90%",
                  margin: "10px 5%",
                  padding: "6px 8px",
                  borderRadius: 4,
                  border: "1px solid #eee"
                }}
                autoFocus
              />
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {filteredTools.length === 0 && (
                  <div style={{ padding: "10px 16px", color: "#888" }}>No tools found</div>
                )}
                {filteredTools.map(tool => (
                  <div
                    key={tool.id}
                    onClick={() => handleToolClick(tool.name)}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f0f0f0",
                      fontWeight: 500
                    }}
                    onMouseDown={e => e.preventDefault()} // Prevent input blur
                  >
                    {tool.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ width: "70%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button
          type="submit"
          style={{
            marginLeft: 12,
            padding: "10px 24px",
            borderRadius: 6,
            background: loading ? "#aaa" : "#222",
            color: "#fff",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer"
          }}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default TaskChat;