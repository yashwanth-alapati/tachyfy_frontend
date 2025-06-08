import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const API_BASE = process.env.REACT_APP_API_URL;

const TaskChat: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

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
    if (!input.trim()) return;
    const res = await fetch(`${API_BASE}/tasks/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    setMessages(data.messages);
    setInput("");
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Task Chat</h2>
      <div style={{ marginBottom: 24 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <b>{msg.role === "user" ? "You" : "AI"}:</b> {msg.message}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ width: "70%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }}
          placeholder="Type your message..."
        />
        <button type="submit" style={{ marginLeft: 12, padding: "10px 24px", borderRadius: 6, background: "#222", color: "#fff", border: "none" }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default TaskChat;